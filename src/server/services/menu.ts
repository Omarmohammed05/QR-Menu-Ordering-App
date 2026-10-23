import { ActionError, type SessionUser } from "@/server/actions/secure";
import { can, type Permission } from "@/server/auth/rbac";
import { db } from "@/server/db/client";
import { parsePiastres } from "@/lib/money";
import type { LocalizedText } from "@/lib/localized-text";
import { createRestaurantRepo, type MenuItem } from "@/server/repos/create-restaurant-repo";

/** Service functions only need the identity fields of the session user. */
export type MenuUser = Pick<SessionUser, "id" | "superAdmin">;

export type MenuItemDto = {
  id: string;
  categoryId: string;
  name: LocalizedText;
  description: LocalizedText | null;
  pricePiastres: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type MenuCategoryDto = {
  id: string;
  name: LocalizedText;
  items: MenuItemDto[];
};

/** Full menu state; every mutating service returns the fresh snapshot. */
export type MenuSnapshot = MenuCategoryDto[];

/** The user must hold `permission` for THIS restaurant (member role or platform admin). */
export async function requirePermission(
  user: MenuUser,
  restaurantId: string,
  permission: Permission,
): Promise<void> {
  const member = await createRestaurantRepo(restaurantId).members.getByUserId(user.id);
  if (!can({ memberRole: member?.role ?? null, superAdmin: user.superAdmin ?? false }, permission)) {
    throw new ActionError("FORBIDDEN");
  }
}

function toLocalized(ar: string, en?: string): LocalizedText {
  const trimmedEn = en?.trim();
  return { ar: ar.trim(), ...(trimmedEn ? { en: trimmedEn } : {}) };
}

function toOptionalLocalized(ar?: string, en?: string): LocalizedText | null {
  const trimmedAr = ar?.trim() ?? "";
  const trimmedEn = en?.trim() ?? "";
  if (!trimmedAr && !trimmedEn) return null;
  return { ar: trimmedAr || trimmedEn, ...(trimmedEn ? { en: trimmedEn } : {}) };
}

function toItemDto(item: MenuItem): MenuItemDto {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description ?? null,
    pricePiastres: item.pricePiastres,
    imageUrl: item.imageUrl ?? null,
    isAvailable: item.isAvailable,
  };
}

export async function listMenu(restaurantId: string): Promise<MenuSnapshot> {
  const repo = createRestaurantRepo(restaurantId);
  const [categories, items] = await Promise.all([repo.categories.list(), repo.items.list()]);
  const byCategory = new Map<string, MenuItemDto[]>();
  for (const item of items) {
    const list = byCategory.get(item.categoryId);
    if (list) {
      list.push(toItemDto(item));
    } else {
      byCategory.set(item.categoryId, [toItemDto(item)]);
    }
  }
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    items: byCategory.get(category.id) ?? [],
  }));
}

export type CategoryValues = { nameAr: string; nameEn?: string };

export async function createCategory(
  user: MenuUser,
  input: { restaurantId: string } & CategoryValues,
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const sortOrder = await repo.categories.nextSortOrder();
  await repo.categories.create({ name: toLocalized(input.nameAr, input.nameEn), sortOrder });
  return listMenu(input.restaurantId);
}

export async function renameCategory(
  user: MenuUser,
  input: { restaurantId: string; categoryId: string } & CategoryValues,
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const existing = await repo.categories.findById(input.categoryId);
  if (!existing) {
    throw new ActionError("NOT_FOUND");
  }
  await repo.categories.update(input.categoryId, { name: toLocalized(input.nameAr, input.nameEn) });
  return listMenu(input.restaurantId);
}

export async function deleteCategory(
  user: MenuUser,
  input: { restaurantId: string; categoryId: string },
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const existing = await repo.categories.findById(input.categoryId);
  if (!existing) {
    throw new ActionError("NOT_FOUND");
  }
  const itemCount = await repo.items.countByCategory(input.categoryId);
  if (itemCount > 0) {
    // Deleting a stocked category would silently cascade its items — reject instead.
    throw new ActionError("CATEGORY_NOT_EMPTY");
  }
  await repo.categories.delete(input.categoryId);
  return listMenu(input.restaurantId);
}

export async function moveCategory(
  user: MenuUser,
  input: { restaurantId: string; categoryId: string; direction: "up" | "down" },
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  await db.transaction(async (tx) => {
    const repo = createRestaurantRepo(input.restaurantId, tx);
    const categories = await repo.categories.list();
    const index = categories.findIndex((category) => category.id === input.categoryId);
    if (index === -1) {
      throw new ActionError("NOT_FOUND");
    }
    const swapIndex = input.direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) {
      return; // already at the boundary — no-op
    }
    const current = categories[index];
    const neighbor = categories[swapIndex];
    await repo.categories.update(current.id, { sortOrder: neighbor.sortOrder });
    await repo.categories.update(neighbor.id, { sortOrder: current.sortOrder });
  });
  return listMenu(input.restaurantId);
}

export type ItemValues = {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: string;
  imageUrl?: string;
  isAvailable: boolean;
};

export async function createItem(
  user: MenuUser,
  input: { restaurantId: string; categoryId: string } & ItemValues,
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const category = await repo.categories.findById(input.categoryId);
  if (!category) {
    throw new ActionError("NOT_FOUND");
  }
  const sortOrder = await repo.items.nextSortOrder(input.categoryId);
  await repo.items.create({
    categoryId: input.categoryId,
    name: toLocalized(input.nameAr, input.nameEn),
    description: toOptionalLocalized(input.descriptionAr, input.descriptionEn),
    pricePiastres: parsePiastres(input.price),
    imageUrl: input.imageUrl?.trim() || null,
    isAvailable: input.isAvailable,
    sortOrder,
  });
  return listMenu(input.restaurantId);
}

export async function updateItem(
  user: MenuUser,
  input: { restaurantId: string; itemId: string } & ItemValues,
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const existing = await repo.items.findById(input.itemId);
  if (!existing) {
    throw new ActionError("NOT_FOUND");
  }
  await repo.items.update(input.itemId, {
    name: toLocalized(input.nameAr, input.nameEn),
    description: toOptionalLocalized(input.descriptionAr, input.descriptionEn),
    pricePiastres: parsePiastres(input.price),
    imageUrl: input.imageUrl?.trim() || null,
    isAvailable: input.isAvailable,
  });
  return listMenu(input.restaurantId);
}

export async function setItemAvailability(
  user: MenuUser,
  input: { restaurantId: string; itemId: string; isAvailable: boolean },
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const existing = await repo.items.findById(input.itemId);
  if (!existing) {
    throw new ActionError("NOT_FOUND");
  }
  await repo.items.update(input.itemId, { isAvailable: input.isAvailable });
  return listMenu(input.restaurantId);
}

export async function deleteItem(
  user: MenuUser,
  input: { restaurantId: string; itemId: string },
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const existing = await repo.items.findById(input.itemId);
  if (!existing) {
    throw new ActionError("NOT_FOUND");
  }
  await repo.items.delete(input.itemId);
  return listMenu(input.restaurantId);
}

export async function moveItem(
  user: MenuUser,
  input: { restaurantId: string; itemId: string; direction: "up" | "down" },
): Promise<MenuSnapshot> {
  await requirePermission(user, input.restaurantId, "menu.edit");
  const repo = createRestaurantRepo(input.restaurantId);
  const item = await repo.items.findById(input.itemId);
  if (!item) {
    throw new ActionError("NOT_FOUND");
  }
  await db.transaction(async (tx) => {
    const txRepo = createRestaurantRepo(input.restaurantId, tx);
    const items = await txRepo.items.listByCategory(item.categoryId);
    const index = items.findIndex((candidate) => candidate.id === input.itemId);
    const swapIndex = input.direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) {
      return; // already at the boundary — no-op
    }
    const current = items[index];
    const neighbor = items[swapIndex];
    await txRepo.items.update(current.id, { sortOrder: neighbor.sortOrder });
    await txRepo.items.update(neighbor.id, { sortOrder: current.sortOrder });
  });
  return listMenu(input.restaurantId);
}
