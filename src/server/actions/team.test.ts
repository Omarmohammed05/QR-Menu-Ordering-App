import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {eq} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {restaurants, users} from '@/server/db/schema';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';

/**
 * Team actions: seating existing accounts into the restaurant. The session
 * guard is stubbed with an in-DB fixtures (actor membership + a second user
 * row); the persistence itself runs against Postgres like the tenancy suite.
 */
const seat = vi.hoisted(() => ({role: 'owner', userId: 'pending', restaurantId: 'pending'}));

vi.mock('@/server/dashboard', () => ({
  requireMember: vi.fn(async () => ({
    session: {user: {id: seat.userId}},
    membership: {role: seat.role, restaurant: {id: seat.restaurantId}}
  }))
}));
vi.mock('next/cache', () => ({revalidatePath: vi.fn()}));

const {addMemberAction, updateMemberRoleAction, removeMemberAction} = await import('./team');

describe('team actions (integration)', () => {
  const slug = `team-${randomUUID().slice(0, 8)}`;
  const emails = [`teammate-${randomUUID().slice(0, 8)}@example.com`];
  let restaurantId: string;

  const listMembers = () => createRestaurantRepos(restaurantId).team.list();
  const seatOf = (email: string, role: string) => {
    const formData = new FormData();
    formData.set('locale', 'en');
    formData.set('email', email);
    formData.set('role', role);
    return formData;
  };
  const target = (userId: string, role: string) => {
    const formData = new FormData();
    formData.set('locale', 'en');
    formData.set('userId', userId);
    formData.set('role', role);
    return formData;
  };

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url))});
    const restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم الفريق',
      whatsappNumber: '+201005550197'
    });
    restaurantId = restaurant.id;
    seat.restaurantId = restaurantId;
    // The acting owner and the invitee are both real `user` rows; the owner's
    // seat is what the guard stub stands in for.
    seat.userId = randomUUID();
    await db.insert(users).values({id: seat.userId, name: 'المالك', email: `owner-${randomUUID().slice(0, 8)}@example.com`});
    await db.insert(users).values({id: randomUUID(), name: 'زميل', email: emails[0]});
    await createRestaurantRepos(restaurantId).team.addSeat(seat.userId, 'owner');
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
    await db.delete(users).where(eq(users.email, emails[0]));
    await client.end();
  });

  it('refuses a seat for an email with no account', async () => {
    seat.role = 'owner';
    await expect(
      addMemberAction({}, seatOf('nobody@example.com', 'staff'))
    ).resolves.toEqual({error: 'noSuchUser'});
  });

  it('seats an existing account and persists the role', async () => {
    seat.role = 'owner';
    await expect(addMemberAction({}, seatOf(emails[0], 'staff'))).resolves.toEqual({saved: true});
    expect(await listMembers()).toEqual(
      expect.arrayContaining([expect.objectContaining({email: emails[0], role: 'staff'})])
    );
  });

  it('refuses seating the same person twice', async () => {
    seat.role = 'owner';
    await expect(addMemberAction({}, seatOf(emails[0], 'manager'))).resolves.toEqual({
      error: 'alreadyMember'
    });
  });

  it('refuses non-owners from mutating the team', async () => {
    seat.role = 'manager';
    const [member] = (await listMembers()).filter((m) => m.email === emails[0]);
    if (!member) throw new Error('fixture seat missing');
    await expect(addMemberAction({}, seatOf(emails[0], 'staff'))).resolves.toEqual({
      error: 'forbidden'
    });
    await expect(updateMemberRoleAction({}, target(member.userId, 'manager'))).resolves.toEqual({
      error: 'forbidden'
    });
    await expect(removeMemberAction({}, target(member.userId))).resolves.toEqual({
      error: 'forbidden'
    });
  });

  it('changes a member role as the owner', async () => {
    seat.role = 'owner';
    const [member] = (await listMembers()).filter((m) => m.email === emails[0]);
    if (!member) throw new Error('fixture seat missing');
    await expect(updateMemberRoleAction({}, target(member.userId, 'manager'))).resolves.toEqual({
      saved: true
    });
    expect(await listMembers()).toEqual(
      expect.arrayContaining([expect.objectContaining({email: emails[0], role: 'manager'})])
    );
  });

  it("refuses acting on the owner's own seat", async () => {
    seat.role = 'owner';
    await expect(updateMemberRoleAction({}, target(seat.userId, 'staff'))).resolves.toEqual({
      error: 'self'
    });
    await expect(removeMemberAction({}, target(seat.userId))).resolves.toEqual({error: 'self'});
  });

  it('removes a member as the owner', async () => {
    seat.role = 'owner';
    const [member] = (await listMembers()).filter((m) => m.email === emails[0]);
    if (!member) throw new Error('fixture seat missing');
    const formData = new FormData();
    formData.set('locale', 'en');
    formData.set('userId', member.userId);
    await expect(removeMemberAction({}, formData)).resolves.toEqual({saved: true});
    expect((await listMembers()).filter((m) => m.email === emails[0])).toEqual([]);
  });
});
