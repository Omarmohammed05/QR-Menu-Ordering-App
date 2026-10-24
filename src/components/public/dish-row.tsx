'use client';

import {useTranslations} from 'next-intl';
import {MinusIcon, PlusIcon} from '@/components/icons';
import type {PublicMenuItem} from '@/server/public-menu';

type Props = {
  item: PublicMenuItem;
  quantity: number;
  priceLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

/**
 * One dish line: name, description, price, and the add control — a circular
 * hairline button that swaps into a black stepper pill once in the cart.
 */
export function DishRow({item, quantity, priceLabel, onIncrement, onDecrement}: Props) {
  const t = useTranslations('publicMenu');

  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image
            <img
              src={item.imageUrl}
              alt={item.nameAr}
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          ) : null}
          <span className="truncate font-medium">{item.nameAr}</span>
        </span>
        {item.descriptionAr ? (
          <span className="text-sm leading-relaxed text-muted-foreground">
            {item.descriptionAr}
          </span>
        ) : null}
        <span className="mt-1 text-sm font-medium tabular-nums">{priceLabel}</span>
      </div>

      {quantity === 0 ? (
        <button
          type="button"
          onClick={onIncrement}
          aria-label={`${t('add')} ${item.nameAr}`}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-hairline-strong transition duration-100 hover:bg-muted active:scale-95"
        >
          <PlusIcon className="size-4" />
        </button>
      ) : (
        <div
          role="group"
          aria-label={t('quantity')}
          className="animate-pop-in flex shrink-0 items-center gap-0.5 rounded-full bg-foreground p-0.5 text-background"
        >
          <button
            type="button"
            onClick={onDecrement}
            aria-label={t('decrease')}
            className="grid size-9 place-items-center rounded-full transition duration-100 hover:bg-background/10 active:scale-90"
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
            className="grid size-9 place-items-center rounded-full transition duration-100 hover:bg-background/10 active:scale-90"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}
