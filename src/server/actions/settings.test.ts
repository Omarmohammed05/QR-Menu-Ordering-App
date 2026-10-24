import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {eq} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {restaurants} from '@/server/db/schema';
import {restaurantsRepo} from '@/server/db/repos';

/**
 * setLogoAction persists the settings-screen logo immediately (upload and
 * removal both) so tenant-root branding survives a refresh without the form's
 * Save. The session guard is stubbed with an in-DB membership fixture; the
 * persistence itself runs against Postgres like the tenancy suite.
 */
const seat = vi.hoisted(() => ({role: 'owner', restaurantId: 'pending'}));

vi.mock('@/server/dashboard', () => ({
  requireMember: vi.fn(async () => ({
    membership: {role: seat.role, restaurant: {id: seat.restaurantId}}
  }))
}));
vi.mock('next/cache', () => ({revalidatePath: vi.fn()}));

const {setLogoAction} = await import('./settings');

describe('setLogoAction (integration)', () => {
  const slug = `set-logo-${randomUUID().slice(0, 8)}`;
  let restaurantId: string;

  const readLogo = async () => {
    const [row] = await db
      .select({logoUrl: restaurants.logoUrl})
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));
    return row?.logoUrl ?? null;
  };

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url))});
    const restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم الشعار',
      whatsappNumber: '+201005550199'
    });
    restaurantId = restaurant.id;
    seat.restaurantId = restaurantId;
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
    await client.end();
  });

  it('persists a valid logo URL for an owner', async () => {
    seat.role = 'owner';
    await expect(setLogoAction('https://i.ibb.co/test/logo.png')).resolves.toEqual({ok: true});
    expect(await readLogo()).toBe('https://i.ibb.co/test/logo.png');
  });

  it('drops the logo on removal (null)', async () => {
    seat.role = 'owner';
    await expect(setLogoAction(null)).resolves.toEqual({ok: true});
    expect(await readLogo()).toBeNull();
  });

  it('refuses staff members without touching the stored logo', async () => {
    seat.role = 'owner';
    await setLogoAction('https://i.ibb.co/test/staff.png');
    seat.role = 'staff';
    await expect(setLogoAction('https://i.ibb.co/test/other.png')).resolves.toEqual({ok: false});
    expect(await readLogo()).toBe('https://i.ibb.co/test/staff.png');
  });

  it('refuses malformed URLs', async () => {
    seat.role = 'owner';
    await expect(setLogoAction('not a url')).resolves.toEqual({ok: false});
  });
});
