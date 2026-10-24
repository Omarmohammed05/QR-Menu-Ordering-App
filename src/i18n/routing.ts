import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // Arabic-first product: no Accept-Language negotiation, every visitor lands
  // on Arabic. `as-needed` keeps Arabic unprefixed (the default locale), so
  // public menu URLs read `/{slug}` in Arabic and `/en/{slug}` in English.
  localeDetection: false,
  localePrefix: 'as-needed'
});
