/**
 * Idempotent demo seed — creates (or completes) the `demo` restaurant the
 * e2e suite, the public `/dashboard-demo` tour, and manual preview run
 * against. Every section is individually idempotent: existing rows are
 * never overwritten, a section with content is skipped.
 *
 * Run after migrations: `pnpm seed`
 */
import {and, eq, gte, isNull} from 'drizzle-orm';
import {db} from '../src/server/db';
import {
  menuCategories,
  menuItems,
  menuItemOptions,
  menuViews,
  openingHours,
  orderEvents,
  orderItems,
  orders,
  restaurantMembers,
  restaurantTables,
  restaurants,
  users
} from '../src/server/db/schema';
import {publicOrderId} from '../src/lib/ids';

const DEMO_SLUG = 'demo';

type SeedItem = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  pricePiastres: number;
};

type SeedCategory = {
  nameAr: string;
  nameEn: string;
  items: SeedItem[];
};

const MENU: SeedCategory[] = [
  {
    nameAr: 'المقبلات',
    nameEn: 'Starters',
    items: [
      {nameAr: 'حمص بالطحينة', nameEn: 'Hummus with Tahini', descriptionAr: 'حمص مخفوق بالطحينة وزيت الزيتون', descriptionEn: 'Whipped chickpeas with tahini and olive oil', pricePiastres: 4500},
      {nameAr: 'متبلة باذنجان', nameEn: 'Eggplant Mutabal', descriptionAr: 'باذنجان مشوي مع الطحينة والليمون', descriptionEn: 'Fire-roasted eggplant with tahini and lemon', pricePiastres: 4000},
      {nameAr: 'فتة', nameEn: 'Fattah', descriptionAr: 'أرز ولحم مع صوص الطحينة', descriptionEn: 'Rice and beef in tahini sauce', pricePiastres: 6500},
      {nameAr: 'كشري مصري', nameEn: 'Egyptian Koshari', descriptionAr: 'أرز وعدس ومكرونة مع الصلصة الحارة', descriptionEn: 'Rice, lentils and pasta with spicy tomato sauce', pricePiastres: 5000}
    ]
  },
  {
    nameAr: 'الأطباق الرئيسية',
    nameEn: 'Mains',
    items: [
      {nameAr: 'مشاوي مشكل', nameEn: 'Mixed Grill', descriptionAr: 'كباب وكفتة وشيش طاووق', descriptionEn: 'Kebab, kofta and shish tawook', pricePiastres: 12000},
      {nameAr: 'صينية دجاج بالفرن', nameEn: 'Oven-Baked Chicken Tray', descriptionAr: 'دجاج وبطاطس مع صوص الطماطم', descriptionEn: 'Chicken and potatoes in tomato sauce', pricePiastres: 9500},
      {nameAr: 'برياني لحم', nameEn: 'Beef Biryani', descriptionAr: 'أرز بالبهارات مع قطع اللحم', descriptionEn: 'Spiced rice with tender beef', pricePiastres: 11000},
      {nameAr: 'سمك بلطي مشوي', nameEn: 'Grilled Tilapia', descriptionAr: 'بلطي طازج مع السلطة والطحينة', descriptionEn: 'Fresh tilapia with salad and tahini', pricePiastres: 10500}
    ]
  },
  {
    nameAr: 'المشويات',
    nameEn: 'Grills',
    items: [
      {nameAr: 'كباب حلة', nameEn: 'Kebab Halala', descriptionAr: 'قطع لحم مشوية على الفحم', descriptionEn: 'Charcoal-grilled beef chunks', pricePiastres: 13000},
      {nameAr: 'كفتة مشوية', nameEn: 'Grilled Kofta', descriptionAr: 'كفتة لحم متبلة على الفحم', descriptionEn: 'Charcoal-grilled spiced beef kofta', pricePiastres: 11500},
      {nameAr: 'شيش طاووق', nameEn: 'Shish Tawook', descriptionAr: 'دجاج متبل مع الثوم', descriptionEn: 'Garlic-marinated grilled chicken', pricePiastres: 10000}
    ]
  },
  {
    nameAr: 'الحلويات',
    nameEn: 'Desserts',
    items: [
      {nameAr: 'أم علي', nameEn: 'Om Ali', descriptionAr: 'حلوى مصرية بالمكسرات والقشطة', descriptionEn: 'Egyptian pastry pudding with nuts and cream', pricePiastres: 3500},
      {nameAr: 'كنافة بالمانجو', nameEn: 'Mango Konafa', descriptionEn: 'Konafa with fresh mango and cream', descriptionAr: 'كنافة طازجة مع المانجو والقشطة', pricePiastres: 4000},
      {nameAr: 'بسبوسة', nameEn: 'Basbousa', descriptionAr: 'حلوى السميد مع القشطة', descriptionEn: 'Semolina cake with cream', pricePiastres: 3000}
    ]
  },
  {
    nameAr: 'المشروبات',
    nameEn: 'Drinks',
    items: [
      {nameAr: 'شاي كشري', nameEn: 'Koshari Tea', descriptionAr: 'شاي أحمر بالنعناع', descriptionEn: 'Black tea with mint', pricePiastres: 1500},
      {nameAr: 'عصير مانجو طازج', nameEn: 'Fresh Mango Juice', descriptionAr: 'مانجو طبيعي 100٪', descriptionEn: '100% natural mango', pricePiastres: 3000},
      {nameAr: 'قهوة تركي', nameEn: 'Turkish Coffee', descriptionAr: 'قهوة مطحونة طازجة', descriptionEn: 'Freshly ground coffee', pricePiastres: 2000},
      {nameAr: 'كركديه مثلج', nameEn: 'Iced Hibiscus', descriptionAr: 'كركديه بارد بالنعناع', descriptionEn: 'Chilled hibiscus with mint', pricePiastres: 1800}
    ]
  }
];

const TABLE_LABELS = ['طاولة ١', 'طاولة ٢', 'طاولة ٣', 'طاولة ٤', 'طاولة ٥', 'طاولة ٦'];

/** Paid extras a customer can toggle on the dish detail page. */
const OPTIONS: {item: string; nameAr: string; nameEn: string; priceDeltaPiastres: number}[] = [
  {item: 'كشري مصري', nameAr: 'صلصة إضافية', nameEn: 'Extra sauce', priceDeltaPiastres: 500},
  {item: 'كشري مصري', nameAr: 'بصل مقرمش إضافي', nameEn: 'Extra crispy onions', priceDeltaPiastres: 300},
  {item: 'مشاوي مشكل', nameAr: 'أرز إضافي', nameEn: 'Extra rice', priceDeltaPiastres: 1500},
  {item: 'شيش طاووق', nameAr: 'صوص ثوم إضافي', nameEn: 'Extra garlic sauce', priceDeltaPiastres: 300},
  {item: 'كنافة بالمانجو', nameAr: 'مكسرات إضافية', nameEn: 'Extra nuts', priceDeltaPiastres: 500}
];

const TEAM: {id: string; name: string; email: string; role: 'owner' | 'manager' | 'staff'}[] = [
  {id: 'demo-user-owner', name: 'أحمد النيل', email: 'owner@demo.qr-menu.app', role: 'owner'},
  {id: 'demo-user-manager', name: 'سارة محمود', email: 'manager@demo.qr-menu.app', role: 'manager'},
  {id: 'demo-user-staff', name: 'خالد يوسف', email: 'staff@demo.qr-menu.app', role: 'staff'}
];

/** Deterministic PRNG so repeated runs against an empty tenant look the same. */
let seedState = 987_654_321;
function rand(): number {
  seedState = (seedState * 1_103_515_245 + 12_345) % 2_147_483_648;
  return seedState / 2_147_483_648;
}

type OrderPlan = {
  daysBack: number;
  hourUtc: number;
  minute: number;
  status: 'pending' | 'accepted' | 'ready' | 'completed';
  takeaway: boolean;
  name: string | null;
  note: string | null;
  payment: 'cash' | 'instapay';
};

/** A believable two-week history plus a live board for today. */
function orderPlans(): OrderPlan[] {
  const plans: OrderPlan[] = [];
  for (let daysBack = 13; daysBack >= 1; daysBack--) {
    const count = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      plans.push({
        daysBack,
        hourUtc: 12 + Math.floor(rand() * 8),
        minute: Math.floor(rand() * 60),
        status: 'completed',
        takeaway: rand() < 0.3,
        name: null,
        note: null,
        payment: 'cash'
      });
    }
  }
  plans.push(
    {daysBack: 0, hourUtc: 11, minute: 5, status: 'pending', takeaway: false, name: 'محمود سامي', note: 'بدون مخلل', payment: 'cash'},
    {daysBack: 0, hourUtc: 11, minute: 40, status: 'pending', takeaway: true, name: 'نورهان علي', note: null, payment: 'instapay'},
    {daysBack: 0, hourUtc: 10, minute: 20, status: 'accepted', takeaway: false, name: 'كريم فؤاد', note: null, payment: 'cash'},
    {daysBack: 0, hourUtc: 10, minute: 50, status: 'accepted', takeaway: false, name: 'هدى مصطفى', note: 'أرز إضافي من فضلك', payment: 'cash'},
    {daysBack: 0, hourUtc: 10, minute: 10, status: 'ready', takeaway: false, name: 'طارق حسن', note: null, payment: 'cash'},
    {daysBack: 0, hourUtc: 9, minute: 30, status: 'completed', takeaway: true, name: 'ياسمين رضا', note: null, payment: 'cash'}
  );
  return plans;
}

/** Restaurant row — created once, reused by every section below. */
async function ensureRestaurant() {
  const [existing] = await db.select().from(restaurants).where(eq(restaurants.slug, DEMO_SLUG));
  if (existing) return existing;

  const [created] = await db
    .insert(restaurants)
    .values({
      slug: DEMO_SLUG,
      nameAr: 'مطعم النيل',
      nameEn: 'Nile Restaurant',
      whatsappNumber: '+201234567890',
      timezone: 'Africa/Cairo',
      currency: 'EGP'
    })
    .returning();
  if (!created) throw new Error('failed to create the demo restaurant');
  return created;
}

/** Menu sections + dishes, opening hours — skipped if content exists. */
async function seedMenu(restaurantId: string) {
  const [category] = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.restaurantId, restaurantId))
    .limit(1);
  if (category) {
    console.log('menu already seeded — skipping');
    return;
  }

  for (const [categoryIndex, seedCategory] of MENU.entries()) {
    const created = (
      await db
        .insert(menuCategories)
        .values({
          restaurantId,
          nameAr: seedCategory.nameAr,
          nameEn: seedCategory.nameEn,
          sortOrder: categoryIndex
        })
        .returning()
    )[0];
    if (!created) throw new Error('failed to create a demo category');

    await db.insert(menuItems).values(
      seedCategory.items.map((item, itemIndex) => ({
        restaurantId,
        categoryId: created.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
        pricePiastres: item.pricePiastres,
        sortOrder: itemIndex
      }))
    );
  }

  // Open daily 12:00–23:00
  await db
    .insert(openingHours)
    .values(
      Array.from({length: 7}, (_, weekday) => ({
        restaurantId,
        weekday,
        opensAt: '12:00:00',
        closesAt: '23:00:00'
      }))
    )
    .onConflictDoNothing();
}

/** Dish options — adds any of the demo extras that are missing (by name). */
async function seedOptions(restaurantId: string) {
  const itemRows = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId));
  const itemByName = new Map(itemRows.map((row) => [row.nameAr, row]));

  const existing = await db
    .select({menuItemId: menuItemOptions.menuItemId, nameAr: menuItemOptions.nameAr})
    .from(menuItemOptions)
    .where(eq(menuItemOptions.restaurantId, restaurantId));
  const existingKeys = new Set(existing.map((row) => `${row.menuItemId}:${row.nameAr}`));

  let added = 0;
  for (const [sortOrder, option] of OPTIONS.entries()) {
    const item = itemByName.get(option.item);
    if (!item) continue; // the menu changed shape — skip rather than guess
    if (existingKeys.has(`${item.id}:${option.nameAr}`)) continue;
    await db.insert(menuItemOptions).values({
      restaurantId,
      menuItemId: item.id,
      nameAr: option.nameAr,
      nameEn: option.nameEn,
      priceDeltaPiastres: option.priceDeltaPiastres,
      sortOrder
    });
    added++;
  }
  console.log(added > 0 ? `seeded ${added} dish options` : 'options already seeded — skipping');
}

/** QR tables — adds any of the six demo labels that are missing. */
async function seedTables(restaurantId: string) {
  const rows = await db
    .select({label: restaurantTables.label})
    .from(restaurantTables)
    .where(eq(restaurantTables.restaurantId, restaurantId));
  const existing = new Set(rows.map((row) => row.label));
  for (const label of TABLE_LABELS.filter((label) => !existing.has(label))) {
    await db.insert(restaurantTables).values({restaurantId, label});
  }
}

/**
 * Demo team seats. The `user` rows have no credentials (sign-up is closed),
 * so they can never log in — they exist so the team page has a list to show.
 */
async function seedTeam(restaurantId: string) {
  // A real owner may already be seated (the tenant was claimed) — the demo
  // seats are added alongside, never replacing or touching real ones.
  const seated = await db
    .select({userId: restaurantMembers.userId})
    .from(restaurantMembers)
    .where(eq(restaurantMembers.restaurantId, restaurantId));
  const existing = new Set(seated.map((row) => row.userId));

  let added = 0;
  for (const seat of TEAM.filter((seat) => !existing.has(seat.id))) {
    await db
      .insert(users)
      .values({id: seat.id, name: seat.name, email: seat.email, emailVerified: true})
      .onConflictDoNothing();
    await db
      .insert(restaurantMembers)
      .values({restaurantId, userId: seat.id, role: seat.role})
      .onConflictDoNothing();
    added++;
  }
  if (added === 0) {
    console.log('team already seeded — skipping');
    return;
  }
  console.log(`seeded ${added} demo team seats`);
}

/** Two weeks of orders with a live board today — skipped if orders exist. */
async function seedOrders(restaurantId: string) {
  const [order] = await db
    .select({id: orders.id})
    .from(orders)
    .where(eq(orders.restaurantId, restaurantId))
    .limit(1);
  if (order) {
    console.log('orders already seeded — skipping');
    return;
  }

  const itemRows = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  const tableRows = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.restaurantId, restaurantId));
  if (itemRows.length === 0) throw new Error('seed the menu before orders');

  let number = 1;
  for (const plan of orderPlans()) {
    const createdAt = new Date();
    createdAt.setUTCDate(createdAt.getUTCDate() - plan.daysBack);
    createdAt.setUTCHours(plan.hourUtc, plan.minute, 0, 0);

    const pool = [...itemRows];
    const lineCount = Math.min(pool.length, 1 + Math.floor(rand() * 3));
    const lines: {itemId: string; name: string; price: number; qty: number}[] = [];
    for (let i = 0; i < lineCount; i++) {
      const [item] = pool.splice(Math.floor(rand() * pool.length), 1);
      if (!item) break;
      lines.push({itemId: item.id, name: item.nameAr, price: item.pricePiastres, qty: 1 + Math.floor(rand() * 2)});
    }
    const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const table = plan.takeaway ? null : (tableRows[Math.floor(rand() * tableRows.length)] ?? null);

    const orderNumber = number++;
    const [created] = await db
      .insert(orders)
      .values({
        restaurantId,
        tableId: table?.id ?? null,
        status: plan.status,
        customerName: plan.name,
        note: plan.note,
        totalPiastres: total,
        number: orderNumber,
        publicId: publicOrderId(),
        idempotencyKey: `seed-${orderNumber}`,
        paymentMethod: plan.payment,
        createdAt,
        updatedAt: createdAt,
        statusUpdatedAt: createdAt
      })
      .returning();
    if (!created) throw new Error('failed to create a demo order');

    await db.insert(orderItems).values(
      lines.map((line) => ({
        restaurantId,
        orderId: created.id,
        menuItemId: line.itemId,
        quantity: line.qty,
        unitPricePiastres: line.price,
        nameSnapshotAr: line.name,
        options: [],
        lineTotalPiastres: line.price * line.qty
      }))
    );
    await db.insert(orderEvents).values([
      {restaurantId, orderId: created.id, fromStatus: null, toStatus: 'pending', createdAt},
      ...(plan.status !== 'pending'
        ? [
            {
              restaurantId,
              orderId: created.id,
              fromStatus: 'pending' as const,
              toStatus: plan.status,
              createdAt: new Date(createdAt.getTime() + 8 * 60_000)
            }
          ]
        : [])
    ]);
  }
  await db
    .update(restaurants)
    .set({orderCounter: number - 1})
    .where(eq(restaurants.id, restaurantId));
  console.log(`seeded ${number - 1} demo orders`);
}

/** `YYYY-MM-DD` for a moment in the restaurant's own timezone. */
function localDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: timezone}).format(date);
}

/**
 * Menu page-load telemetry for the analytics chart. Organic traffic (real
 * preview loads) is kept; days inside the 14-day window that have no views
 * get a plausible backfill so the chart reads as a history, not a spike.
 */
async function seedViews(restaurant: {id: string; timezone: string}) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 13);
  start.setUTCHours(0, 0, 0, 0);

  const existing = await db
    .select({viewedAt: menuViews.viewedAt})
    .from(menuViews)
    .where(
      and(
        eq(menuViews.restaurantId, restaurant.id),
        isNull(menuViews.menuItemId),
        gte(menuViews.viewedAt, start)
      )
    );
  const covered = new Set(existing.map(({viewedAt}) => localDay(viewedAt, restaurant.timezone)));

  const rows: (typeof menuViews.$inferInsert)[] = [];
  for (let daysBack = 13; daysBack >= 0; daysBack--) {
    const day = localDay(new Date(Date.now() - daysBack * 86_400_000), restaurant.timezone);
    if (covered.has(day)) continue;
    const count = 6 + Math.floor(rand() * 16);
    for (let i = 0; i < count; i++) {
      const viewedAt = new Date();
      viewedAt.setUTCDate(viewedAt.getUTCDate() - daysBack);
      viewedAt.setUTCHours(8 + Math.floor(rand() * 14), Math.floor(rand() * 60), 0, 0);
      rows.push({
        restaurantId: restaurant.id,
        tableId: null,
        locale: rand() < 0.8 ? 'ar' : 'en',
        viewedAt
      });
    }
  }
  if (rows.length === 0) {
    console.log('views already seeded — skipping');
    return;
  }
  await db.insert(menuViews).values(rows);
  console.log(`seeded ${rows.length} demo menu views`);
}

async function main() {
  const restaurant = await ensureRestaurant();
  await seedMenu(restaurant.id);
  await seedOptions(restaurant.id);
  await seedTables(restaurant.id);
  await seedTeam(restaurant.id);
  await seedOrders(restaurant.id);
  await seedViews(restaurant);
  console.log(`demo restaurant ready (${restaurant.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
