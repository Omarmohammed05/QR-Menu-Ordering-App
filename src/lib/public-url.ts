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

/** Customer order-status URL, same prefix rules as the menu (`/{slug}/order/{publicId}`). */
export function orderStatusPath(
  slug: string,
  publicId: string,
  locale: (typeof routing.locales)[number] = routing.defaultLocale
): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${prefix}/${slug}/order/${publicId}`;
}

export function buildOrderStatusUrl(
  base: string,
  slug: string,
  publicId: string,
  locale: (typeof routing.locales)[number] = routing.defaultLocale
): string {
  return `${base.replace(/\/+$/, '')}${orderStatusPath(slug, publicId, locale)}`;
}
