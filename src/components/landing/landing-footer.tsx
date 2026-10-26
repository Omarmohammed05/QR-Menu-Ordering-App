import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {QrCodeIcon, WhatsAppIcon} from '@/components/icons';

export async function LandingFooter() {
  const t = await getTranslations('landing');
  const year = new Date().getFullYear();

  return (
    <>
      {/* Final conversion band */}
      <section className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('cta.title')}
          </h2>
          <p className="max-w-md text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('cta.body')}
          </p>
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-4" />
            {t('cta.button')}
          </Link>
        </div>
      </section>

      <footer className="border-t border-hairline bg-surface-raised">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-base bg-foreground text-background">
              <QrCodeIcon className="size-3.5" />
            </span>
            <span className="text-xs font-medium">{t('brand')}</span>
          </span>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/demo" className="transition-colors hover:text-foreground">
              {t('nav.demo')}
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground">
              {t('login')}
            </Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">
              {t('hero.secondaryCta')}
            </Link>
          </nav>
          <span className="text-xs text-muted-foreground">{t('footer.rights', {year})}</span>
        </div>
      </footer>
    </>
  );
}
