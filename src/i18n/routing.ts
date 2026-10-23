import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // Arabic-first product: no Accept-Language negotiation, every visitor lands on /ar.
  localeDetection: false
});
