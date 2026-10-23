import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Base44 sandbox preview only: allow the preview proxy origin to fetch dev
// assets / HMR and Server Actions (the proxy forwards a different host than
// the public origin). Outside the sandbox (flag unset or not "1") this is a
// no-op.
const previewSuffix = process.env.BASE44_PUBLIC_HOST_SUFFIX;
const isBase44Preview = process.env.BASE44_PREVIEW_MODE === "1";

const nextConfig: NextConfig = {
  ...(isBase44Preview && previewSuffix
    ? {
        allowedDevOrigins: [`3000-${previewSuffix}`],
        experimental: {
          serverActions: { allowedOrigins: [`https://3000-${previewSuffix}`] },
        },
      }
    : {}),
};

export default withNextIntl(nextConfig);
