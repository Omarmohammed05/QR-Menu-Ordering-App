import {and, desc, eq, ne, or, sql} from 'drizzle-orm';
import {db} from '@/server/db';
import {restaurantMembers, restaurants, users} from '@/server/db/schema';

export type NewRestaurant = Omit<
  typeof restaurants.$inferInsert,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;

/**
 * Tenant-root repo — the only repo not scoped by `restaurantId`, because it
 * resolves the tenant (by slug or id) that the scoped repos are then built for.
 */
export const restaurantsRepo = {
  /**
   * Current slug, or any of its predecessors (printed QR codes never break:
   * the page 301-redirects a previous slug to the current one).
   */
  async findBySlug(slug: string) {
    const [row] = await db
      .select()
      .from(restaurants)
      .where(
        or(
          eq(restaurants.slug, slug),
          sql`${slug} = any(${restaurants.previousSlugs})`
        )
      )
      .limit(1);
    return row ?? null;
  },

  /** True when the slug is (or was) some restaurant's public handle. */
  async slugTaken(slug: string, excludeRestaurantId?: string) {
    const conditions = [
      or(
        eq(restaurants.slug, slug),
        sql`${slug} = any(${restaurants.previousSlugs})`
      )
    ];
    if (excludeRestaurantId) {
      conditions.push(ne(restaurants.id, excludeRestaurantId));
    }
    const [row] = await db
      .select({id: restaurants.id})
      .from(restaurants)
      .where(and(...conditions))
      .limit(1);
    return row !== undefined;
  },

  async findById(id: string) {
    const [row] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
    return row ?? null;
  },

  async create(values: NewRestaurant) {
    const [row] = await db.insert(restaurants).values(values).returning();
    if (!row) throw new Error('restaurant insert returned no row');
    return row;
  },

  /**
   * Settings-screen update. The id always comes from the session's own
   * membership (never caller input), so no tenant scope can be forged.
   * A slug change pushes the old handle into `previous_slugs` so printed
   * QR codes keep resolving (the public page 301s to the new slug).
   */
  async update(
    id: string,
    values: Pick<
      Partial<typeof restaurants.$inferInsert>,
      'nameAr' | 'nameEn' | 'whatsappNumber' | 'instapayHandle' | 'slug' | 'logoUrl' | 'timezone' | 'currency' | 'isActive'
    > & {previousSlugs?: string[]}
  ) {
    const {previousSlugs, ...rest} = values;
    const merged =
      previousSlugs === undefined
        ? rest
        : {...rest, previousSlugs: sql`${restaurants.previousSlugs} || ${previousSlugs}::text[]`};
    const [row] = await db
      .update(restaurants)
      .set({...merged, updatedAt: new Date()})
      .where(eq(restaurants.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Admin screen: every restaurant with its owner emails — platform-owner
   * page only. Unclaimed restaurants surface with an empty list.
   */
  async listAllWithOwners() {
    const rows = await db
      .select({restaurant: restaurants, ownerEmail: users.email})
      .from(restaurants)
      .leftJoin(
        restaurantMembers,
        and(
          eq(restaurantMembers.restaurantId, restaurants.id),
          eq(restaurantMembers.role, 'owner')
        )
      )
      .leftJoin(users, eq(users.id, restaurantMembers.userId))
      .orderBy(desc(restaurants.createdAt));

    const byId = new Map<string, {restaurant: typeof restaurants.$inferSelect; ownerEmails: string[]}>();
    for (const row of rows) {
      const entry = byId.get(row.restaurant.id) ?? {restaurant: row.restaurant, ownerEmails: []};
      if (row.ownerEmail) entry.ownerEmails.push(row.ownerEmail);
      byId.set(row.restaurant.id, entry);
    }
    return [...byId.values()];
  }
};
