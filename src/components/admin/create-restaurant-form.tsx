'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {createRestaurantWithInviteAction, type AdminCreateState} from '@/server/actions/admin';
import {PlanPicker} from '@/components/admin/plan-picker';

const INITIAL_STATE: AdminCreateState = {};

const inputClassName =
  'h-10 min-w-0 flex-1 rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground';

/**
 * Platform-admin form: creates the restaurant and, in the same transaction,
 * issues its owner invite — the claim link + code appear on the new card.
 */
export function CreateRestaurantForm({locale}: {locale: string}) {
  const t = useTranslations('admin.create');
  const [state, formAction, pending] = useActionState(createRestaurantWithInviteAction, INITIAL_STATE);
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium">{t('nameAr')}</span>
          <input type="text" name="nameAr" required dir="rtl" autoComplete="off" placeholder={t('nameArPlaceholder')} className={inputClassName} />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium">{t('nameEn')}</span>
          <input type="text" name="nameEn" dir="ltr" autoComplete="off" placeholder={t('nameEnPlaceholder')} className={inputClassName} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('whatsapp')}</span>
        <div className="flex items-stretch gap-2">
          <input type="tel" name="whatsappNumber" required dir="ltr" autoComplete="off" placeholder="+201055550199" className={inputClassName} />
          <button
            type="submit"
            disabled={pending}
            className="h-10 shrink-0 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? t('working') : t('submit')}
          </button>
        </div>
      </label>
      <PlanPicker />
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
