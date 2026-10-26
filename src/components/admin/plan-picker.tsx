'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {CheckIcon} from '@/components/icons';
import {PLAN_IDS, type PlanId} from '@/lib/plans';

/** Three feature lines per plan card, ordered to match the i18n keys. */
const FEATURE_COUNT = 3;

/**
 * Plan choice inside the admin create-restaurant form: three cards, one
 * radio group, `pro` preselected (the default in the action and the DB).
 */
export function PlanPicker() {
  const t = useTranslations('admin.plans');
  const [plan, setPlan] = useState<PlanId>('pro');

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t('label')}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PLAN_IDS.map((id) => {
          const selected = plan === id;
          return (
            <label
              key={id}
              className={`flex cursor-pointer flex-col gap-2 rounded-base border p-3 transition-colors ${
                selected ? 'border-accent bg-accent/5' : 'border-hairline hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={id}
                checked={selected}
                onChange={() => setPlan(id)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{t(`items.${id}.name`)}</span>
                <span
                  className={`grid size-5 place-items-center rounded-full border ${
                    selected ? 'border-accent bg-accent text-white' : 'border-hairline'
                  }`}
                >
                  {selected ? <CheckIcon className="size-3" /> : null}
                </span>
              </span>
              <ul className="flex flex-col gap-1">
                {Array.from({length: FEATURE_COUNT}, (_, index) => (
                  <li key={index} className="text-xs leading-relaxed text-muted-foreground">
                    {t(`items.${id}.features.${index}`)}
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
