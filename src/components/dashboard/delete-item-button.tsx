'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {deleteItemAction, type DeleteItemState} from '@/server/actions/menu';

type Props = {
  locale: string;
  itemId: string;
};

/**
 * Delete a dish. The server refuses when it ever appeared on an order —
 * order lines freeze its snapshot — and suggests hiding it instead.
 */
export function DeleteItemButton({locale, itemId}: Props) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState<DeleteItemState, FormData>(
    deleteItemAction,
    {}
  );
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-base border border-hairline px-3 py-1.5 text-xs font-medium text-muted-foreground transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('deleteItem')}
      </button>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
