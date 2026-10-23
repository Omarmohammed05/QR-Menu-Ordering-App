"use client";

import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { formatMoney } from "@/lib/money";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { useCart } from "./cart-provider";

/**
 * Sticky bottom bar with the cart total and the WhatsApp handoff button
 * (ADR-007). Rendered only when ordering is enabled for the restaurant.
 */
export function CartBar({
  locale,
  restaurantName,
  whatsappNumber,
}: {
  locale: AppLocale;
  restaurantName: string;
  whatsappNumber: string;
}) {
  const t = useTranslations("publicMenu");
  const { lines, clear } = useCart();

  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const totalPiastres = lines.reduce((sum, line) => sum + line.qty * line.pricePiastres, 0);
  const orderUrl =
    count > 0
      ? buildWhatsAppOrderUrl({
          locale,
          restaurantName,
          whatsappNumber,
          lines: lines.map((line) => ({
            name: line.name,
            qty: line.qty,
            unitPricePiastres: line.pricePiastres,
          })),
          totalPiastres,
        })
      : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--bg)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-5 py-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-xs text-[var(--fg-muted)]">
            {t("itemCount", { count })}
          </span>
          <span className="font-semibold tabular-nums">{formatMoney(totalPiastres, locale)}</span>
        </span>
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-12 items-center rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-4 text-sm"
        >
          {t("clearCart")}
        </button>
        {orderUrl ? (
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--invert-bg)] px-5 py-2 text-sm font-medium text-[var(--invert-fg)]"
          >
            {t("orderWhatsApp")}
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--invert-bg)] px-5 py-2 text-sm font-medium text-[var(--invert-fg)] opacity-50"
          >
            {t("orderWhatsApp")}
          </span>
        )}
      </div>
    </div>
  );
}
