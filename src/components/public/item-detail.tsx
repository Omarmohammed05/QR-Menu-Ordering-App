'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, useRouter} from '@/i18n/navigation';
import {CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon, StoreIcon} from '@/components/icons';
import {localizedDescription, localizedName} from '@/lib/localize';
import {addToCart, unitPiastres} from '@/lib/public-cart';
import {formatPrice} from '@/lib/format';
import type {PublicMenuItem} from '@/server/public-menu';

type Props = {
  item: PublicMenuItem;
  slug: string;
  currency: string;
  tableToken: string | null;
};

/**
 * The dish detail page: big photo, description, selectable paid options,
 * quantity stepper, and the add-to-cart bar. Adding merges into the
 * sessionStorage cart (same options → bump quantity) and returns the
 * customer to the menu, where the floating cart bar picks the line up.
 */
export function ItemDetail({item, slug, currency, tableToken}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const optionIds = [...selected];
  const unit = unitPiastres(item, optionIds);
  const menuHref = `/${slug}${tableToken ? `?t=${tableToken}` : ''}`;

  const toggleOption = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const add = () => {
    if (added) return;
    addToCart(slug, {itemId: item.id, optionIds, quantity});
    setAdded(true);
    // Back to the menu — the cart bar there confirms the line landed.
    setTimeout(() => router.push(menuHref), 900);
  };

  return (
    <main className="relative min-h-dvh bg-warm-canvas pb-28 text-warm-ink">
      <div aria-hidden className="sunrise-glow" />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6">
        <Link
          href={menuHref}
          className="flex w-fit items-center gap-1.5 rounded-full border border-warm-hairline bg-surface px-4 py-2 text-sm font-medium shadow-[0_4px_14px_rgba(255,87,34,0.10)] transition-[border-color] duration-150 hover:border-[#ff7043]"
        >
          <ChevronDownIcon className="size-4 rotate-90 rtl:-rotate-90" />
          {t('order.backToMenu')}
        </Link>

        <article className="animate-rise flex flex-col gap-5 rounded-[24px] border border-warm-hairline bg-surface p-5 shadow-warm sm:p-6">
          {item.imageUrls.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image */}
              <img
                src={item.imageUrls[activeImage] ?? item.imageUrls[0]}
                alt={localizedName(locale, item)}
                className="aspect-[16/9] w-full rounded-2xl object-cover"
              />
              {item.imageUrls.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.imageUrls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={localizedName(locale, item)}
                      aria-current={index === activeImage}
                      className={`shrink-0 overflow-hidden rounded-xl transition-all duration-150 ${
                        index === activeImage
                          ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image */}
                      <img src={url} alt="" className="size-16 object-cover sm:size-[72px]" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <span className="sunrise-gradient grid aspect-[16/9] w-full place-items-center rounded-2xl text-white shadow-warm">
              <StoreIcon className="size-14 opacity-80" />
            </span>
          )}

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {localizedName(locale, item)}
            </h1>
            {localizedDescription(locale, item) ? (
              <p className="text-[15px] leading-relaxed text-warm-muted">
                {localizedDescription(locale, item)}
              </p>
            ) : null}
            <span className="mt-1 w-fit rounded-full bg-brand-soft px-3 py-1.5 text-base font-semibold text-brand-strong tabular-nums">
              {formatPrice(item.pricePiastres, locale, currency)}
            </span>
          </div>

          {item.options.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-warm-hairline pt-5">
              <h2 className="text-base font-semibold">{t('options')}</h2>
              <ul className="flex flex-col gap-2">
                {item.options.map((option) => {
                  const isSelected = selected.has(option.id);
                  return (
                    <li key={option.id}>
                      <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition-[border-color,background-color] duration-150 ${
                          isSelected
                            ? 'border-[#ff7043] bg-brand-soft/60'
                            : 'border-warm-hairline bg-warm-input hover:border-[#ff7043]/50'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
                              isSelected
                                ? 'brand-gradient border-transparent text-white'
                                : 'border-hairline-strong bg-surface'
                            }`}
                          >
                            {isSelected ? <CheckIcon className="size-3.5" /> : null}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => toggleOption(option.id)}
                          />
                          <span className="truncate text-sm font-medium">
                            {localizedName(locale, option)}
                          </span>
                        </span>
                        {option.priceDeltaPiastres > 0 ? (
                          <span className="shrink-0 text-sm font-semibold text-brand-strong tabular-nums">
                            +{formatPrice(option.priceDeltaPiastres, locale, currency)}
                          </span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </article>
      </div>

      {/* Sticky add-to-cart bar: quantity stepper, live total, one tap add. */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="animate-float-up material mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-full border border-warm-hairline py-2 pe-2 ps-2.5 shadow-warm-strong">
          <div
            role="group"
            aria-label={t('quantity')}
            className="flex shrink-0 items-center gap-0.5 rounded-full bg-warm-pill p-0.5"
          >
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label={t('decrease')}
              className="grid size-9 place-items-center rounded-full transition duration-100 hover:bg-warm-hover active:scale-90"
            >
              <MinusIcon className="size-4" />
            </button>
            <span className="min-w-4 text-center text-sm font-semibold tabular-nums" aria-hidden>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label={t('increase')}
              className="grid size-9 place-items-center rounded-full transition duration-100 hover:bg-warm-hover active:scale-90"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
          <div className="flex min-w-0 flex-col items-end leading-tight">
            <span className="text-xs text-warm-muted">{t('total')}</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatPrice(unit * quantity, locale, currency)}
            </span>
          </div>
          <button
            type="button"
            onClick={add}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-transform duration-100 active:scale-[0.97] ${
              added ? 'bg-success' : 'brand-gradient shadow-[0_6px_16px_rgba(255,87,34,0.35)]'
            }`}
          >
            {added ? <CheckIcon className="size-4" /> : null}
            {added ? t('addedToCart') : t('addToCart')}
          </button>
        </div>
      </div>
    </main>
  );
}
