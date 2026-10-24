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
        allowedDevOrigins: [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`],
      // Next 16.4.3 defaults experimental.reactDebugChannel to true. React then
      // closes the flight response only after BOTH the RSC stream and the
      // debug channel finish — and the debug chunks are delivered over the HMR
      // WebSocket, which can never connect through the preview gateway (502
      // on upgrade). Without this the page never hydrates in the sandbox. On a
      // normal dev machine the socket connects, so keep the default there.
      experimental: {reactDebugChannel: false}
      }
    : {})
};

export default withNextIntl(nextConfig);
