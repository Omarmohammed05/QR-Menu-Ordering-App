import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listMembershipsForUser, type Membership } from "@/server/repos/memberships";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(locale: string): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in`);
  }
  return session;
}

/** Super admin surfaces additionally require TOTP 2FA (spec section 10). */
export async function requireSuperAdmin(locale: string): Promise<Session> {
  const session = await requireSession(locale);
  if (!session.user.superAdmin) {
    redirect(`/${locale}/dashboard`);
  }
  if (!session.user.twoFactorEnabled) {
    redirect(`/${locale}/security`);
  }
  return session;
}

export async function getMemberships(userId: string): Promise<Membership[]> {
  return listMembershipsForUser(userId);
}
