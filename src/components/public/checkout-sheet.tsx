'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {CloseIcon, TableIcon} from '@/components/icons';
import {ImageUpload} from '@/components/dashboard/image-upload';
import {formatNumber, formatPrice} from '@/lib/format';
import {localizedName} from '@/lib/localize';
import {describeSelection, type PublicOptionGroup} from '@/lib/options';
import type {PlaceOrderState} from '@/server/actions/place-order';

export type CheckoutLine = {
  item: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    pricePiastres: number;
    optionGroups: PublicOptionGroup[];
  };
  quantity: number;
  /** Selected option choice ids for this line (empty for plain dishes). */
  options: string[];
  unitPricePiastres: number;
  lineTotalPiastres: number;
};

type Props = {
  lines: CheckoutLine[];
  totalPiastres: number;
  currency: string;
  slug: string;
  /** InstaPay address — null means the sheet offers cash only. */
  instapayHandle: string | null;
  /** Set when the customer scanned a table QR — pins the order to dine-in. */
  tableToken: string | null;
  tableLabel: string | null;
  /** One per cart content — a resubmit (double tap, retry) is idempotent. */
  idempotencyKey: string;
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
 * fields the server action re-validates and re-prices. Dine-in comes from
 * the scanned table; otherwise the customer toggles delivery (address
 * required) or takeaway.
 */
export function CheckoutSheet({
  lines,
  totalPiastres,
  currency,
  slug,
  instapayHandle,
  tableToken,
  tableLabel,
  idempotencyKey,
  action,
  state,
  pending,
  onClose
}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay'>('cash');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const isDineIn = Boolean(tableToken);

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

        {/* Order type: dine-in badge from the table QR, else the customer's toggle */}
        <div className="mb-4 flex flex-col gap-2">
          {isDineIn ? (
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-hairline px-3.5 py-1.5 text-xs font-medium">
              <TableIcon className="size-3.5 text-muted-foreground" />
              {tableLabel ? t('orderType.dineInTable', {label: tableLabel}) : t('orderType.dineIn')}
            </span>
          ) : (
            <>
              <span className="text-sm font-medium">{t('orderType.label')}</span>
              <div className="grid grid-cols-2 gap-1.5 rounded-full border border-hairline p-1">
                {(['delivery', 'takeaway'] as const).map((type) => {
                  const selected = orderType === type;
                  return (
                    <label
                      key={type}
                      className={`flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-sm transition-[transform,background-color] duration-100 active:scale-[0.98] ${
                        selected ? 'bg-foreground font-medium text-background' : 'text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderTypeChoice"
                        value={type}
                        checked={selected}
                        onChange={() => setOrderType(type)}
                        className="sr-only"
                      />
                      {t(`orderType.${type}`)}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <ul className="flex flex-col border-y border-hairline py-1 text-sm">
          {lines.map((line) => (
            <li key={`${line.item.id}-${line.options.join(',')}`} className="flex flex-col gap-0.5 py-2.5">
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                    ×{formatNumber(line.quantity, locale)}
                  </span>
                  <span className="truncate">{localizedName(locale, line.item)}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPrice(line.lineTotalPiastres, locale, currency)}
                </span>
              </span>
              {line.options.length > 0 ? (
                <span className="ps-9 text-xs leading-relaxed text-muted-foreground">
                  {describeSelection(locale, line.item.optionGroups, line.options, currency)}
                </span>
              ) : null}
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
          {!isDineIn ? <input type="hidden" name="orderType" value={orderType} /> : null}
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input
            type="hidden"
            name="cart"
            value={JSON.stringify(
              lines.map((line) => ({
                id: line.item.id,
                quantity: line.quantity,
                options: line.options
              }))
            )}
          />
          {/* Honeypot: invisible to humans, irresistible to bots (spec §11). */}
          <div aria-hidden className="hidden">
            <label>
              Company
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          {orderType === 'delivery' && !isDineIn ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t('deliveryAddress')}</span>
              <input
                type="text"
                name="deliveryAddress"
                autoComplete="street-address"
                placeholder={t('deliveryAddressPlaceholder')}
                className={inputClass}
              />
            </label>
          ) : null}
          {/* Payment: cash always; InstaPay only with a configured handle. */}
          {instapayHandle ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t('paymentLabel')}</span>
              <div className="grid grid-cols-2 gap-1.5 rounded-full border border-hairline p-1">
                {(['cash', 'instapay'] as const).map((method) => {
                  const selected = paymentMethod === method;
                  return (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-sm transition-[transform,background-color] duration-100 active:scale-[0.98] ${
                        selected ? 'bg-foreground font-medium text-background' : 'text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={selected}
                        onChange={() => setPaymentMethod(method)}
                        className="sr-only"
                      />
                      {t(`payment.${method}`)}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
          {paymentMethod === 'instapay' && instapayHandle ? (
            <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-muted/50 p-3.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('instapayHint', {
                  amount: formatPrice(totalPiastres, locale, currency),
                  handle: instapayHandle
                })}
              </p>
              <div
                dir="ltr"
                className="rounded-full border border-hairline bg-surface px-3.5 py-2 text-center font-mono text-sm"
              >
                {instapayHandle}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('instapayProof')}
                </span>
                <ImageUpload name="paymentProofUrl" value={null} rounded="lg" />
              </div>
            </div>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('customerName')}</span>
            <input type="text" name="customerName" autoComplete="name" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              {orderType === 'delivery' && !isDineIn
                ? t('customerPhoneRequired')
                : t('customerPhone')}
            </span>
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
