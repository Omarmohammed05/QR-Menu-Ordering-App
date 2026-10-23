import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { like, sql } from "drizzle-orm";
import { db, pool } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { createRestaurant } from "@/server/repos/restaurants";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";
import { ActionError } from "@/server/actions/secure";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  listMenu,
  moveCategory,
  moveItem,
  renameCategory,
  setItemAvailability,
  updateItem,
  type MenuSnapshot,
  type MenuUser,
} from "@/server/services/menu";

const SUFFIX = `menu-${Date.now().toString(36)}`;

async function seedUser(key: string): Promise<MenuUser> {
  const [row] = await db
    .insert(user)
    .values({
      id: `u_${SUFFIX}_${key}`,
      name: key,
      email: `${key}@${SUFFIX}.test`,
      emailVerified: true,
    })
    .returning();
  return { id: row.id, superAdmin: row.superAdmin };
}

async function seedRestaurant(key: string) {
  return createRestaurant({ slug: `${SUFFIX}-${key}`, name: { ar: `مطعم ${key}` } });
}

async function memberOf(restaurantId: string, menuUser: MenuUser, role: "owner" | "manager" | "staff") {
  await createRestaurantRepo(restaurantId).members.add(menuUser.id, role);
}

const categoryInput = (restaurantId: string, nameAr: string, nameEn?: string) =>
  nameEn ? { restaurantId, nameAr, nameEn } : { restaurantId, nameAr };

const itemInput = (restaurantId: string, categoryId: string, nameAr: string, price = "12.50") => ({
  restaurantId,
  categoryId,
  nameAr,
  price,
  isAvailable: true,
});

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "src/server/db/migrations" });
});

afterAll(async () => {
  // Tenant rows are created fresh each run; cascade deletes clean the menu.
  await db.delete(user).where(like(user.id, `u_${SUFFIX}%`));
  await db.execute(sql`DELETE FROM restaurants WHERE slug LIKE ${`${SUFFIX}%`}`);
  await pool.end();
});

describe("menu service (tenant scoping, RBAC menu.edit, integer piastres)", () => {
  it("creates categories and items, grouped by category with converted prices", async () => {
    const owner = await seedUser("owner-create");
    const restaurant = await seedRestaurant("create");
    await memberOf(restaurant.id, owner, "owner");

    let menu: MenuSnapshot = await createCategory(owner, categoryInput(restaurant.id, "المشروبات", "Drinks"));
    menu = await createCategory(owner, categoryInput(restaurant.id, "الأطباق"));
    const drinks = menu[0];
    const food = menu[1];

    menu = await createItem(owner, itemInput(restaurant.id, drinks.id, "شاي", "120"));
    menu = await createItem(owner, itemInput(restaurant.id, food.id, "كشري", "55.5"));

    expect(menu).toHaveLength(2);
    expect(menu[0].name.ar).toBe("المشروبات");
    expect(menu[0].name.en).toBe("Drinks");
    expect(menu[0].items).toHaveLength(1);
    expect(menu[0].items[0].pricePiastres).toBe(12000); // 120 EGP → 12000 piastres
    expect(menu[1].items[0].pricePiastres).toBe(5550); // 55.5 EGP → 5550 piastres
  });

  it("scopes every query to the restaurant (cross-tenant is impossible)", async () => {
    const ownerA = await seedUser("owner-a");
    const ownerB = await seedUser("owner-b");
    const restaurantA = await seedRestaurant("iso-a");
    const restaurantB = await seedRestaurant("iso-b");
    await memberOf(restaurantA.id, ownerA, "owner");
    await memberOf(restaurantB.id, ownerB, "owner");

    const menuA = await createCategory(ownerA, categoryInput(restaurantA.id, "قسم أ"));
    const categoryA = menuA[0];
    await createItem(ownerA, itemInput(restaurantA.id, categoryA.id, "طبق أ"));

    // B sees nothing of A's menu, and cannot touch A's rows even by id.
    expect(await listMenu(restaurantB.id)).toHaveLength(0);
    await expect(createItem(ownerB, itemInput(restaurantA.id, categoryA.id, "تجاوز"))).rejects.toMatchObject(
      { code: "FORBIDDEN" } satisfies Pick<ActionError, "code">,
    );

    // And A's items are invisible through B's repo.
    const repoB = createRestaurantRepo(restaurantB.id);
    expect(await repoB.items.list()).toHaveLength(0);
  });

  it("enforces the menu.edit permission matrix (staff denied, manager allowed)", async () => {
    const staff = await seedUser("staff");
    const manager = await seedUser("manager");
    const restaurant = await seedRestaurant("rbac");
    await memberOf(restaurant.id, staff, "staff");
    await memberOf(restaurant.id, manager, "manager");

    await expect(createCategory(staff, categoryInput(restaurant.id, "قسم الموظف"))).rejects.toMatchObject(
      { code: "FORBIDDEN" } satisfies Pick<ActionError, "code">,
    );

    const menu = await createCategory(manager, categoryInput(restaurant.id, "قسم المدير"));
    expect(menu).toHaveLength(1);

    // A signed-in user with no membership at all is denied too.
    const outsider = await seedUser("outsider");
    await expect(createCategory(outsider, categoryInput(restaurant.id, "قسم غريب"))).rejects.toMatchObject(
      { code: "FORBIDDEN" } satisfies Pick<ActionError, "code">,
    );
  });

  it("rejects deleting a non-empty category, allows it once emptied", async () => {
    const owner = await seedUser("owner-del");
    const restaurant = await seedRestaurant("del");
    await memberOf(restaurant.id, owner, "owner");

    let menu = await createCategory(owner, categoryInput(restaurant.id, "قسم محمي"));
    const categoryId = menu[0].id;
    menu = await createItem(owner, itemInput(restaurant.id, categoryId, "طبق داخل القسم"));
    const itemId = menu[0].items[0].id;

    await expect(
      deleteCategory(owner, { restaurantId: restaurant.id, categoryId }),
    ).rejects.toMatchObject({ code: "CATEGORY_NOT_EMPTY" } satisfies Pick<ActionError, "code">);

    await deleteItem(owner, { restaurantId: restaurant.id, itemId });
    menu = await deleteCategory(owner, { restaurantId: restaurant.id, categoryId });
    expect(menu).toHaveLength(0);
  });

  it("moves categories and items within their category; boundaries are no-ops", async () => {
    const owner = await seedUser("owner-move");
    const restaurant = await seedRestaurant("move");
    await memberOf(restaurant.id, owner, "owner");

    let menu = await createCategory(owner, categoryInput(restaurant.id, "أول"));
    menu = await createCategory(owner, categoryInput(restaurant.id, "ثاني"));
    menu = await createCategory(owner, categoryInput(restaurant.id, "ثالث"));
    const [first, second, third] = menu;

    // Move the third category up: past the second, then a no-op at the top.
    menu = await moveCategory(owner, { restaurantId: restaurant.id, categoryId: third.id, direction: "up" });
    expect(menu.map((c) => c.id)).toEqual([first.id, third.id, second.id]);
    menu = await moveCategory(owner, { restaurantId: restaurant.id, categoryId: third.id, direction: "up" });
    expect(menu.map((c) => c.id)).toEqual([third.id, first.id, second.id]);

    // Items move within their own category only.
    const category = menu[1];
    menu = await createItem(owner, itemInput(restaurant.id, category.id, "طبق ١"));
    menu = await createItem(owner, itemInput(restaurant.id, category.id, "طبق ٢"));
    const [itemA, itemB] = menu[1].items;
    menu = await moveItem(owner, { restaurantId: restaurant.id, itemId: itemB.id, direction: "up" });
    expect(menu[1].items.map((i) => i.id)).toEqual([itemB.id, itemA.id]);
  });

  it("renames categories and toggles item availability", async () => {
    const owner = await seedUser("owner-edit");
    const restaurant = await seedRestaurant("edit");
    await memberOf(restaurant.id, owner, "owner");

    let menu = await createCategory(owner, categoryInput(restaurant.id, "اسم قديم"));
    const categoryId = menu[0].id;
    menu = await renameCategory(owner, {
      restaurantId: restaurant.id,
      categoryId,
      nameAr: "اسم جديد",
      nameEn: "New name",
    });
    expect(menu[0].name.ar).toBe("اسم جديد");
    expect(menu[0].name.en).toBe("New name");

    menu = await createItem(owner, itemInput(restaurant.id, categoryId, "طبق", "10"));
    const itemId = menu[0].items[0].id;
    menu = await setItemAvailability(owner, { restaurantId: restaurant.id, itemId, isAvailable: false });
    expect(menu[0].items[0].isAvailable).toBe(false);

    menu = await updateItem(owner, {
      restaurantId: restaurant.id,
      itemId,
      nameAr: "طبق معدل",
      descriptionAr: "وصف",
      price: "12.75",
      isAvailable: true,
    });
    expect(menu[0].items[0].name.ar).toBe("طبق معدل");
    expect(menu[0].items[0].description?.ar).toBe("وصف");
    expect(menu[0].items[0].pricePiastres).toBe(1275);
    expect(menu[0].items[0].isAvailable).toBe(true);
  });
});
