'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {
  addOpeningHourAction,
  deleteOpeningHourAction,
  type OpeningHoursState
} from '@/server/actions/hours';

const INITIAL_STATE: OpeningHoursState = {};

const inputClassName =
  'h-10 rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors focus:border-brand';

export type OpeningSlotView = {
  id: string;
  weekday: number;
  opensAt: string;
  closesAt: string;
};

/** `HH:MM[:SS]` (pg time) → `HH:MM`. */
function hhmm(time: string): string {
  return time.slice(0, 5);
}

/**
 * Opening hours: the weekly schedule the public menu's open/closed badge
 * evaluates, in the restaurant's own timezone. Add form on top (day + open
 * and close times), one row per weekday with its slots — empty days show
 * as closed, and a restaurant with no schedule at all is always open.
 */
export function OpeningHoursSection({locale, slots}: {locale: string; slots: OpeningSlotView[]}) {
  const t = useTranslations('dashboard.settings.hours');
  const [state, formAction, pending] = useActionState(addOpeningHourAction, INITIAL_STATE);
  const error = state.error ? t(`errors.${state.error}`) : null;

  const days = [0, 1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="mt-5 flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <div className="flex flex-wrap items-center gap-2">
          <select name="weekday" required aria-label={t('day')} className={`${inputClassName} pe-8`}>
            {days.map((day) => (
              <option key={day} value={day}>
                {t(`days.${day}`)}
              </option>
            ))}
          </select>
          <input
            type="time"
            name="opensAt"
            required
            dir="ltr"
            aria-label={t('opens')}
            className={inputClassName}
          />
          <span className="text-sm text-muted-foreground">–</span>
          <input
            type="time"
            name="closesAt"
            required
            dir="ltr"
            aria-label={t('closes')}
            className={inputClassName}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-10 shrink-0 rounded-full bg-brand px-5 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? t('working') : t('add')}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium">
            {error}
          </p>
        ) : null}
      </form>

      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {days.map((day) => {
          const daySlots = slots.filter((slot) => slot.weekday === day);
          return (
            <li key={day} className="flex items-center justify-between gap-2 py-3">
              <span className="text-sm font-medium">{t(`days.${day}`)}</span>
              {daySlots.length === 0 ? (
                <span className="text-xs text-muted-foreground">{t('closed')}</span>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {daySlots.map((slot) => (
                    <form key={slot.id} action={deleteOpeningHourAction} className="flex">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="slotId" value={slot.id} />
                      <button
                        type="submit"
                        title={t('delete')}
                        dir="ltr"
                        className="h-8 rounded-full border border-hairline px-3 text-xs font-medium tabular-nums transition-colors hover:border-brand"
                      >
                        {hhmm(slot.opensAt)}–{hhmm(slot.closesAt)} ×
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
