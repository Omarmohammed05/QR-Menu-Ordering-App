'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {createRestaurantWithInviteAction, type AdminCreateState} from '@/server/actions/admin';

const INITIAL_STATE: AdminCreateState = {};

const inputClassName =
  'h-[46px] min-w-0 flex-1 rounded-full border border-warm-hairline bg-warm-input px-5 text-sm text-warm-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#c2a99b] focus:border-[#ff7043] focus:shadow-[0_0_0_4px_rgba(255,112,67,0.14)]';

/**
 * Platform-admin form: creates the restaurant and, in the same transaction,
 * issues its owner invite — the claim link + code appear on the new card.
 */
export function CreateRestaurantForm({locale}: {locale: string}) {
  const t = useTranslations('admin.create');
  const [state, formAction, pending] = useActionState(createRestaurantWithInviteAction, INITIAL_STATE);
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium">{t('nameAr')}</span>
          <input type="text" name="nameAr" required dir="rtl" autoComplete="off" placeholder={t('nameArPlaceholder')} className={inputClassName} />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium">{t('nameEn')}</span>
          <input type="text" name="nameEn" dir="ltr" autoComplete="off" placeholder={t('nameEnPlaceholder')} className={inputClassName} />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('whatsapp')}</span>
        <div className="flex gap-2.5">
          <input type="tel" name="whatsappNumber" required dir="ltr" autoComplete="off" placeholder="+201055550199" className={inputClassName} />
          <button
            type="submit"
            disabled={pending}
            className="sunrise-gradient flex h-[46px] shrink-0 items-center gap-2 rounded-full px-[30px] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(230,74,25,0.3)] transition-[box-shadow,filter] duration-150 hover:brightness-[1.07] hover:shadow-[0_10px_24px_rgba(230,74,25,0.4)] active:brightness-[0.95] disabled:opacity-50"
          >
            {pending ? t('working') : t('submit')}
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
