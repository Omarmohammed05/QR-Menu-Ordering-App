/**
 * Base44 sandbox preview only (renders null when BASE44_PREVIEW_MODE is
 * unset): the platform preview gateway answers WebSocket upgrade requests
 * with a 502, so the Next.js dev server's HMR socket (`/_next/hmr`) can
 * never connect through it. Without the shim every preview load logs a
 * WebSocket error and the client's reconnect loop eventually force-reloads
 * the page. The shim script (served from `/base44-hmr-shim.js`, served by
 * `src/app/base44-hmr-shim.js/route.ts`) swaps in a fake, permanently-open
 * idle socket for HMR URLs — all other WebSocket traffic falls through to
 * the native class.
 *
 * It is loaded as an `<script async>`: React 19 hoists async scripts into
 * the head and executes them without warnings, whereas the previous inline
 * `beforeInteractive` `<Script>` triggered React's "Encountered a script
 * tag while rendering React component" console error on every client
 * render. The tiny same-origin file executes during the initial page parse,
 * before the dev runtime's deferred HMR client creates its socket. Live
 * reload in the sandbox degrades to a manual page refresh — which is all
 * that was possible through the proxy anyway, since the upgrade was always
 * blocked.
 */
export function Base44PreviewHmrShim() {
  if (process.env.BASE44_PREVIEW_MODE !== '1') {
    return null;
  }
  return <script async src="/base44-hmr-shim.js" />;
}
