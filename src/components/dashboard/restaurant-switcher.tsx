'use client';

import {useRef} from 'react';
import {useTranslations} from 'next-intl';
import {switchRestaurantAction} from '@/server/actions/switch-restaurant';

type Props = {
  locale: string;
  restaurants: {id: string; nameAr: string}[];
  activeId: string;
};

/** Header picker for members of more than one restaurant. */
export function RestaurantSwitcher({locale, restaurants, activeId}: Props) {
  const t = useTranslations('dashboard');
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchRestaurantAction} className="min-w-0">
      <input type="hidden" name="locale" value={locale} />
      <select
        name="restaurantId"
        value={activeId}
        aria-label={t('switchRestaurant')}
        onChange={() => formRef.current?.requestSubmit()}
        className="max-w-56 truncate rounded-base border border-hairline bg-transparent px-2 py-1 text-sm font-semibold transition-colors"
      >
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.nameAr}
          </option>
        ))}
      </select>
    </form>
  );
}
