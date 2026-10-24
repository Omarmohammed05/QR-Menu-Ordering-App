'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {updateRestaurantAction, type UpdateRestaurantState} from '@/server/actions/settings';

type Props = {
  locale: string;
  restaurant: {nameAr: string; nameEn: string | null; whatsappNumber: string};
};

/**
 * The settings profile form: restaurant names and the WhatsApp handoff
 * number. Uncontrolled inputs seeded with the stored values.
 */
export function SettingsForm({locale, restaurant}: Props) {
  const t = useTranslations('dashboard.settings.profile');
  const tErrors = useTranslations('dashboard.settings.errors');
  const [state, formAction, pending] = useActionState<UpdateRestaurantState, FormData>(
    updateRestaurantAction,
    {}
  );
  const error = state.error ? tErrors(state.error) : null;

  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground';

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('nameAr')}</span>
        <input
          type="text"
          name="nameAr"
          defaultValue={restaurant.nameAr}
          required
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('nameEn')}</span>
        <input
          type="text"
          name="nameEn"
          dir="ltr"
          defaultValue={restaurant.nameEn ?? ''}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('whatsapp')}</span>
        <input
          type="tel"
          name="whatsappNumber"
          dir="ltr"
          defaultValue={restaurant.whatsappNumber}
          required
          autoComplete="off"
          placeholder="+201234567890"
          className={inputClass}
        />
        <span className="text-xs text-muted-foreground">{t('whatsappHint')}</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? t('working') : t('save')}
        </button>
        {state.saved && !error ? (
          <span className="animate-pop-in text-sm font-medium text-muted-foreground">
            {t('saved')}
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
