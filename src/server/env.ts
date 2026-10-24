import {z} from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
  AUTH_URL: z.string().min(1).optional(),
  /**
   * The absolute public origin (`https://baitelsham.com`) that public URLs are
   * built from — QR codes, canonical/hreflang, Open Graph, sitemap. Never
   * derived from the request host, so a misrouted proxy can't poison it.
   */
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be an absolute URL')
    .transform((value) => value.replace(/\/+$/, '')),
  /** imgbb API key — public menu/dish images are uploaded through it. */
  IMGBB_API_KEY: z.string().min(1).optional(),
  /**
   * The account email that owns the whole platform — the admin page and
   * restaurant creation are gated on it. Unset: platform-owner features stay
   * hidden and no one can create accounts.
   */
  PLATFORM_OWNER_EMAIL: z.string().trim().toLowerCase().min(3).optional()
});

export type Env = z.infer<typeof envSchema>;

/**
 * Pure parser so tests can validate arbitrary inputs.
 *
 * `next build` (Vercel/CI) imports every route module to collect page data —
 * runtime secrets like DATABASE_URL legitimately may not exist in that build
 * worker, so an invalid env there yields an empty shell instead of crashing
 * the build. Nothing queries or serves during build, and the first real access
 * at runtime (any other NEXT_PHASE) still validates strictly and fails fast.
 */
export function parseEnv(
  source: Record<string, string | undefined>,
  nextPhase = process.env.NEXT_PHASE
): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;
  if (nextPhase === 'phase-production-build') return {} as Env;
  throw result.error;
}

/** Fail fast at boot: importing this module with a bad env crashes the process. */
export const env = parseEnv(process.env as Record<string, string | undefined>);
