import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {db} from '@/server/db';
import {accounts, sessions, users, verifications} from '@/server/db/schema';
import {env} from '@/server/env';

/**
 * Better Auth over our Phase 1 tables (ADR-002 schema): `user`, `session`,
 * `account`, `verification`. Email + password is the credential — restaurant
 * owners sign in to the dashboard; customers never authenticate.
 */

// Base44 sandbox preview only: the gateway serves the app at
// `https://3000-<suffix>` while the server sees the internal sandbox host, so
// the browser Origin never matches the inferred base URL. Without trusting the
// preview origin, Better Auth rejects every POST as CSRF. No effect outside
// the sandbox (flag unset) — production sets AUTH_URL instead.
const previewTrustedOrigins =
  process.env.BASE44_PREVIEW_MODE === '1' && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? [`https://3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
    : [];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications
    }
  }),
  // Unset in dev/sandbox: Better Auth infers the base URL from the request.
  // Set in production (e.g. the deployment origin).
  baseURL: env.AUTH_URL,
  trustedOrigins: previewTrustedOrigins,
  // Public sign-up is closed: accounts are ONLY created through the platform
  // owner's invite flow (admin page → claim code), so the endpoint is dead.
  disabledPaths: ['/sign-up/email'],
  emailAndPassword: {
    enabled: true
  }
});
