import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {toggleLocale} from '@/i18n/locale';

export default function Page() {
  const t = useTranslations('placeholder');
  const locale = useLocale();
  const nextLocale = toggleLocale(locale);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-hairline px-3 py-1 text-xs tracking-wide text-muted-foreground">
        {t('phase')}
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
      <p className="max-w-md text-base text-muted-foreground sm:text-lg">{t('tagline')}</p>
      <Link
        href="/login"
        className="mt-2 rounded-base bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
      >
        {t('login')}
      </Link>
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
