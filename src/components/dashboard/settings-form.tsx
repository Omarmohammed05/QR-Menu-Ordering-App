'use client';

import {useActionState, useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  setLogoAction,
  updateRestaurantAction,
  type UpdateRestaurantState
} from '@/server/actions/settings';
import {ImageUpload} from '@/components/dashboard/image-upload';

type Props = {
  locale: string;
  restaurant: {
    slug: string;
    nameAr: string;
    nameEn: string | null;
    whatsappNumber: string;
    instapayHandle: string | null;
    logoUrl: string | null;
  };
};

/** Live slug-availability answer from the dashboard API. */
type Availability = {available: boolean; suggestion: string | null};

/**
 * The settings profile form: restaurant names, the WhatsApp handoff number,
 * the public logo, and the editable public slug (live availability check —
 * clean `base-2`, `base-3` suggestions, never random hashes).
 */
export function SettingsForm({locale, restaurant}: Props) {
  const t = useTranslations('dashboard.settings.profile');
  const tSlug = useTranslations('dashboard.settings.slug');
  const tErrors = useTranslations('dashboard.settings.errors');
  const activeLocale = useLocale();
  const [state, formAction, pending] = useActionState<UpdateRestaurantState, FormData>(
    updateRestaurantAction,
    {}
  );
  const error = state.error ? tErrors(state.error) : null;

  const [slug, setSlug] = useState(restaurant.slug);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced live availability check while the owner types a new handle.
  useEffect(() => {
    const unchanged = slug === restaurant.slug;
    const timer = setTimeout(async () => {
      if (unchanged) {
        setAvailability(null);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setChecking(true);
      try {
        const response = await fetch(
          `/api/dashboard/slug-availability?locale=${activeLocale}&slug=${encodeURIComponent(slug)}`,
          {signal: controller.signal}
        );
        if (response.ok) setAvailability((await response.json()) as Availability);
      } catch {
        /* aborted or offline — the save action re-checks authoritatively */
      } finally {
        setChecking(false);
      }
    }, unchanged ? 0 : 350);
    return () => clearTimeout(timer);
  }, [slug, restaurant.slug, activeLocale]);

  const slugDirty = slug !== restaurant.slug;
  const slugBlocked = availability !== null && !availability.available;

  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand';

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <ImageUpload name="logoUrl" value={restaurant.logoUrl} rounded="full" persist={setLogoAction} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('nameAr')}</span>
        <input
          type="text"
          name="nameAr"
          defaultValue={restaurant.nameAr}
          required
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('nameEn')}</span>
        <input
          type="text"
          name="nameEn"
          dir="ltr"
          defaultValue={restaurant.nameEn ?? ''}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('whatsapp')}</span>
        <input
          type="tel"
          name="whatsappNumber"
          dir="ltr"
          defaultValue={restaurant.whatsappNumber}
          required
          autoComplete="off"
          placeholder="+201234567890"
          className={inputClass}
        />
        <span className="text-xs text-muted-foreground">{t('whatsappHint')}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('instapay')}</span>
        <input
          type="text"
          name="instapayHandle"
          dir="ltr"
          defaultValue={restaurant.instapayHandle ?? ''}
          autoComplete="off"
          spellCheck={false}
          placeholder="name@instapay"
          className={inputClass}
        />
        <span className="text-xs text-muted-foreground">{t('instapayHint')}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{tSlug('label')}</span>
        <input
          type="text"
          name="slug"
          dir="ltr"
          value={slug}
          onChange={(event) => setSlug(event.target.value.trim().toLowerCase())}
          required
          autoComplete="off"
          spellCheck={false}
          className={`${inputClass} font-mono ${
            slugBlocked ? 'border-destructive' : slugDirty ? 'border-brand' : ''
          }`}
        />
        {slugDirty && checking ? (
          <span className="text-xs text-muted-foreground">{tSlug('checking')}</span>
        ) : null}
        {slugDirty && availability?.available ? (
          <span className="animate-pop-in text-xs font-medium">{tSlug('available')}</span>
        ) : null}
        {slugBlocked ? (
          <span role="alert" className="text-xs font-medium">
            {availability?.suggestion
              ? tSlug('takenWithSuggestion', {suggestion: availability.suggestion})
              : tSlug('taken')}
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">{tSlug('hint')}</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || (slugDirty && (checking || slugBlocked))}
          className="self-start rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? t('working') : t('save')}
        </button>
        {state.saved && !error ? (
          <span className="animate-pop-in text-sm font-medium text-muted-foreground">
            {t('saved')}
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
