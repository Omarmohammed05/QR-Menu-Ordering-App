import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z
    .union([z.literal("development"), z.literal("test"), z.literal("production")])
    .default("development"),
  /** Better Auth signing key. openssl rand -base64 32 */
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
