import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {eq} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {restaurants} from '@/server/db/schema';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';

/**
 * Opening-hours actions (settings screen): the weekly schedule the public
 * menu evaluates. The session guard is stubbed with an in-DB membership
 * fixture; the persistence itself runs against Postgres like the tenancy
 * suite.
 */
const seat = vi.hoisted(() => ({role: 'owner', restaurantId: 'pending'}));

vi.mock('@/server/dashboard', () => ({
  requireMember: vi.fn(async () => ({
    membership: {role: seat.role, restaurant: {id: seat.restaurantId}}
  }))
}));
vi.mock('next/cache', () => ({revalidatePath: vi.fn()}));

const {addOpeningHourAction, deleteOpeningHourAction} = await import('./hours');

const slot = (weekday: number, opensAt: string, closesAt: string) => {
  const formData = new FormData();
  formData.set('locale', 'en');
  formData.set('weekday', String(weekday));
  formData.set('opensAt', opensAt);
  formData.set('closesAt', closesAt);
  return formData;
};

describe('opening-hours actions (integration)', () => {
  const slug = `hours-${randomUUID().slice(0, 8)}`;
  let restaurantId: string;

  const listSlots = () => createRestaurantRepos(restaurantId).hours.list();

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url))});
    const restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم المواعيد',
      whatsappNumber: '+201005550198'
    });
    restaurantId = restaurant.id;
    seat.restaurantId = restaurantId;
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
    await client.end();
  });

  it('adds a slot for an owner and persists it', async () => {
    seat.role = 'owner';
    await expect(addOpeningHourAction({}, slot(5, '12:00', '23:30'))).resolves.toEqual({saved: true});
    const rows = await listSlots();
    expect(rows).toEqual([
      expect.objectContaining({weekday: 5, opensAt: '12:00:00', closesAt: '23:30:00'})
    ]);
  });

  it('maps a duplicate weekday+open-time to a friendly error', async () => {
    seat.role = 'owner';
    await expect(addOpeningHourAction({}, slot(5, '12:00', '18:00'))).resolves.toEqual({
      error: 'duplicate'
    });
    expect((await listSlots()).length).toBe(1);
  });

  it('rejects an inverted range and malformed times', async () => {
    seat.role = 'owner';
    await expect(addOpeningHourAction({}, slot(1, '18:00', '09:00'))).resolves.toEqual({
      error: 'range'
    });
    await expect(addOpeningHourAction({}, slot(1, '25:00', '09:00'))).resolves.toEqual({
      error: 'times'
    });
  });

  it('refuses staff members', async () => {
    seat.role = 'staff';
    await expect(addOpeningHourAction({}, slot(1, '09:00', '17:00'))).resolves.toEqual({
      error: 'forbidden'
    });
  });

  it('deletes a slot for an owner', async () => {
    seat.role = 'owner';
    const [row] = await listSlots();
    if (!row) throw new Error('fixture slot missing');
    const formData = new FormData();
    formData.set('locale', 'en');
    formData.set('slotId', row.id);
    await deleteOpeningHourAction(formData);
    expect(await listSlots()).toEqual([]);
  });
});
