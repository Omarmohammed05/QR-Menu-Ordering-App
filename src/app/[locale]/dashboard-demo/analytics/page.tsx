import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {AnalyticsView} from '@/components/dashboard/analytics-view';

export const dynamic = 'force-dynamic';

/** Demo of the analytics surface — pure read, same component as the app. */
export default async function DemoAnalyticsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('dashboard.analytics');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const repos = createRestaurantRepos(restaurant.id);

  const [series, topDishes] = await Promise.all([
    repos.analytics.dailySeries(14, restaurant.timezone),
    repos.analytics.topDishes(30, 5)
  ]);

  return (
    <>
      <DemoHeader title={t('title')} tagline={t('tagline')} />
      <AnalyticsView series={series} topDishes={topDishes} currency={restaurant.currency} />
    </>
  );
}
