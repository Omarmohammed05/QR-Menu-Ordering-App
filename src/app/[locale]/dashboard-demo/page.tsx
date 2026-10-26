import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {DemoDashboard} from '@/components/dashboard-demo/demo-dashboard';

type Props = {params: Promise<{locale: string}>};

/**
 * Read-only dashboard showcase (`/dashboard-demo`): prospects preview the
 * owner dashboard before subscribing. No session, no tenant, no writes —
 * everything renders from static data inside the component.
 */
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboardDemo'});
  return {title: t('meta.title')};
}

export default async function DashboardDemoPage({params}: Props) {
  const {locale} = await params;
  return <DemoDashboard locale={locale} />;
}
