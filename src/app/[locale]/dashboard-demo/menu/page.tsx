import {getTranslations} from 'next-intl/server';
import {DEMO_MENU, type DemoOptionGroup} from '@/components/dashboard-demo/demo-data';
import {DemoButton} from '@/components/dashboard-demo/demo-button';
import {DemoImagePicker} from '@/components/dashboard-demo/demo-image-picker';
import {OptionsEditor} from '@/components/dashboard/options-editor';
import type {PublicOptionGroup} from '@/lib/options';
import {formatNumber, formatPrice} from '@/lib/format';
import {MenuBookIcon, OrdersIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/** Piastres → EGP input text ("1500" → "15"), like the real edit form's seed. */
function egpText(piastres: number): string {
  return piastres % 100 === 0 ? String(piastres / 100) : (piastres / 100).toFixed(2);
}

/**
 * Demo of menu management — the full real surface: expandable section and
 * dish edit forms, including the sizes & add-ons (variants) editor seeded
 * with bilingual showcase groups. Every mutation gesture is preview-only.
 */
export default async function DashboardDemoMenuPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'menuManagement'});
  const tMock = await getTranslations({locale, namespace: 'dashboardDemo'});
  // The variants editor edits Arabic and English names side by side, so each
  // mock name is resolved in BOTH locales — not just the active one.
  const tMockAr = await getTranslations({locale: 'ar', namespace: 'dashboardDemo'});
  const tMockEn = await getTranslations({locale: 'en', namespace: 'dashboardDemo'});

  /** Showcase group → the `PublicOptionGroup` shape `OptionsEditor` takes. */
  const toPublicGroup = (
    group: DemoOptionGroup,
    itemId: string,
    groupIndex: number
  ): PublicOptionGroup => ({
    id: `${itemId}-g${groupIndex}`,
    nameAr: tMockAr(group.nameKey),
    nameEn: tMockEn(group.nameKey),
    kind: group.kind,
    isRequired: group.isRequired,
    choices: group.choices.map((choice, choiceIndex) => ({
      id: `${itemId}-g${groupIndex}-c${choiceIndex}`,
      nameAr: tMockAr(choice.nameKey),
      nameEn: tMockEn(choice.nameKey),
      priceDeltaPiastres: choice.priceDeltaPiastres
    }))
  });

  const dishes = DEMO_MENU.flatMap(({items}) => items);
  const unavailableCount = dishes.filter((item) => !item.isAvailable).length;
  const stats = [
    {label: t('stats.sections'), value: formatNumber(DEMO_MENU.length, locale), icon: 'book'},
    {label: t('stats.dishes'), value: formatNumber(dishes.length, locale), icon: 'orders'},
    {label: t('stats.unavailable'), value: formatNumber(unavailableCount, locale), icon: 'dot'}
  ];

  const inputClasses =
    'min-w-0 flex-1 rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground';
  const labelClasses = 'flex flex-col gap-1.5';
  const labelSpan = 'text-sm font-medium';

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
          {/* Section header → expandable edit form, like the real page */}
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {tMock(category.categoryKey)}
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold leading-none text-background">
                  {formatNumber(category.items.length, locale)}
                </span>
              </h2>
              <span className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.98]">
                {t('edit')}
              </span>
            </summary>
            <div className="mt-4 flex flex-col gap-4 rounded-base border border-hairline p-4">
              <DemoImagePicker />
              <label className={labelClasses}>
                <span className={labelSpan}>{t('categoryName')}</span>
                <input
                  type="text"
                  defaultValue={tMock(category.categoryKey)}
                  className={inputClasses}
                />
              </label>
              <DemoButton className="self-start rounded-base bg-foreground px-4 py-2 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
                {t('save')}
              </DemoButton>
              <div className="border-t border-hairline pt-4">
                <DemoButton className="rounded-base border border-hairline px-3.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-muted">
                  {t('deleteCategory')}
                </DemoButton>
              </div>
            </div>
          </details>
          <ul className="flex flex-col divide-y divide-hairline">
            {category.items.map((item) => (
              <li
                key={item.id}
                className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
              >
                <details className="min-w-0 flex-1">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
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
                              {tMock(group.nameKey)} · {formatNumber(group.choices.length, locale)}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {t('edit')}
                    </span>
                  </summary>
                  {/* Dish edit form — same fields as the real dashboard,
                      with the sizes & add-ons editor seeded from showcase groups */}
                  <div className="mt-4 flex flex-col gap-4 border-t border-hairline pt-4">
                    <DemoImagePicker />
                    <label className={labelClasses}>
                      <span className={labelSpan}>{t('itemName')}</span>
                      <input type="text" defaultValue={tMock(item.dishKey)} className={inputClasses} />
                    </label>
                    <label className={labelClasses}>
                      <span className={labelSpan}>{t('itemDescription')}</span>
                      <input
                        type="text"
                        defaultValue={item.descriptionKey ? tMock(item.descriptionKey) : ''}
                        className={inputClasses}
                      />
                    </label>
                    <label className={labelClasses}>
                      <span className={labelSpan}>{t('price')}</span>
                      <input
                        type="text"
                        dir="ltr"
                        inputMode="decimal"
                        defaultValue={egpText(item.pricePiastres)}
                        placeholder={t('pricePlaceholder')}
                        className={inputClasses}
                      />
                    </label>
                    {item.optionGroups ? (
                      <OptionsEditor
                        optionGroups={item.optionGroups.map((group, groupIndex) =>
                          toPublicGroup(group, item.id, groupIndex)
                        )}
                      />
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                      <DemoButton className="rounded-base bg-foreground px-4 py-2 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
                        {t('save')}
                      </DemoButton>
                      <DemoButton className="rounded-base border border-hairline px-3.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-muted">
                        {t('deleteItem')}
                      </DemoButton>
                    </div>
                  </div>
                </details>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(item.pricePiastres, locale)}
                  </span>
                  <DemoButton className="rounded-full border border-hairline px-3 py-1 text-[11px] font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.98]">
                    {item.isAvailable ? t('hide') : t('show')}
                  </DemoButton>
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
