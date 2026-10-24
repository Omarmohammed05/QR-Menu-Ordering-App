/**
 * Locale-aware price display from integer piastres (money never floats in
 * this project — see AGENTS.md). Whole-EGP prices drop the fraction.
 */
export function formatPrice(piastres: number, locale: string, currency: string = 'EGP'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: piastres % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(piastres / 100);
}

/** Locale-aware plain number (counts, durations) with Arabic-Indic digits. */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    maximumFractionDigits: 1
  }).format(value);
}

/** Locale-aware date-time for order timestamps (timestamptz from the DB). */
export function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}
