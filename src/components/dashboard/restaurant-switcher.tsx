'use client';

import {useLocale} from 'next-intl';
import {useRef} from 'react';
import {useTranslations} from 'next-intl';
import {switchRestaurantAction} from '@/server/actions/switch-restaurant';
import {ChevronDownIcon, StoreIcon} from '@/components/icons';

type Props = {
  restaurants: {id: string; nameAr: string}[];
  activeId: string;
};

/** Header pill for members of more than one restaurant; static label otherwise. */
export function RestaurantSwitcher({restaurants, activeId}: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);

  if (restaurants.length < 2) {
    return (
      <span className="flex min-w-0 items-center gap-2 rounded-full border border-hairline px-3 py-1.5">
        <StoreIcon className="size-4 shrink-0" />
        <span className="truncate text-sm font-medium">{restaurants[0]?.nameAr}</span>
      </span>
    );
  }

  return (
    <form ref={formRef} action={switchRestaurantAction} className="min-w-0">
      <input type="hidden" name="locale" value={locale} />
      <label className="relative flex items-center">
        <StoreIcon className="pointer-events-none absolute start-3 size-4 text-muted-foreground" />
        <select
          name="restaurantId"
          value={activeId}
          aria-label={t('switchRestaurant')}
          onChange={() => formRef.current?.requestSubmit()}
          className="max-w-56 cursor-pointer appearance-none truncate rounded-full border border-hairline bg-surface py-1.5 pe-8 ps-9 text-sm font-medium transition-[transform,border-color] duration-100 hover:border-hairline-strong active:scale-[0.98]"
        >
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.nameAr}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute end-2.5 size-4 text-muted-foreground" />
      </label>
    </form>
  );
}
