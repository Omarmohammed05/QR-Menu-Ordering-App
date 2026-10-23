import Script from 'next/script';

/**
 * Base44 sandbox preview only (no effect when BASE44_PREVIEW_MODE is unset):
 * the platform preview gateway answers WebSocket upgrade requests with a 502,
 * so the Next.js dev server's HMR socket (`/_next/hmr`) can never connect
 * through it. Without this shim the browser logs a WebSocket error on every
 * page load. The shim swaps in a fake, permanently-open idle socket for HMR
 * URLs (all other WebSocket traffic falls through to the native class), so
 * the HMR client believes it is connected and stops retrying. Live reload
 * degrades to a manual page refresh — which is all that was possible through
 * the proxy anyway, since the upgrade was always blocked.
 */
const SHIM = `(function () {
  var NativeWebSocket = window.WebSocket;
  if (!NativeWebSocket || window.__base44HmrShimmed) return;
  window.__base44HmrShimmed = true;
  var HMR_URL = /\\/_next\\/hmr/;
  function ShimWebSocket(url, protocols) {
    if (!HMR_URL.test(String(url))) {
      return protocols === undefined
        ? new NativeWebSocket(url)
        : new NativeWebSocket(url, protocols);
    }
    this.url = String(url);
    this.readyState = NativeWebSocket.OPEN;
    this.binaryType = 'arraybuffer';
    this.onopen = this.onmessage = this.onerror = this.onclose = null;
  }
  ShimWebSocket.prototype.send = function () {};
  ShimWebSocket.prototype.close = function () {
    this.readyState = NativeWebSocket.CLOSED;
  };
  ShimWebSocket.CONNECTING = NativeWebSocket.CONNECTING;
  ShimWebSocket.OPEN = NativeWebSocket.OPEN;
  ShimWebSocket.CLOSING = NativeWebSocket.CLOSING;
  ShimWebSocket.CLOSED = NativeWebSocket.CLOSED;
  window.WebSocket = ShimWebSocket;
})();`;

export function Base44PreviewHmrShim() {
  if (process.env.BASE44_PREVIEW_MODE !== '1') {
    return null;
  }
  return (
    // The lint rule assumes the Pages Router; in the App Router the
    // beforeInteractive queue is flushed by app-bootstrap before hydration
    // (verified: the shim is installed before the HMR socket is created).
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="base44-preview-hmr-shim"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{__html: SHIM}}
    />
  );
}
