'use client';

import {useActionState, useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {MenuBookIcon} from '@/components/icons';
import {placeOrderAction, type PlaceOrderState} from '@/server/actions/place-order';
import type {PublicMenu} from '@/server/public-menu';
import {formatPrice} from '@/lib/format';
import {CartBar} from './cart-bar';
import {CategoryTabs, sectionId} from './category-tabs';
import {CheckoutSheet, type CheckoutLine} from './checkout-sheet';
import {DishRow} from './dish-row';

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
  /** itemId → quantity. */
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [state, formAction, pending] = useActionState(placeOrderAction, INITIAL_STATE);

  // Order persisted server-side → hand the customer to WhatsApp.
  useEffect(() => {
    if (state.ok) window.location.href = state.whatsappUrl;
  }, [state]);

  const change = (id: string, delta: number) =>
    setCart((prev) => {
      const next = {...prev};
      const quantity = (next[id] ?? 0) + delta;
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, 50);
      return next;
    });

  const itemsById = useMemo(
    () => new Map(menu.categories.flatMap((c) => c.items).map((i) => [i.id, i])),
    [menu.categories]
  );
  const cartLines: CheckoutLine[] = Object.entries(cart).flatMap(([id, quantity]) => {
    const item = itemsById.get(id);
    return item ? [{item, quantity}] : [];
  });
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce(
    (sum, line) => sum + line.item.pricePiastres * line.quantity,
    0
  );

  return (
    <>
      {menu.categories.length > 0 ? (
        <>
          <CategoryTabs categories={menu.categories} />

          <div className="flex flex-col gap-10">
            {menu.categories.map((category) => (
              <section
                key={category.id}
                id={sectionId(category.id)}
                className="flex scroll-mt-24 flex-col gap-3"
              >
                <header className="flex items-baseline justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    {category.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image
                      <img
                        src={category.imageUrl}
                        alt={category.nameAr}
                        className="size-7 rounded-full object-cover"
                      />
                    ) : null}
                    {category.nameAr}
                  </h2>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t('dishCount', {count: category.items.length})}
                  </span>
                </header>
                <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
                  {category.items.map((item) => (
                    <DishRow
                      key={item.id}
                      item={item}
                      quantity={cart[item.id] ?? 0}
                      priceLabel={formatPrice(item.pricePiastres, locale)}
                      onIncrement={() => change(item.id, 1)}
                      onDecrement={() => change(item.id, -1)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-hairline bg-surface px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <MenuBookIcon className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}

      {cartCount > 0 && !checkoutOpen ? (
        <CartBar
          count={cartCount}
          totalPiastres={cartTotal}
          onOpen={() => setCheckoutOpen(true)}
        />
      ) : null}

      {checkoutOpen && cartCount > 0 ? (
        <CheckoutSheet
          lines={cartLines}
          totalPiastres={cartTotal}
          slug={menu.restaurant.slug}
          tableToken={tableToken}
          action={formAction}
          state={state}
          pending={pending}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}
    </>
  );
}
