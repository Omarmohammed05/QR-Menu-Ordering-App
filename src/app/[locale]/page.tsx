import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {toggleLocale} from '@/i18n/locale';

/**
 * Landing — the only non-tenant public page besides the menus themselves.
 * Arabic by default (unprefixed), English under `/en`. Links straight to the
 * demo restaurant menu and the login.
 */
export default function Page() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const nextLocale = toggleLocale(locale);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-hairline px-3 py-1 text-xs tracking-wide text-muted-foreground">
        {t('badge')}
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
      <p className="max-w-md text-balance text-base text-muted-foreground sm:text-lg">{t('tagline')}</p>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/demo"
          className="rounded-base border border-hairline px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          {t('demo')}
        </Link>
        <Link
          href="/dashboard-demo"
          className="rounded-base border border-hairline px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          {t('demoDashboard')}
        </Link>
        <Link
          href="/login"
          className="rounded-base bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
        >
          {t('login')}
        </Link>
      </div>
      <Link
        locale={nextLocale}
        href="/"
        className="text-sm underline underline-offset-4 hover:text-muted-foreground"
      >
        {t('switchLocale')}
      </Link>
    </main>
  );
}
