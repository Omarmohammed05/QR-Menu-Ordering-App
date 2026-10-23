import type {Metadata} from 'next';
import {Geist, Geist_Mono, IBM_Plex_Sans_Arabic} from 'next/font/google';
import {hasLocale} from 'next-intl';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {directionFor} from '@/i18n/locale';
import {routing} from '@/i18n/routing';
import {Base44PreviewHmrShim} from '@/components/base44-preview-hmr-shim';
import '@/styles/globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap'
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-plex-arabic',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Menu'
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      className={`${geistSans.variable} ${geistMono.variable} ${plexArabic.variable}`}
    >
      <body>
        <Base44PreviewHmrShim />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
