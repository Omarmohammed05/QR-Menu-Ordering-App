import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {ChartIcon, QrCodeIcon, WhatsAppIcon} from '@/components/icons';
import {formatPrice} from '@/lib/format';

/** Static showcase dish rows (marketing mock — no data, no tenant). */
const MOCK_DISHES = [
  {nameKey: 'hero.mock.dish1', piastres: 7500},
  {nameKey: 'hero.mock.dish2', piastres: 22000},
  {nameKey: 'hero.mock.dish3', piastres: 4500}
] as const;

export async function Hero({locale}: {locale: string}) {
  const t = await getTranslations('landing');

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-28 sm:px-6 md:pt-36 lg:flex-row lg:items-center lg:gap-16">
      <div className="flex flex-1 flex-col items-start gap-5">
        <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs tracking-wide text-muted-foreground">
          {t('badge')}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          {t('title')}
        </h1>
        <p className="max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('tagline')}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/demo"
            className="flex items-center justify-center gap-2 rounded-base bg-accent px-6 py-3 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98]"
          >
            <QrCodeIcon className="size-4" />
            {t('hero.primaryCta')}
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center rounded-base border border-hairline px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t('hero.secondaryCta')}
          </Link>
          <Link
            href="/dashboard-demo"
            className="flex items-center justify-center gap-2 rounded-base border border-accent px-6 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <ChartIcon className="size-4" />
            {t('hero.dashboardCta')}
          </Link>
        </div>
      </div>

      {/* Phone-style menu mock — pure decoration, hairline style */}
      <div className="w-full max-w-sm self-center lg:max-w-md">
        <div className="rounded-3xl border border-hairline bg-surface-raised p-4 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.25)]">
          <div className="rounded-2xl border border-hairline bg-surface">
            <div className="flex flex-col gap-1 border-b border-hairline p-4 text-center">
              <span className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold">
                <WhatsAppIcon className="size-4 text-accent" />
                {t('hero.mock.restaurant')}
              </span>
              <span className="text-xs text-muted-foreground">{t('hero.mock.category')}</span>
            </div>
            <ul className="divide-y divide-hairline">
              {MOCK_DISHES.map((dish) => (
                <li key={dish.nameKey} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm">{t(dish.nameKey)}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(dish.piastres, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="p-3">
              <span className="flex items-center justify-center gap-2 rounded-base bg-foreground px-4 py-2.5 text-xs font-medium text-background">
                <WhatsAppIcon className="size-4" />
                {t('hero.mock.orderOnWhatsApp')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
