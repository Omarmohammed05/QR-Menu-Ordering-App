import {routing} from '@/i18n/routing';

/**
 * Public menu URLs. Arabic (the default locale) is unprefixed, English sits
 * under `/en`. Pure functions — the caller injects the absolute base so tests
 * need no environment.
 */

/** e.g. base `https://menu.example`, slug `bait-el-sham`, en → `/en/bait-el-sham`. */
export function publicMenuPath(
  slug: string,
  locale: (typeof routing.locales)[number] = routing.defaultLocale,
  tableToken?: string | null
): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const query = tableToken ? `?t=${encodeURIComponent(tableToken)}` : '';
  return `${prefix}/${slug}${query}`;
}

export function buildPublicMenuUrl(
  base: string,
  slug: string,
  locale: (typeof routing.locales)[number] = routing.defaultLocale,
  tableToken?: string | null
): string {
  return `${base.replace(/\/+$/, '')}${publicMenuPath(slug, locale, tableToken)}`;
}
