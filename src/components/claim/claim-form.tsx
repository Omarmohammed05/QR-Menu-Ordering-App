'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {claimInviteAction, type ClaimState} from '@/server/actions/claim';

const INITIAL_STATE: ClaimState = {};

const inputClassName =
  'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-brand';

/**
 * Invite claim: code + the owner's details. One code creates exactly one
 * owner account, seated on the restaurant the code was issued for.
 */
export function ClaimForm({locale, initialCode}: {locale: string; initialCode: string}) {
  const t = useTranslations('claim');
  const [state, formAction, pending] = useActionState(claimInviteAction, INITIAL_STATE);
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('code')}</span>
        <input
          type="text"
          name="code"
          required
          dir="ltr"
          autoComplete="off"
          defaultValue={initialCode}
          placeholder={t('codePlaceholder')}
          className={`${inputClassName} font-mono tracking-widest`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('name')}</span>
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          className={inputClassName}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('email')}</span>
        <input
          type="email"
          name="email"
          required
          dir="ltr"
          autoComplete="email"
          className={inputClassName}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('password')}</span>
        <input
          type="password"
          name="password"
          required
          dir="ltr"
          autoComplete="new-password"
          placeholder={t('passwordHint')}
          className={inputClassName}
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
        className="mt-1 rounded-base bg-brand px-4 py-2.5 text-base font-medium text-white transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('submit')}
      </button>
    </form>
  );
}
