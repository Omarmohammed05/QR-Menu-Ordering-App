'use client';

import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {MinusIcon, PlusIcon} from '@/components/icons';
import {localizedDescription, localizedName} from '@/lib/localize';
import type {PublicMenuItem} from '@/server/public-menu';

type Props = {
  item: PublicMenuItem;
  /** In-app path of the dish detail page (locale-prefixed by next-intl). */
  href: string;
  quantity: number;
  priceLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

/**
 * One dish as a warm card (Sunrise warmth): name, description, price chip,
 * thumbnail, and the add control — a circular warm button that swaps into a
 * gradient stepper pill once in the cart.
 */
export function DishRow({item, href, quantity, priceLabel, onIncrement, onDecrement}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();

  return (
    <li
      data-menu-item-id={item.id}
      className="flex items-start justify-between gap-4 rounded-2xl border border-warm-hairline bg-surface p-4 shadow-warm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#ff7043]/45 hover:shadow-warm-strong"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <Link href={href} className="min-w-0">
          <span className="font-semibold leading-snug text-warm-ink transition-colors hover:text-brand-strong">
            {localizedName(locale, item)}
          </span>
          {localizedDescription(locale, item) ? (
            <span className="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-warm-muted">
              {localizedDescription(locale, item)}
            </span>
          ) : null}
        </Link>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="w-fit rounded-full bg-brand-soft px-2.5 py-1 text-sm font-semibold text-brand-strong tabular-nums">
            {priceLabel}
          </span>
          {item.options.length > 0 ? (
            <span className="truncate text-xs text-warm-muted">{t('hasOptions')}</span>
          ) : null}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image
          <img
            src={item.imageUrl}
            alt={localizedName(locale, item)}
            className="size-16 rounded-xl border border-warm-hairline object-cover"
          />
        ) : null}

        {quantity === 0 ? (
          <button
            type="button"
            onClick={onIncrement}
            aria-label={`${t('add')} ${localizedName(locale, item)}`}
            className="grid size-10 place-items-center rounded-full border border-warm-hairline bg-warm-input text-brand-strong transition duration-150 hover:border-brand hover:bg-brand hover:text-white active:scale-95"
          >
            <PlusIcon className="size-4" />
          </button>
        ) : (
          <div
            role="group"
            aria-label={t('quantity')}
            className="animate-pop-in brand-gradient flex shrink-0 items-center gap-0.5 rounded-full p-0.5 text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)]"
          >
            <button
              type="button"
              onClick={onDecrement}
              aria-label={t('decrease')}
              className="grid size-9 place-items-center rounded-full transition duration-100 hover:bg-black/10 active:scale-90"
            >
              <MinusIcon className="size-4" />
            </button>
            <span className="min-w-4 text-center text-sm font-semibold tabular-nums" aria-hidden>
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              aria-label={t('increase')}
              className="grid size-9 place-items-center rounded-full transition duration-100 hover:bg-black/10 active:scale-90"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
