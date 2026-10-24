'use client';

import {useActionState, useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {localizedName} from '@/lib/localize';
import {MapPinIcon, MenuBookIcon} from '@/components/icons';
import {placeOrderAction, type PlaceOrderState} from '@/server/actions/place-order';
import type {PublicMenu} from '@/server/public-menu';
import {
  clearCart,
  lineKey,
  loadCart,
  saveCart,
  unitPiastres,
  type CartLine
} from '@/lib/public-cart';
import {formatPrice} from '@/lib/format';
import {CartBar} from './cart-bar';
import {CategoryTabs, sectionId} from './category-tabs';
import {CheckoutSheet, type CheckoutLine} from './checkout-sheet';
import {DishRow} from './dish-row';
import {DishViewTracker} from './dish-view-tracker';

type Props = {
  menu: PublicMenu;
  tableToken: string | null;
};

const INITIAL_STATE: PlaceOrderState = {ok: false, error: null};

/**
 * The customer's ordering surface: sticky category tabs, the dish list with
 * add steppers, a floating cart bar, and a checkout sheet. Cart prices are
 * display-only — the server re-prices every line from the DB inside
 * `placeOrderAction`.
 */
export function MenuView({menu, tableToken}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();
  const router = useRouter();
  /** The cart lives in sessionStorage, so it survives the trip to a dish's
   * detail page and back (and a page refresh). Hydrated after mount. */
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    setCart(loadCart(menu.restaurant.slug));
  }, [menu.restaurant.slug]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [state, formAction, pending] = useActionState(placeOrderAction, INITIAL_STATE);
  // Fresh key whenever the cart changes: a retry of the SAME cart is
  // idempotent, an edited cart is a new order.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // Order persisted server-side → hand the customer to WhatsApp, then land
  // on the status page (unmounting this view clears the cart with it). The
  // popup can be blocked (it fires after an async round-trip, not the tap) —
  // the status page re-offers the same link from sessionStorage, and the
  // order is already saved either way.
  useEffect(() => {
    if (!state.ok) return;
    try {
      sessionStorage.setItem(`order-wa:${state.publicId}`, state.whatsappUrl);
    } catch {
      /* storage unavailable — the status page still works, minus the fallback */
    }
    window.open(state.whatsappUrl, '_blank');
    clearCart(menu.restaurant.slug); // the order is placed — the cart is spent
    router.push(state.statusUrl);
  }, [state, router]);

  /** Bump one line: same dish + same option selection shares a quantity. */
  const change = (itemId: string, optionIds: string[], delta: number) => {
    setIdempotencyKey(crypto.randomUUID()); // the cart is changing → new order
    setCart((prev) => {
      const key = lineKey(itemId, optionIds);
      const next = prev.map((line) => ({...line}));
      const existing = next.find((line) => lineKey(line.itemId, line.optionIds) === key);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + delta, 50);
      } else if (delta > 0) {
        next.push({itemId, optionIds, quantity: delta});
      }
      const kept = next.filter((line) => line.quantity > 0);
      saveCart(menu.restaurant.slug, kept);
      return kept;
    });
  };

  const itemsById = useMemo(
    () => new Map(menu.categories.flatMap((c) => c.items).map((i) => [i.id, i])),
    [menu.categories]
  );
  const cartLines: CheckoutLine[] = cart.flatMap((line) => {
    const item = itemsById.get(line.itemId);
    return item
      ? [{item, optionIds: line.optionIds, quantity: line.quantity, unitPiastres: unitPiastres(item, line.optionIds)}]
      : [];
  });
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce(
    (sum, line) => sum + line.unitPiastres * line.quantity,
    0
  );
  const currency = menu.restaurant.currency;

  return (
    <>
      <DishViewTracker slug={menu.restaurant.slug} tableToken={tableToken} />

      {menu.categories.length > 0 ? (
        <>
          <CategoryTabs categories={menu.categories} />

          <div className="flex flex-col gap-9">
            {menu.categories.map((category, index) => (
              <section
                key={category.id}
                id={sectionId(category.id)}
                style={{animationDelay: `${index * 70}ms`}}
                className="animate-rise flex scroll-mt-24 flex-col gap-3"
              >
                <header className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-warm-ink">
                      {category.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image
                        <img
                          src={category.imageUrl}
                          alt={localizedName(locale, category)}
                          className="size-8 rounded-full border border-warm-hairline object-cover"
                        />
                      ) : null}
                      {localizedName(locale, category)}
                    </h2>
                    <span className="tick" aria-hidden />
                  </div>
                  <span className="shrink-0 rounded-full bg-warm-chip px-3 py-1 text-xs font-medium text-warm-muted">
                    {t('dishCount', {count: category.items.length})}
                  </span>
                </header>
                <ul className="flex flex-col gap-3">
                  {category.items.map((item) => (
                    <DishRow
                      key={item.id}
                      item={item}
                      href={`/${menu.restaurant.slug}/item/${item.id}${
                        tableToken ? `?t=${tableToken}` : ''
                      }`}
                      quantity={
                        cart.find(
                          (line) => line.itemId === item.id && line.optionIds.length === 0
                        )?.quantity ?? 0
                      }
                      priceLabel={formatPrice(item.pricePiastres, locale, currency)}
                      onIncrement={() => change(item.id, [], 1)}
                      onDecrement={() => change(item.id, [], -1)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="animate-rise flex flex-col items-center gap-3 rounded-[24px] border border-warm-hairline bg-surface px-6 py-14 text-center shadow-warm">
          <span className="grid size-12 place-items-center rounded-full bg-warm-chip text-brand-strong">
            <MenuBookIcon className="size-6" />
          </span>
          <p className="text-sm text-warm-muted">{t('empty')}</p>
        </div>
      )}

      {menu.addresses.length > 0 ? (
        <section className="animate-rise flex flex-col gap-3" style={{animationDelay: '120ms'}}>
          <h2 className="flex flex-col gap-1 text-xl font-bold tracking-tight text-warm-ink">
            {t('branches')}
            <span className="tick" aria-hidden />
          </h2>
          <ul className="flex flex-col gap-3">
            {menu.addresses.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 rounded-2xl border border-warm-hairline bg-surface p-4 shadow-warm"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warm-chip text-brand-strong">
                  <MapPinIcon className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-warm-ink">{entry.label}</span>
                  <span className="text-xs leading-relaxed text-warm-muted">{entry.address}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {cartCount > 0 && !checkoutOpen ? (
        <CartBar
          count={cartCount}
          totalPiastres={cartTotal}
          currency={currency}
          onOpen={() => setCheckoutOpen(true)}
        />
      ) : null}

      {checkoutOpen && cartCount > 0 ? (
        <CheckoutSheet
          lines={cartLines}
          totalPiastres={cartTotal}
          currency={currency}
          slug={menu.restaurant.slug}
          instapayHandle={menu.restaurant.instapayHandle}
          tableToken={tableToken}
          idempotencyKey={idempotencyKey}
          action={formAction}
          state={state}
          pending={pending}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}
    </>
  );
}
