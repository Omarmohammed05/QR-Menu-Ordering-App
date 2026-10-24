'use server';

import {and, eq, isNull} from 'drizzle-orm';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {z} from 'zod';
import {generateRandomString, hashPassword} from 'better-auth/crypto';
import {db} from '@/server/db';
import {accounts, restaurantInvites, restaurantMembers, users} from '@/server/db/schema';
import {invitesRepo} from '@/server/db/repos';

/**
 * The ONLY account-creation path: the restaurant owner arrives with the
 * invite code the platform owner sent them, sets their details, and is
 * seated as the tenant's owner — public sign-up is disabled entirely.
 */

/** Machine-readable failure codes; the form maps them to locale strings. */
export type ClaimState = {
  error?: 'code' | 'name' | 'email' | 'emailTaken' | 'weakPassword' | 'generic';
};

const payloadSchema = z.object({
  code: z.string().trim().min(6, 'code').max(32, 'code'),
  name: z.string().trim().min(1, 'name').max(200, 'name'),
  email: z.string().trim().toLowerCase().regex(/^\S+@\S+\.\S+$/, 'email'),
  password: z.string().min(8, 'weakPassword').max(128, 'weakPassword')
});

type Locale = (typeof routing.locales)[number];

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

function isUniqueViolation(error: unknown): boolean {
  const err = error as {cause?: {code?: string}; code?: string};
  return (err.cause?.code ?? err.code) === '23505';
}

/** Thrown inside the transaction when two claims race for one code. */
class InviteClaimedError extends Error {}

export async function claimInviteAction(
  _prev: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const locale = localeFrom(formData);
  const parsed = payloadSchema.safeParse({
    code: formData.get('code') ?? '',
    name: formData.get('name') ?? '',
    email: formData.get('email') ?? '',
    password: formData.get('password') ?? ''
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return {error: first === 'code' || first === 'name' || first === 'email' || first === 'weakPassword' ? first : 'generic'};
  }

  const invite = await invitesRepo.findUnclaimedByCode(parsed.data.code);
  if (!invite) return {error: 'code'};

  const [existing] = await db
    .select({id: users.id})
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) return {error: 'emailTaken'};

  try {
    const userId = generateRandomString(32);
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        name: parsed.data.name,
        email: parsed.data.email,
        emailVerified: true
      });
      // Same account rows Better Auth's credential provider writes, so the
      // owner signs in through the normal /login flow afterwards.
      await tx.insert(accounts).values({
        id: generateRandomString(32),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: await hashPassword(parsed.data.password)
      });
      await tx.insert(restaurantMembers).values({
        restaurantId: invite.restaurant.id,
        userId,
        role: 'owner'
      });
      const claimed = await tx
        .update(restaurantInvites)
        .set({claimedByUserId: userId, claimedAt: new Date()})
        .where(and(eq(restaurantInvites.id, invite.invite.id), isNull(restaurantInvites.claimedAt)))
        .returning({id: restaurantInvites.id});
      if (claimed.length === 0) throw new InviteClaimedError();
    });
  } catch (error) {
    if (error instanceof InviteClaimedError) return {error: 'code'};
    if (isUniqueViolation(error)) return {error: 'emailTaken'};
    return {error: 'generic'};
  }

  // next-intl's redirect isn't typed `never` — this only satisfies the
  // narrowing; it never runs (redirect throws).
  redirect({href: '/login?claimed=1', locale});
  return {error: 'generic'};
}
