import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {formatNumber, formatPrice} from '@/lib/format';
import {localizedName, localizedDescription} from '@/lib/localize';
import {MenuBookIcon, OrdersIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/**
 * Served per request: the page reads the demo tenant from the DB, so a
 * build-time prerender would need a database connection in CI.
 */
export const dynamic = 'force-dynamic';

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Public read-only demo of the dashboard's menu-management view — the same
 * layout and data (the seeded `demo` restaurant) with every mutating control
 * removed. Built for the portfolio: no session, nothing editable.
 */
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboardDemo'});
  return {title: t('title')};
}

export default async function DashboardDemoPage({params}: Props) {
  const {locale} = await params;
  const currentLocale = isLocale(locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({locale: currentLocale, namespace: 'dashboardDemo'});

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
    {label: t('stats.sections'), value: formatNumber(categories.length, currentLocale), icon: 'book'},
    {label: t('stats.dishes'), value: formatNumber(items.length, currentLocale), icon: 'orders'},
    {label: t('stats.unavailable'), value: formatNumber(unavailableCount, currentLocale), icon: 'dot'}
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1.5">
        <span className="w-fit rounded-full border border-hairline bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {t('badge')}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('title')} — {localizedName(currentLocale, restaurant)}
        </h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </header>

      {/* Operational overview */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({label, value, icon}, index) => (
          <div
            key={label}
            style={{animationDelay: `${index * 60}ms`}}
            className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between rounded-xl border border-hairline bg-surface p-4"
          >
            <span className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-semibold tracking-tight">{value}</span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
              {icon === 'book' ? (
                <MenuBookIcon className="size-4" />
              ) : icon === 'orders' ? (
                <OrdersIcon className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-foreground" />
              )}
            </span>
          </div>
        ))}
      </div>

      {categories.length === 0 ? (
        <p className="animate-fade-in rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        categories.map((category, index) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          return (
            <section
              key={category.id}
              style={{animationDelay: `${(index + 1) * 70}ms`}}
              className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {localizedName(currentLocale, category)}
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold leading-none text-background">
                  {formatNumber(categoryItems.length, currentLocale)}
                </span>
              </h2>
              {categoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('emptyItems')}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-hairline">
                  {categoryItems.map((item) => (
                    <li
                      key={item.id}
                      className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5"
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className={`truncate font-medium ${
                            item.isAvailable ? '' : 'text-muted-foreground'
                          }`}
                        >
                          {localizedName(currentLocale, item)}
                        </span>
                        {localizedDescription(currentLocale, item) ? (
                          <span className="truncate text-sm text-muted-foreground">
                            {localizedDescription(currentLocale, item)}
                          </span>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-medium tabular-nums">
                          {formatPrice(item.pricePiastres, currentLocale, restaurant.currency)}
                        </span>
                        {!item.isAvailable ? (
                          <span className="rounded-full border border-hairline px-3 py-1 text-[11px] font-medium text-muted-foreground">
                            {t('hidden')}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      <p className="text-center text-xs text-muted-foreground">{t('readOnlyNote')}</p>
    </main>
  );
}
