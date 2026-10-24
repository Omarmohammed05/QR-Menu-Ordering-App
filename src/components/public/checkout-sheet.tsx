'use client';

import {useEffect} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {CloseIcon} from '@/components/icons';
import {formatNumber, formatPrice} from '@/lib/format';
import type {PlaceOrderState} from '@/server/actions/place-order';
import type {PublicMenuItem} from '@/server/public-menu';

export type CheckoutLine = {item: PublicMenuItem; quantity: number};

type Props = {
  lines: CheckoutLine[];
  totalPiastres: number;
  currency: string;
  slug: string;
  tableToken: string | null;
  action: (formData: FormData) => void;
  state: PlaceOrderState;
  pending: boolean;
  onClose: () => void;
};

const inputClass =
  'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground';

/**
 * Order confirmation as an Apple-style sheet: rises from the bottom edge on
 * phones, centered on larger screens. The form posts the exact same hidden
 * fields the server action re-validates and re-prices.
 */
export function CheckoutSheet({
  lines,
  totalPiastres,
  currency,
  slug,
  tableToken,
  action,
  state,
  pending,
  onClose
}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('close')}
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-[var(--backdrop)]"
      />
      <div className="animate-sheet-up relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl border border-hairline bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl">
        <span className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline-strong sm:hidden" aria-hidden />

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('checkoutTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <ul className="flex flex-col border-y border-hairline py-1 text-sm">
          {lines.map(({item, quantity}) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  ×{formatNumber(quantity, locale)}
                </span>
                <span className="truncate">{item.nameAr}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatPrice(item.pricePiastres * quantity, locale, currency)}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 py-2.5 font-semibold">
            <span>{t('total')}</span>
            <span className="tabular-nums">{formatPrice(totalPiastres, locale, currency)}</span>
          </li>
        </ul>

        <form action={action} className="mt-4 flex flex-col gap-3" noValidate>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="tableToken" value={tableToken ?? ''} />
          <input
            type="hidden"
            name="cart"
            value={JSON.stringify(lines.map((line) => ({id: line.item.id, quantity: line.quantity})))}
          />
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
            className="rounded-base bg-foreground px-4 py-3 text-sm font-medium text-background transition-transform duration-100 active:scale-[0.99] disabled:opacity-50"
          >
            {pending ? t('working') : t('sendOnWhatsApp')}
          </button>
        </form>
      </div>
    </div>
  );
}
