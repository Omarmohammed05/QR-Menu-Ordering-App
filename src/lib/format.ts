/**
 * Locale-aware price display from integer piastres (money never floats in
 * this project — see AGENTS.md). Whole-EGP prices drop the fraction.
 */
export function formatPrice(piastres: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: piastres % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(piastres / 100);
}
