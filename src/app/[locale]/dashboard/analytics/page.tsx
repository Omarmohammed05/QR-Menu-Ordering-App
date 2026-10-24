import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {AnalyticsView} from '@/components/dashboard/analytics-view';

type Props = {params: Promise<{locale: string}>};

/**
 * Menu analytics (Stitch "analytics" surface): the last two weeks of menu
 * views vs. orders in the restaurant's own calendar, plus best sellers from
 * real order lines. All series are cut in the tenant-root timezone.
 */
export default async function AnalyticsPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const repos = createRestaurantRepos(membership.restaurant.id);

  const [series, topDishes] = await Promise.all([
    repos.analytics.dailySeries(14, membership.restaurant.timezone),
    repos.analytics.topDishes(30, 5)
  ]);

  const t = await getTranslations('dashboard.analytics');
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>
      <AnalyticsView
        series={series}
        topDishes={topDishes}
        currency={membership.restaurant.currency}
      />
    </div>
  );
}
