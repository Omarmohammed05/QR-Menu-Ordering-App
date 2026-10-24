import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Base44 sandbox preview only: allow the dev server to serve assets/HMR
  // to the preview origin. No effect outside the sandbox (flag unset).
  ...(process.env.BASE44_PREVIEW_MODE === '1' && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? {
        // Hostname only — Next matches the bare Origin/Referer host against
        // these patterns; a protocol prefix would never match.
        allowedDevOrigins: [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
      }
    : {})
};

export default withNextIntl(nextConfig);
