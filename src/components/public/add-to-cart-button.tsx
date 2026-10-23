"use client";

import { useTranslations } from "next-intl";
import { useCart } from "./cart-provider";

/** Add button that becomes a −/qty/+ stepper once the item is in the cart. */
export function AddToCartButton({
  itemId,
  name,
  pricePiastres,
}: {
  itemId: string;
  name: string;
  pricePiastres: number;
}) {
  const t = useTranslations("publicMenu");
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(itemId);

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => add({ id: itemId, name, pricePiastres })}
        className="press inline-flex min-h-10 shrink-0 self-center rounded-[var(--radius-pill)] bg-[var(--invert-bg)] px-4 text-sm font-medium text-[var(--invert-fg)] shadow-[var(--shadow-sm)]"
      >
        {t("addToCart")}
      </button>
    );
  }

  return (
    <div className="press inline-flex min-h-10 shrink-0 self-center items-center rounded-[var(--radius-pill)] border border-[var(--line-strong)]">
      <button
        type="button"
        aria-label={t("decreaseQty")}
        onClick={() => setQty(itemId, qty - 1)}
        className="flex size-10 items-center justify-center text-lg text-[var(--fg-muted)]"
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
      <button
        type="button"
        aria-label={t("increaseQty")}
        onClick={() => setQty(itemId, qty + 1)}
        className="flex size-10 items-center justify-center text-lg text-[var(--fg-muted)]"
      >
        +
      </button>
    </div>
  );
}
