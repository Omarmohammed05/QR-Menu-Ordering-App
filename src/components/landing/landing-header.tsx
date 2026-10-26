import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {QrCodeIcon} from '@/components/icons';
import {LocaleToggle} from '@/components/landing/locale-toggle';

/** Sticky translucent bar floating over the page (material chrome, spec §14.1). */
export async function LandingHeader() {
  const t = await getTranslations('landing');

  return (
    <header className="material fixed inset-x-0 top-0 z-40 border-b border-hairline">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-base bg-foreground text-background">
            <QrCodeIcon className="size-[18px]" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{t('brand')}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            {t('nav.features')}
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            {t('nav.pricing')}
          </a>
          <Link href="/demo" className="transition-colors hover:text-foreground">
            {t('nav.demo')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Link
            href="/login"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </header>
  );
}
