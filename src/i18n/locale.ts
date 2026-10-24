/** Text direction for a supported locale (ar is RTL-first). */
export function directionFor(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** The locale to switch to when the user toggles languages. */
export function toggleLocale(locale: string): 'ar' | 'en' {
  return locale === 'ar' ? 'en' : 'ar';
}
