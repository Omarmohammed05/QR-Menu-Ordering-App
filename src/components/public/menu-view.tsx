import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized, type LocalizedText } from "@/lib/localized-text";
import { formatMoney } from "@/lib/money";
import type { MenuSnapshot } from "@/server/services/menu";
import { CartProvider } from "./cart-provider";
import { CartBar } from "./cart-bar";
import { AddToCartButton } from "./add-to-cart-button";

/**
 * Customer-facing menu (the QR target). Server-rendered and read-only:
 * unavailable items are hidden, and empty categories never appear.
 * Ordering (cart + WhatsApp handoff, ADR-007) appears only when the
 * restaurant has a WhatsApp number and is accepting orders.
 */
export async function MenuView({
  slug,
  name,
  description,
  menu,
  locale,
  whatsappNumber,
  acceptingOrders,
}: {
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  menu: MenuSnapshot;
  locale: AppLocale;
  whatsappNumber: string | null;
  acceptingOrders: boolean;
}) {
  const t = await getTranslations("publicMenu");
  const target: AppLocale = locale === "ar" ? "en" : "ar";
  const orderingEnabled = Boolean(whatsappNumber) && acceptingOrders;

  const categories = menu
    .map((category) => ({ ...category, items: category.items.filter((item) => item.isAvailable) }))
    .filter((category) => category.items.length > 0);

  return (
    <CartProvider>
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-5 py-10 pb-32">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-relaxed">{pickLocalized(name, locale)}</h1>
          <Link
            href={`/menu/${slug}`}
            locale={target}
            className="inline-flex min-h-12 shrink-0 items-center rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-5 py-2 text-sm"
          >
            {t("language")}
          </Link>
        </div>
        {description ? (
          <p className="text-sm text-[var(--fg-muted)]">{pickLocalized(description, locale)}</p>
        ) : null}
      </header>

      {whatsappNumber && !acceptingOrders ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--fg-muted)]">
          {t("notAccepting")}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <p className="text-sm text-[var(--fg-muted)]">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <section key={category.id} aria-labelledby={`category-${category.id}`} className="flex flex-col gap-4">
              <h2 id={`category-${category.id}`} className="text-lg font-semibold">
                {pickLocalized(category.name, locale)}
              </h2>
              <ul className="flex flex-col gap-3">
                {category.items.map((item) => {
                  const itemName = pickLocalized(item.name, locale);
                  return (
                    <li
                      key={item.id}
                      className="flex gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--bg-subtle)] p-4"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={itemName}
                          className="h-20 w-20 shrink-0 rounded-[var(--radius-sm)] object-cover"
                        />
                      ) : null}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="min-w-0 font-medium">{itemName}</h3>
                          <span className="shrink-0 font-medium tabular-nums">
                            {formatMoney(item.pricePiastres, locale)}
                          </span>
                        </div>
                        {item.description ? (
                          <p className="text-sm leading-relaxed text-[var(--fg-muted)]">
                            {pickLocalized(item.description, locale)}
                          </p>
                        ) : null}
                        {orderingEnabled ? (
                          <AddToCartButton
                            itemId={item.id}
                            name={itemName}
                            pricePiastres={item.pricePiastres}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
    {orderingEnabled && whatsappNumber ? (
      <CartBar
        locale={locale}
        restaurantName={pickLocalized(name, locale)}
        whatsappNumber={whatsappNumber}
      />
    ) : null}
    </CartProvider>
  );
}
