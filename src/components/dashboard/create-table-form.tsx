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
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            name="label"
            required
            autoComplete="off"
            placeholder={t('labelPlaceholder')}
            className="h-10 min-w-0 flex-1 rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-10 shrink-0 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? t('working') : t('create')}
          </button>
        </div>
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
