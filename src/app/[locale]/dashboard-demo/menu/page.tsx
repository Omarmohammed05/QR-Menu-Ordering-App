import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {formatNumber, formatPrice} from '@/lib/format';
import {localizedName, localizedDescription} from '@/lib/localize';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {DemoStats} from '@/components/dashboard-demo/demo-stats';
import {DemoCard} from '@/components/dashboard-demo/demo-card';
import {MenuBookIcon, OrdersIcon} from '@/components/icons';

export const dynamic = 'force-dynamic';

/** Demo of menu management — the sections and dishes, nothing editable. */
export default async function DemoMenuPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('menuManagement');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const repos = createRestaurantRepos(restaurant.id);
  const [categories, items] = await Promise.all([repos.categories.list(), repos.items.list()]);

  const itemsByCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  }

  const unavailableCount = items.filter((item) => !item.isAvailable).length;
  const stats = [
    {label: t('stats.sections'), value: formatNumber(categories.length, locale), icon: <MenuBookIcon className="size-[18px]" />},
    {label: t('stats.dishes'), value: formatNumber(items.length, locale), icon: <OrdersIcon className="size-[18px]" />},
    {label: t('stats.unavailable'), value: formatNumber(unavailableCount, locale), icon: <span className="size-2 rounded-full bg-brand" />}
  ];

  return (
    <>
      <DemoHeader title={t('title')} tagline={t('tagline')} />
      <DemoStats stats={stats} />

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-warm-hairline bg-surface px-4 py-8 text-center text-sm text-warm-muted shadow-warm">
          {t('emptyCategories')}
        </p>
      ) : (
        categories.map((category, index) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          return (
            <DemoCard key={category.id} delay={240 + index * 70}>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {localizedName(locale, category)}
                <span className="sunrise-gradient rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                  {formatNumber(categoryItems.length, locale)}
                </span>
              </h2>
              {categoryItems.length === 0 ? (
                <p className="mt-3 text-sm text-warm-muted">{t('emptyItems')}</p>
              ) : (
                <ul className="mt-3 flex flex-col divide-y divide-warm-hairline">
                  {categoryItems.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className={`truncate font-medium ${
                            item.isAvailable ? '' : 'text-warm-muted'
                          }`}
                        >
                          {localizedName(locale, item)}
                        </span>
                        {localizedDescription(locale, item) ? (
                          <span className="truncate text-sm text-warm-muted">
                            {localizedDescription(locale, item)}
                          </span>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-medium tabular-nums">
                          {formatPrice(item.pricePiastres, locale, restaurant.currency)}
                        </span>
                        {!item.isAvailable ? (
                          <span className="rounded-full bg-warm-pill px-3 py-1 text-[11px] font-medium text-warm-muted">
                            {t('hide')}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DemoCard>
          );
        })
      )}
    </>
  );
}
