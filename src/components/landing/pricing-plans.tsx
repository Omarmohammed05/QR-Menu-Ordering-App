import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {CheckIcon} from '@/components/icons';
import {formatPrice} from '@/lib/format';

/** Plan shape: everything visible is i18n-driven; only numbers live here. */
type Plan = {piastres: number; featureCount: number; popular?: boolean};

const PLANS: Plan[] = [
  {piastres: 29900, featureCount: 4},
  {piastres: 59900, featureCount: 5, popular: true},
  {piastres: 119900, featureCount: 4}
];

export async function PricingPlans({locale}: {locale: string}) {
  const t = await getTranslations('landing');

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col gap-5 rounded-base border bg-surface p-6 ${
                plan.popular ? 'border-accent' : 'border-hairline'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white rtl:translate-x-1/2">
                  {t('pricing.popular')}
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">{t(`pricing.plans.${index}.name`)}</h3>
                <p className="text-xs text-muted-foreground">
                  {t(`pricing.plans.${index}.description`)}
                </p>
              </div>
              <p className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {formatPrice(plan.piastres, locale)}
                </span>
                <span className="text-xs text-muted-foreground">{t('pricing.perMonth')}</span>
              </p>
              <ul className="flex flex-1 flex-col gap-2.5">
                {Array.from({length: plan.featureCount}, (_, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 text-sm">
                    <CheckIcon
                      className={`mt-0.5 size-4 shrink-0 ${
                        plan.popular ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    />
                    {t(`pricing.plans.${index}.features.${featureIndex}`)}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`flex items-center justify-center rounded-base px-4 py-2.5 text-sm font-medium transition-[transform] duration-100 active:scale-[0.98] ${
                  plan.popular
                    ? 'bg-accent text-white'
                    : 'border border-hairline hover:bg-muted'
                }`}
              >
                {t('pricing.cta')}
              </Link>
            </div>
          ))}
        </div>
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
