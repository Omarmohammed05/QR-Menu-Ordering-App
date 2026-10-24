'use client';

import {useActionState, useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {
  createOptionAction,
  deleteOptionAction,
  type CreateOptionState,
  type DeleteOptionState
} from '@/server/actions/menu';
import {formatPrice} from '@/lib/format';

type OptionRow = {id: string; nameAr: string; priceDeltaPiastres: number};

type Props = {
  locale: string;
  currency: string;
  itemId: string;
  options: OptionRow[];
};

/**
 * Dish options management (dashboard): the dish's current extras with a
 * delete button each, plus a one-line add form. Everything goes through the
 * tenant-scoped server actions — a foreign dish id is rejected server-side.
 */
export function ItemOptionsSection({locale, currency, itemId, options}: Props) {
  const t = useTranslations('menuManagement');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{t('options')}</h3>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('noOptions')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {options.map((option) => (
            <li
              key={option.id}
              className="flex items-center justify-between gap-3 rounded-base border border-hairline px-3.5 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{option.nameAr}</span>
                {option.priceDeltaPiastres > 0 ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    +{formatPrice(option.priceDeltaPiastres, locale, currency)}
                  </span>
                ) : null}
              </span>
              <DeleteOptionButton optionId={option.id} />
            </li>
          ))}
        </ul>
      )}
      <AddOptionForm locale={locale} itemId={itemId} />
    </div>
  );
}

function AddOptionForm({locale, itemId}: {locale: string; itemId: string}) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState<CreateOptionState, FormData>(
    createOptionAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand';

  // Clear the add form once the option landed (the list re-rendered above).
  useEffect(() => {
    if (Object.keys(state).length === 0) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="itemId" value={itemId} />
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t('optionName')}</span>
          <input
            type="text"
            name="nameAr"
            required
            autoComplete="off"
            placeholder={t('optionName')}
            className={`${inputClass} w-full`}
          />
        </label>
        <label className="w-28 shrink-0">
          <span className="sr-only">{t('optionPrice')}</span>
          <input
            type="text"
            name="price"
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            placeholder={t('optionPricePlaceholder')}
            className={`${inputClass} w-full`}
          />
        </label>
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-medium">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('addOption')}
      </button>
    </form>
  );
}

function DeleteOptionButton({optionId}: {optionId: string}) {
  const t = useTranslations('menuManagement');
  const [state, formAction, pending] = useActionState<DeleteOptionState, FormData>(
    deleteOptionAction,
    {}
  );

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="optionId" value={optionId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-hairline px-3 py-1 text-[11px] font-medium text-muted-foreground transition-[transform,border-color] duration-100 hover:border-destructive hover:text-destructive active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('deleteOption')}
      </button>
      {state.error ? (
        <p role="alert" className="text-xs font-medium">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}
