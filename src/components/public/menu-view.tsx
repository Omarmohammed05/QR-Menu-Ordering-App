'use client';

import {useActionState, useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {placeOrderAction} from '@/server/actions/place-order';
import type {PublicMenu} from '@/server/public-menu';
import {formatPrice} from '@/lib/format';

type Props = {
  locale: string;
  menu: PublicMenu;
  tableToken: string | null;
};

/**
 * The customer's ordering surface: the dish list with add steppers, a cart
 * bar, and a checkout sheet. Cart prices are display-only — the server
 * re-prices every line from the DB inside `placeOrderAction`.
 */
export function MenuView({menu, tableToken}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();
  /** itemId → quantity. */
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [state, formAction, pending] = useActionState(placeOrderAction, {ok: false, error: null});

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

  const price = (item: PublicMenu['categories'][number]['items'][number]) =>
    formatPrice(item.pricePiastres, locale);

  const itemsById = new Map(menu.categories.flatMap((c) => c.items).map((i) => [i.id, i]));
  const cartLines = Object.entries(cart).flatMap(([id, quantity]) => {
    const item = itemsById.get(id);
    return item ? [{item, quantity}] : [];
  });
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce(
    (sum, line) => sum + line.item.pricePiastres * line.quantity,
    0
  );

  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground';

  return (
    <>
      <nav className="flex flex-col gap-8 pt-8">
        {menu.categories.map((category) => (
          <section key={category.id} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{category.nameAr}</h2>
            <ul className="flex flex-col divide-y divide-hairline border-t border-b border-hairline">
              {category.items.map((item) => {
                const quantity = cart[item.id] ?? 0;
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-medium">{item.nameAr}</span>
                      {item.descriptionAr ? (
                        <span className="text-sm text-muted-foreground">
                          {item.descriptionAr}
                        </span>
                      ) : null}
                      <span className="text-sm tabular-nums">{price(item)}</span>
                    </div>
                    {quantity === 0 ? (
                      <button
                        type="button"
                        onClick={() => change(item.id, 1)}
                        className="shrink-0 rounded-base bg-foreground px-4 py-2 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
                      >
                        {t('add')}
                      </button>
                    ) : (
                      <div
                        className="flex shrink-0 items-center gap-3 rounded-base border border-hairline px-2 py-1 tabular-nums"
                        aria-label={t('quantity')}
                      >
                        <button
                          type="button"
                          onClick={() => change(item.id, -1)}
                          className="px-2 py-1 text-lg leading-none text-muted-foreground transition-colors hover:text-foreground"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => change(item.id, 1)}
                          className="px-2 py-1 text-lg leading-none text-muted-foreground transition-colors hover:text-foreground"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      {cartCount > 0 && !checkoutOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {t('cartCount', {count: cartCount})}
              </span>
              <span className="text-base font-semibold tabular-nums">
                {formatPrice(cartTotal, locale)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="rounded-base bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
            >
              {t('checkout')}
            </button>
          </div>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-backdrop p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setCheckoutOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{t('checkoutTitle')}</h2>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('close')}
              </button>
            </div>
            <ul className="mb-4 flex flex-col gap-1 border-b border-hairline pb-3 text-sm">
              {cartLines.map(({item, quantity}) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span>
                    {item.nameAr} × {quantity}
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(item.pricePiastres * quantity, locale)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 pt-1 font-semibold">
                <span>{t('total')}</span>
                <span className="tabular-nums">{formatPrice(cartTotal, locale)}</span>
              </li>
            </ul>
            <form action={formAction} className="flex flex-col gap-3" noValidate>
              <input type="hidden" name="slug" value={menu.restaurant.slug} />
              <input type="hidden" name="tableToken" value={tableToken ?? ''} />
              <input type="hidden" name="cart" value={JSON.stringify(cartLines.map((line) => ({id: line.item.id, quantity: line.quantity})))} />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t('customerName')}</span>
                <input type="text" name="customerName" autoComplete="name" className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t('customerPhone')}</span>
                <input
                  type="tel"
                  name="customerPhone"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t('note')}</span>
                <input type="text" name="note" className={inputClass} />
              </label>
              {!state.ok && state.error ? (
                <p role="alert" className="text-sm font-medium">
                  {t(`errors.${state.error}`)}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="rounded-base bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
              >
                {pending ? t('working') : t('sendOnWhatsApp')}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
