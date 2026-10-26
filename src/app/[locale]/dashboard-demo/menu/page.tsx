import {getTranslations} from 'next-intl/server';
import {DEMO_MENU} from '@/components/dashboard-demo/demo-data';
import {DemoButton} from '@/components/dashboard-demo/demo-button';
import {formatNumber, formatPrice} from '@/lib/format';
import {MenuBookIcon, OrdersIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/** Demo of menu management — sections, dishes, option groups; editing is preview-only. */
export default async function DashboardDemoMenuPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'menuManagement'});
  const tMock = await getTranslations({locale, namespace: 'dashboardDemo'});

  const dishes = DEMO_MENU.flatMap(({items}) => items);
  const unavailableCount = dishes.filter((item) => !item.isAvailable).length;
  const stats = [
    {label: t('stats.sections'), value: formatNumber(DEMO_MENU.length, locale), icon: 'book'},
    {label: t('stats.dishes'), value: formatNumber(dishes.length, locale), icon: 'orders'},
    {label: t('stats.unavailable'), value: formatNumber(unavailableCount, locale), icon: 'dot'}
  ];

  const inputClasses =
    'min-w-0 flex-1 rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
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

      {/* New section */}
      <section className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5">
        <h2 className="text-base font-semibold">{t('addCategoryTitle')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" placeholder={t('categoryName')} className={inputClasses} />
          <DemoButton className="rounded-base bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
            {t('createCategory')}
          </DemoButton>
        </div>
      </section>

      {DEMO_MENU.map((category, index) => (
        <section
          key={category.id}
          style={{animationDelay: `${(index + 1) * 70}ms`}}
          className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {tMock(category.categoryKey)}
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold leading-none text-background">
                {formatNumber(category.items.length, locale)}
              </span>
            </h2>
            <DemoButton className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.98]">
              {t('edit')}
            </DemoButton>
          </div>
          <ul className="flex flex-col divide-y divide-hairline">
            {category.items.map((item) => (
              <li
                key={item.id}
                className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={`truncate font-medium ${
                      item.isAvailable ? '' : 'text-muted-foreground'
                    }`}
                  >
                    {tMock(item.dishKey)}
                  </span>
                  {item.descriptionKey ? (
                    <span className="truncate text-sm text-muted-foreground">
                      {tMock(item.descriptionKey)}
                    </span>
                  ) : null}
                  {item.optionGroups ? (
                    <span className="flex flex-wrap items-center gap-1">
                      {item.optionGroups.map((group) => (
                        <span
                          key={group.nameKey}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {tMock(group.nameKey)} · {formatNumber(group.choiceCount, locale)}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(item.pricePiastres, locale)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DemoButton className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
                      {t('edit')}
                    </DemoButton>
                    <DemoButton className="rounded-full border border-hairline px-3 py-1 text-[11px] font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.98]">
                      {item.isAvailable ? t('hide') : t('show')}
                    </DemoButton>
                    <DemoButton className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-muted">
                      {t('deleteItem')}
                    </DemoButton>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-hairline pt-4">
            <DemoButton className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
              {t('addItem')}
            </DemoButton>
          </div>
        </section>
      ))}
    </div>
  );
}
