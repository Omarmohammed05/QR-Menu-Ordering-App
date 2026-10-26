'use client';

import {useActionState, useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {localizedName} from '@/lib/localize';
import {MenuBookIcon} from '@/components/icons';
import {placeOrderAction, type PlaceOrderState} from '@/server/actions/place-order';
import type {PublicMenu} from '@/server/public-menu';
import {formatPrice} from '@/lib/format';
import {CartBar} from './cart-bar';
import {CategoryTabs, sectionId} from './category-tabs';
import {CheckoutSheet, type CheckoutLine} from './checkout-sheet';
import {DishRow} from './dish-row';
import {DishViewTracker} from './dish-view-tracker';
import {ItemOptionsSheet} from './item-options-sheet';

type Props = {
  menu: PublicMenu;
  tableToken: string | null;
};

const INITIAL_STATE: PlaceOrderState = {ok: false, error: null};

/** One cart entry: the dish plus its locked size/add-on selection. */
type CartEntry = {itemId: string; options: string[]; quantity: number};

/**
 * The customer's ordering surface: sticky category tabs, the dish list with
 * add steppers, a floating cart bar, and a checkout sheet. Cart prices are
 * display-only — the server re-prices every line (base price and selected
 * options) from the DB inside `placeOrderAction`.
 */
export function MenuView({menu, tableToken}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();
  const router = useRouter();
  /** Each entry is one dish + one exact option selection. */
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [configuring, setConfiguring] = useState<string | null>(null);
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
    router.push(state.statusUrl);
  }, [state, router]);

  const change = (entry: Omit<CartEntry, 'quantity'>, delta: number) => {
    setIdempotencyKey(crypto.randomUUID()); // the cart is changing → new order
    setCart((prev) => {
      const key = (line: Omit<CartEntry, 'quantity'>) =>
        line.options.length === 0 ? line.itemId : `${line.itemId}|${[...line.options].sort().join(',')}`;
      const index = prev.findIndex((line) => key(line) === key(entry));
      if (index === -1 && delta > 0) return [...prev, {...entry, quantity: delta}];
      if (index === -1) return prev;
      const next = [...prev];
      const quantity = Math.min(50, Math.max(0, next[index]!.quantity + delta));
      if (quantity <= 0) next.splice(index, 1);
      else next[index] = {...next[index]!, quantity};
      return next;
    });
  };

  const itemsById = useMemo(
    () => new Map(menu.categories.flatMap((c) => c.items).map((i) => [i.id, i])),
    [menu.categories]
  );
  const cartLines: CheckoutLine[] = cart.flatMap((entry) => {
    const item = itemsById.get(entry.itemId);
    if (!item) return [];
    const unitPricePiastres =
      entry.options.length === 0
        ? item.pricePiastres
        : // Deltas come from the same groups the sheet listed.
          item.pricePiastres +
          item.optionGroups
            .flatMap((group) => group.choices)
            .filter((choice) => entry.options.includes(choice.id))
            .reduce((sum, choice) => sum + choice.priceDeltaPiastres, 0);
    return [
      {
        item: {
          id: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          pricePiastres: item.pricePiastres,
          optionGroups: item.optionGroups
        },
        quantity: entry.quantity,
        options: entry.options,
        unitPricePiastres,
        lineTotalPiastres: unitPricePiastres * entry.quantity
      }
    ];
  });
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.lineTotalPiastres, 0);
  const currency = menu.restaurant.currency;
  const configuringItem = configuring ? itemsById.get(configuring) : null;
  const lineKey = (itemId: string, options: string[]) =>
    options.length === 0 ? itemId : `${itemId}|${[...options].sort().join(',')}`;
  const quantityFor = (itemId: string, options: string[] = []) =>
    cart
      .filter((line) => lineKey(line.itemId, line.options) === lineKey(itemId, options))
      .reduce((sum, line) => sum + line.quantity, 0);

  return (
    <>
      <DishViewTracker slug={menu.restaurant.slug} tableToken={tableToken} />

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
                        alt={localizedName(locale, category)}
                        className="size-7 rounded-full object-cover"
                      />
                    ) : null}
                    {localizedName(locale, category)}
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
                      quantity={quantityFor(item.id)}
                      priceLabel={formatPrice(item.pricePiastres, locale, currency)}
                      onIncrement={() => change({itemId: item.id, options: []}, 1)}
                      onDecrement={() => change({itemId: item.id, options: []}, -1)}
                      onConfigure={() => setConfiguring(item.id)}
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

      {menu.addresses.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('branches')}</h2>
          <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {menu.addresses.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-0.5 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <span className="font-medium">{entry.label}</span>
                <span className="text-xs text-muted-foreground">{entry.address}</span>
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
          tableLabel={menu.table?.label ?? null}
          idempotencyKey={idempotencyKey}
          action={formAction}
          state={state}
          pending={pending}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}

      {configuringItem && !checkoutOpen ? (
        <ItemOptionsSheet
          item={configuringItem}
          currency={currency}
          onClose={() => setConfiguring(null)}
          onAdd={(options, quantity) => {
            change({itemId: configuringItem.id, options}, quantity);
            setConfiguring(null);
          }}
        />
      ) : null}
    </>
  );
}
