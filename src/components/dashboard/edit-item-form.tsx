'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {updateItemAction, type UpdateItemState} from '@/server/actions/menu';
import {MultiImageUpload} from '@/components/dashboard/multi-image-upload';

type Props = {
  locale: string;
  item: {
    id: string;
    nameAr: string;
    descriptionAr: string | null;
    pricePiastres: number;
    imageUrl: string | null;
    imageUrls: string[] | null;
  };
};

/** EGP text for the price input, seeded from stored piastres (8500 → "85"). */
export function priceText(piastres: number): string {
  return piastres % 100 === 0 ? String(piastres / 100) : (piastres / 100).toFixed(2);
}

/** Edit a dish: name, description, price. Uncontrolled inputs seeded with current values. */
export function EditItemForm({locale, item}: Props) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState<UpdateItemState, FormData>(
    updateItemAction,
    {}
  );
  const error = state.error ? t(`errors.${state.error}`) : null;
  // Rows written before the gallery column exist only as a cover — seed it.
  const images =
    item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls
      : item.imageUrl
        ? [item.imageUrl]
        : [];

  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand';

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="itemId" value={item.id} />
      <MultiImageUpload name="imageUrls" values={images} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('itemName')}</span>
        <input
          type="text"
          name="nameAr"
          defaultValue={item.nameAr}
          required
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('itemDescription')}</span>
        <textarea
          name="descriptionAr"
          rows={4}
          defaultValue={item.descriptionAr ?? ''}
          autoComplete="off"
          className={`${inputClass} min-h-24 resize-y`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('price')}</span>
        <input
          type="text"
          name="price"
          defaultValue={priceText(item.pricePiastres)}
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
        className="self-start rounded-base bg-brand px-4 py-2 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('save')}
      </button>
    </form>
  );
}
