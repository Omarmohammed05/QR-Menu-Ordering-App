import {NextResponse} from 'next/server';

/**
 * Base44 sandbox preview only: serves the HMR WebSocket shim as a plain JS
 * file (see `base44-preview-hmr-shim.tsx` for why the shim exists). Loaded by
 * the layout as an `<script async>` — React 19 hoists and executes async
 * scripts natively, while inline `beforeInteractive` scripts now trigger
 * React's "script tag inside a React component" warning on client render.
 * 404 outside the sandbox so production never serves it.
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

export function GET() {
  if (process.env.BASE44_PREVIEW_MODE !== '1') {
    return new NextResponse('Not Found', {status: 404});
  }
  return new NextResponse(SHIM, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
