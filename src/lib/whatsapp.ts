import { formatMoney, type Piastres } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";

/**
 * WhatsApp order handoff helpers (ADR-007): v1 orders are not persisted —
 * the customer's cart is rendered into a wa.me deep link and the restaurant
 * receives the order as a WhatsApp message.
 */

/** Normalizes a phone number to E.164 (+country...) or returns null. */
export function normalizeWhatsAppNumber(input: string): string | null {
  const cleaned = input.trim().replace(/[\s\-().]/g, "");
  const withPlus = cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
  if (!/^\+?\d{8,15}$/.test(withPlus) || /^0\d/.test(withPlus)) {
    return null;
  }
  return withPlus.startsWith("+") ? withPlus : `+${withPlus}`;
}

export type WhatsAppOrderLine = {
  name: string;
  qty: number;
  unitPricePiastres: Piastres;
};

/** Builds the localized order message sent to the restaurant. */
export function buildOrderMessage(
  locale: AppLocale,
  restaurantName: string,
  lines: WhatsAppOrderLine[],
  totalPiastres: Piastres,
): string {
  const greeting =
    locale === "ar"
      ? `مرحبًا، أودّ الطلب من ${restaurantName}:`
      : `Hello, I'd like to order from ${restaurantName}:`;
  const body = lines
    .map((line) => {
      const lineTotal = formatMoney(line.qty * line.unitPricePiastres, locale);
      return `• ${line.qty} × ${line.name} — ${lineTotal}`;
    })
    .join("\n");
  const total =
    locale === "ar"
      ? `الإجمالي: ${formatMoney(totalPiastres, locale)}`
      : `Total: ${formatMoney(totalPiastres, locale)}`;
  return `${greeting}\n${body}\n${total}`;
}

/** wa.me deep link for the order; null when the stored number is invalid. */
export function buildWhatsAppOrderUrl(input: {
  locale: AppLocale;
  restaurantName: string;
  whatsappNumber: string;
  lines: WhatsAppOrderLine[];
  totalPiastres: Piastres;
}): string | null {
  const number = normalizeWhatsAppNumber(input.whatsappNumber);
  if (!number) {
    return null;
  }
  const message = buildOrderMessage(
    input.locale,
    input.restaurantName,
    input.lines,
    input.totalPiastres,
  );
  return `https://wa.me/${number.slice(1)}?text=${encodeURIComponent(message)}`;
}
