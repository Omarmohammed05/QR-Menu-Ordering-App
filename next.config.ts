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
  experimental: {
    // Item photos upload through Server Actions (ADR-008); the 1 MB default
    // is too small for the 4 MB accepted photo size.
    serverActions: {
      bodySizeLimit: "5mb",
      // Base44 sandbox preview only: the proxy forwards a different origin
      // HOST than the public one. Next 15.5 compares the bare origin HOST
      // against allowedOrigins (no protocol), so the entry must be host-only
      // to match. Outside the sandbox this is not set.
      ...(isBase44Preview && previewSuffix
        ? { allowedOrigins: [`3000-${previewSuffix}`] }
        : {}),
    },
  },
  ...(isBase44Preview && previewSuffix ? { allowedDevOrigins: [`3000-${previewSuffix}`] } : {}),
};

export default withNextIntl(nextConfig);
