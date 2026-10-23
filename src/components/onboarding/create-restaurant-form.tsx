'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {
  createRestaurantAction,
  type CreateRestaurantState
} from '@/server/actions/create-restaurant';

/**
 * Onboarding form → server action. The action returns machine-readable error
 * codes; this component maps them to locale strings. Locale rides along in a
 * hidden field so the action's redirect stays locale-aware.
 */
export function CreateRestaurantForm({locale}: {locale: string}) {
  const t = useTranslations('onboarding');
  const [state, formAction, pending] = useActionState(createRestaurantAction, {});

  const error = state.error
    ? t(
        state.error === 'whatsapp'
          ? 'errors.whatsapp'
          : state.error === 'nameAr'
            ? 'errors.nameAr'
            : 'errors.generic'
      )
    : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('nameAr')}</span>
        <input
          type="text"
          name="nameAr"
          required
          autoComplete="off"
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('nameEn')}</span>
        <input
          type="text"
          name="nameEn"
          dir="ltr"
          autoComplete="off"
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('whatsapp')}</span>
        <input
          type="tel"
          name="whatsappNumber"
          required
          dir="ltr"
          inputMode="tel"
          autoComplete="off"
          placeholder={t('whatsappPlaceholder')}
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-base bg-foreground px-4 py-2.5 text-base font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('submit')}
      </button>
    </form>
  );
}
