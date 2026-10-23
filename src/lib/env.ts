import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z
    .union([z.literal("development"), z.literal("test"), z.literal("production")])
    .default("development"),
});

export const env = envSchema.parse(process.env);
