'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {updateCategoryAction, type UpdateCategoryState} from '@/server/actions/menu';
import {ImageUpload} from '@/components/dashboard/image-upload';

type Props = {
  locale: string;
  category: {id: string; nameAr: string; imageUrl: string | null};
};

/** Rename an existing menu section / change its photo. Uncontrolled inputs seeded with current values. */
export function EditCategoryForm({locale, category}: Props) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState<UpdateCategoryState, FormData>(
    updateCategoryAction,
    {}
  );
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="categoryId" value={category.id} />
      <ImageUpload name="imageUrl" value={category.imageUrl} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('categoryName')}</span>
        <input
          type="text"
          name="nameAr"
          defaultValue={category.nameAr}
          required
          autoComplete="off"
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
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
        className="self-start rounded-base bg-foreground px-4 py-2 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('save')}
      </button>
    </form>
  );
}
