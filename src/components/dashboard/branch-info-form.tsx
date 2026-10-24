'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {BRANCH_CURRENCIES, BRANCH_TIMEZONES} from '@/lib/branch-options';
import {updateBranchInfoAction, type UpdateBranchInfoState} from '@/server/actions/settings';

const INITIAL_STATE: UpdateBranchInfoState = {};

const selectClassName =
  'h-10 w-full rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors focus:border-brand';

/**
 * Branch preferences: the timezone every opening-hours check runs in, and
 * the currency every price renders with. Small form, immediate effect on the
 * public menu and the dashboard.
 */
export function BranchInfoForm({
  locale,
  timezone,
  currency
}: {
  locale: string;
  timezone: string;
  currency: string;
}) {
  const t = useTranslations('dashboard.settings.branch');
  const [state, formAction, pending] = useActionState(updateBranchInfoAction, INITIAL_STATE);
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('timezone')}</span>
          <select name="timezone" defaultValue={timezone} dir="ltr" className={selectClassName}>
            {BRANCH_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('currency')}</span>
          <select name="currency" defaultValue={currency} dir="ltr" className={selectClassName}>
            {BRANCH_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-brand px-5 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? t('working') : t('save')}
        </button>
        {state.saved && !pending ? (
          <span className="text-sm font-medium text-muted-foreground">{t('saved')}</span>
        ) : null}
      </div>
    </form>
  );
}
