'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {createItemAction, type CreateItemState} from '@/server/actions/menu';

/** New dish in one section. Price is typed in EGP and stored as piastres. */
export function AddItemForm({locale, categoryId}: {locale: string; categoryId: string}) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState(createItemAction, {});
  const error = state.error ? t(`errors.${state.error}`) : null;

  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground';

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-3" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('itemName')}</span>
        <input type="text" name="nameAr" required autoComplete="off" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('itemDescription')}</span>
        <input type="text" name="descriptionAr" autoComplete="off" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('price')}</span>
        <input
          type="text"
          name="price"
          required
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('pricePlaceholder')}
          className={inputClass}
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
        className="self-start rounded-base border border-hairline px-4 py-2 text-sm font-medium transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('addItem')}
      </button>
    </form>
  );
}
