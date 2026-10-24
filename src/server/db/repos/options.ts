import {and, asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {menuItemOptions} from '@/server/db/schema';

export type NewMenuItemOption = Omit<
  typeof menuItemOptions.$inferInsert,
  'id' | 'restaurantId' | 'createdAt' | 'updatedAt'
>;

/** Menu-item-option repo scoped to one restaurant (ADR-002). */
export function createOptionsRepo(restaurantId: string) {
  /** Every option of one dish (any state) — dashboard editing. */
  const listByItem = (menuItemId: string) =>
    db
      .select()
      .from(menuItemOptions)
      .where(
        and(
          eq(menuItemOptions.restaurantId, restaurantId),
          eq(menuItemOptions.menuItemId, menuItemId)
        )
      )
      .orderBy(asc(menuItemOptions.sortOrder), asc(menuItemOptions.nameAr));

  /** Active options across the whole menu — the public page loads these once. */
  const listActive = () =>
    db
      .select()
      .from(menuItemOptions)
      .where(
        and(eq(menuItemOptions.restaurantId, restaurantId), eq(menuItemOptions.isActive, true))
      )
      .orderBy(asc(menuItemOptions.sortOrder), asc(menuItemOptions.nameAr));

  /** Active options of one dish — the order pipeline re-prices from these. */
  const listActiveByItem = (menuItemId: string) =>
    db
      .select()
      .from(menuItemOptions)
      .where(
        and(
          eq(menuItemOptions.restaurantId, restaurantId),
          eq(menuItemOptions.isActive, true),
          eq(menuItemOptions.menuItemId, menuItemId)
        )
      )
      .orderBy(asc(menuItemOptions.sortOrder), asc(menuItemOptions.nameAr));

  async function create(values: NewMenuItemOption) {
    const [row] = await db
      .insert(menuItemOptions)
      .values({...values, restaurantId})
      .returning();
    if (!row) throw new Error('menu item option insert returned no row');
    return row;
  }

  /** Delete an option — false when the id belongs to another tenant. */
  async function remove(id: string) {
    const rows = await db
      .delete(menuItemOptions)
      .where(and(eq(menuItemOptions.id, id), eq(menuItemOptions.restaurantId, restaurantId)))
      .returning({id: menuItemOptions.id});
    return rows.length > 0;
  }

  return {listByItem, listActive, listActiveByItem, create, remove};
}

export type OptionsRepo = ReturnType<typeof createOptionsRepo>;
