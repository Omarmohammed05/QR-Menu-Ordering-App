'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos, membersRepo} from '@/server/db/repos';

/**
 * Team management (`/dashboard/team`): seating existing accounts into the
 * restaurant. Public sign-up is closed — accounts are created only via the
 * platform owner's claim flow — so the team page seats users that already
 * exist; the typed email either resolves or the form says the person must
 * ask the platform for an account first. Only owners manage the team.
 */

const emailSchema = z.string().trim().toLowerCase().email('email').max(255, 'email');
const roleSchema = z.enum(['owner', 'manager', 'staff']);

type Locale = (typeof routing.locales)[number];

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

/** Machine-readable failure codes; the form maps them to locale strings. */
export type AddMemberState = {
  error?: 'email' | 'role' | 'noSuchUser' | 'alreadyMember' | 'forbidden' | 'generic';
  saved?: boolean;
};

/** Machine-readable failure codes for role changes and removals. */
export type MemberMutationState = {
  error?: 'notFound' | 'lastOwner' | 'self' | 'forbidden' | 'generic';
  saved?: boolean;
};

export async function addMemberAction(
  _prev: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role !== 'owner') return {error: 'forbidden'};

  const email = emailSchema.safeParse(formData.get('email') ?? '');
  const role = roleSchema.safeParse(formData.get('role') ?? '');
  if (!email.success) return {error: 'email'};
  if (!role.success) return {error: 'role'};

  const user = await membersRepo.findUserByEmail(email.data);
  if (!user) return {error: 'noSuchUser'};

  const {team} = createRestaurantRepos(membership.restaurant.id);
  if ((await team.list()).some((m) => m.userId === user.id)) {
    return {error: 'alreadyMember'};
  }

  try {
    await team.addSeat(user.id, role.data);
  } catch {
    // Lost race with a concurrent add — the seat already exists.
    return {error: 'alreadyMember'};
  }
  revalidatePath(`/${locale}/dashboard/team`);
  return {saved: true};
}

/**
 * Change a member's role. An owner can never edit their own seat (no
 * self-demote from the team screen) and can never demote the restaurant's
 * last other owner — whoever remains must keep administrative access.
 */
export async function updateMemberRoleAction(
  _prev: MemberMutationState,
  formData: FormData
): Promise<MemberMutationState> {
  const locale = localeFrom(formData);
  const {session, membership} = await requireMember(locale);
  if (membership.role !== 'owner') return {error: 'forbidden'};

  const userId = z.string().min(1).safeParse(formData.get('userId') ?? '');
  const role = roleSchema.safeParse(formData.get('role') ?? '');
  if (!userId.success) return {error: 'notFound'};
  if (!role.success) return {error: 'generic'};
  if (userId.data === session.user.id) return {error: 'self'};

  const {team} = createRestaurantRepos(membership.restaurant.id);
  const target = (await team.list()).find((m) => m.userId === userId.data);
  if (!target) return {error: 'notFound'};
  if (target.role === 'owner' && role.data !== 'owner') {
    if ((await team.countOtherOwners(userId.data)) === 0) return {error: 'lastOwner'};
  }

  if (!(await team.setRole(userId.data, role.data))) return {error: 'notFound'};
  revalidatePath(`/${locale}/dashboard/team`);
  return {saved: true};
}

/** Remove a member — same protections as the role change. */
export async function removeMemberAction(
  _prev: MemberMutationState,
  formData: FormData
): Promise<MemberMutationState> {
  const locale = localeFrom(formData);
  const {session, membership} = await requireMember(locale);
  if (membership.role !== 'owner') return {error: 'forbidden'};

  const userId = z.string().min(1).safeParse(formData.get('userId') ?? '');
  if (!userId.success) return {error: 'notFound'};
  if (userId.data === session.user.id) return {error: 'self'};

  const {team} = createRestaurantRepos(membership.restaurant.id);
  const target = (await team.list()).find((m) => m.userId === userId.data);
  if (!target) return {error: 'notFound'};
  if (target.role === 'owner' && (await team.countOtherOwners(userId.data)) === 0) {
    return {error: 'lastOwner'};
  }

  if (!(await team.removeSeat(userId.data))) return {error: 'notFound'};
  revalidatePath(`/${locale}/dashboard/team`);
  return {saved: true};
}
