import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {AnalyticsView} from '@/components/dashboard/analytics-view';
import {limitsForPlan} from '@/lib/plans';
import {ChartIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/**
 * Menu analytics (Stitch "analytics" surface): the last two weeks of menu
 * views vs. orders in the restaurant's own calendar, plus best sellers from
 * real order lines. All series are cut in the tenant-root timezone.
 */
export default async function AnalyticsPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const t = await getTranslations('dashboard.analytics');

  // Plan gate (src/lib/plans.ts): analytics is a Pro feature.
  if (!limitsForPlan(membership.restaurant.plan).canUseAnalytics) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-hairline bg-surface p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <ChartIcon className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{t('planRequired.title')}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('planRequired.body')}
          </p>
        </div>
      </div>
    );
  }

  const repos = createRestaurantRepos(membership.restaurant.id);

  const [series, topDishes] = await Promise.all([
    repos.analytics.dailySeries(14, membership.restaurant.timezone),
    repos.analytics.topDishes(30, 5)
  ]);

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
