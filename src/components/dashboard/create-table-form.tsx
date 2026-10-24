'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {createTableAction} from '@/server/actions/tables';

/** One QR'd table label ("طاولة ٣") in one field. */
export function CreateTableForm({locale}: {locale: string}) {
  const t = useTranslations('dashboard.tables');
  const [state, formAction, pending] = useActionState(createTableAction, {});
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('label')}</span>
        <input
          type="text"
          name="label"
          required
          autoComplete="off"
          placeholder={t('labelPlaceholder')}
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
        className="self-start rounded-base bg-foreground px-4 py-2 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('create')}
      </button>
    </form>
  );
}
