'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {deleteCategoryAction, type DeleteCategoryState} from '@/server/actions/menu';

type Props = {
  locale: string;
  categoryId: string;
};

/**
 * Delete a menu section. The server refuses while it still holds dishes
 * (the FK cascade would silently drop them) — the error renders here.
 */
export function DeleteCategoryButton({locale, categoryId}: Props) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState<DeleteCategoryState, FormData>(
    deleteCategoryAction,
    {}
  );
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-base border border-hairline px-3 py-1.5 text-xs font-medium text-muted-foreground transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('deleteCategory')}
      </button>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
