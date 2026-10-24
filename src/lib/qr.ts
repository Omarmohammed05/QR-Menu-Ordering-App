import QRCode from 'qrcode';

/**
 * Monochrome QR as inline SVG (matches the design tokens: black ink on
 * white). Rendered server-side; no client-side QR dependency.
 */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    width: 256,
    errorCorrectionLevel: 'M',
    color: {dark: '#000000', light: '#ffffff'}
  });
}
