import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {durationsRepo} from '@/server/db/repos';
import {PricingGrid} from '@/components/landing/pricing-grid';

/**
 * Landing pricing section: the copy lives with the page, the interactive part
 * (plan cards + the billing-duration picker with discounts) is the client
 * grid — durations come from the owner-managed `subscription_durations`
 * table, so adding one on the admin page changes this section.
 */
export async function PricingPlans({locale}: {locale: string}) {
  const t = await getTranslations('landing');
  const durations = await durationsRepo.list();

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-hairline bg-surface-raised">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('pricing.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
            {t('pricing.subtitle')}
          </p>
        </div>
        <PricingGrid locale={locale} durations={durations} />
        <p className="text-center text-sm text-muted-foreground">
          {t('pricing.demoNote')}{' '}
          <Link href="/demo" className="font-medium text-accent underline underline-offset-4">
            {t('demo')}
          </Link>
        </p>
      </div>
    </section>
  );
}
