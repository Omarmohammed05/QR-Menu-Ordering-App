import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {LandingHeader} from '@/components/landing/landing-header';
import {Hero} from '@/components/landing/hero';
import {FeatureGrid} from '@/components/landing/feature-grid';
import {HowItWorks} from '@/components/landing/how-it-works';
import {PricingPlans} from '@/components/landing/pricing-plans';
import {LandingFooter} from '@/components/landing/landing-footer';

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'landing'});
  return {
    title: t('meta.title'),
    description: t('meta.description')
  };
}

/**
 * Marketing landing — the only non-tenant public page besides the menus.
 * Arabic by default (unprefixed), English under `/en`. Every section is a
 * server component; only the locale toggle ships client JS.
 */
export default async function LandingPage({params}: Props) {
  const {locale} = await params;

  return (
    <>
      <LandingHeader />
      <main>
        <Hero locale={locale} />
        <FeatureGrid />
        <HowItWorks />
        <PricingPlans locale={locale} />
        <LandingFooter />
      </main>
    </>
  );
}
