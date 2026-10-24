/**
 * Idempotent demo seed — creates (or completes) the `demo` restaurant the
 * e2e suite and manual preview run against. Existing rows are never
 * overwritten: if the tenant already has content, the seed exits.
 *
 * Run after migrations: `pnpm seed`
 */
import {eq} from 'drizzle-orm';
import {db} from '../src/server/db';
import {
  menuCategories,
  menuItems,
  openingHours,
  restaurantTables,
  restaurants
} from '../src/server/db/schema';

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

async function main() {
  const [existing] = await db.select().from(restaurants).where(eq(restaurants.slug, DEMO_SLUG));

  if (existing) {
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, existing.id))
      .limit(1);
    if (category) {
      console.log(`demo restaurant already has content — nothing to seed`);
      return;
    }
  }

  const restaurant =
    existing ??
    (
      await db
        .insert(restaurants)
        .values({
          slug: DEMO_SLUG,
          nameAr: 'مطعم النيل',
          nameEn: 'Nile Restaurant',
          whatsappNumber: '+201234567890',
          timezone: 'Africa/Cairo',
          currency: 'EGP'
        })
        .returning()
    )[0];
  if (!restaurant) throw new Error('failed to create the demo restaurant');

  // Menu content
  for (const [categoryIndex, seedCategory] of MENU.entries()) {
    const category = (
      await db
        .insert(menuCategories)
        .values({
          restaurantId: restaurant.id,
          nameAr: seedCategory.nameAr,
          nameEn: seedCategory.nameEn,
          sortOrder: categoryIndex
        })
        .returning()
    )[0];
    if (!category) throw new Error('failed to create a demo category');

    await db.insert(menuItems).values(
      seedCategory.items.map((item, itemIndex) => ({
        restaurantId: restaurant.id,
        categoryId: category.id,
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
        restaurantId: restaurant.id,
        weekday,
        opensAt: '12:00:00',
        closesAt: '23:00:00'
      }))
    )
    .onConflictDoNothing();

  // One QR table
  await db
    .insert(restaurantTables)
    .values({restaurantId: restaurant.id, label: 'طاولة ١'})
    .onConflictDoNothing();

  console.log(`seeded demo restaurant (${restaurant.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
