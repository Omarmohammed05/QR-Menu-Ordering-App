import {z} from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
  AUTH_URL: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
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
  IMGBB_API_KEY: z.string().min(1).optional()
});

export type Env = z.infer<typeof envSchema>;

/** Pure parser so tests can validate arbitrary inputs. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

/** Fail fast at boot: importing this module with a bad env crashes the process. */
export const env = parseEnv(process.env as Record<string, string | undefined>);
