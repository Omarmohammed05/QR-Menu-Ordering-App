import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { env } from "@/lib/env";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { logger } from "@/server/logger";

// Base44 sandbox preview only: trust the preview proxy origin for auth POSTs.
const isBase44Preview = process.env.BASE44_PREVIEW_MODE === "1";
const previewSuffix = process.env.BASE44_PUBLIC_HOST_SUFFIX;

export const auth = betterAuth({
  appName: "QR Menu",
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: isBase44Preview && previewSuffix ? [`https://3000-${previewSuffix}`] : [],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 10,
    sendResetPassword: async ({ url }) => {
      // ADR-003: no email provider in v1. In dev the link is logged (token only,
      // no PII); in production this is the hook for the future provider.
      if (env.NODE_ENV !== "production") {
        logger.info({ url }, "dev-only password reset link");
      }
    },
  },
  user: {
    additionalFields: {
      superAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 300 },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [twoFactor(), nextCookies()],
});
