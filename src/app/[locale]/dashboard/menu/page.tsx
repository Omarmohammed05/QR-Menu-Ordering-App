import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {toggleItemAvailabilityAction} from '@/server/actions/menu';
import {MenuBookIcon, OrdersIcon} from '@/components/icons';
import {formatNumber} from '@/lib/format';
import {AddCategoryForm} from '@/components/dashboard/add-category-form';
import {AddItemForm} from '@/components/dashboard/add-item-form';
import {EditCategoryForm} from '@/components/dashboard/edit-category-form';
import {DeleteCategoryButton} from '@/components/dashboard/delete-category-button';
import {EditItemForm} from '@/components/dashboard/edit-item-form';
import {DeleteItemButton} from '@/components/dashboard/delete-item-button';
import {ItemOptionsSection} from '@/components/dashboard/item-options-section';
import {formatPrice} from '@/lib/format';

type Props = {params: Promise<{locale: string}>};

/**
 * Phase 4 — menu management: sections and dishes of this tenant, built
 * exclusively on the scoped repo factory (ADR-002).
 */
export default async function MenuManagementPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const t = await getTranslations('menuManagement');
  const repos = createRestaurantRepos(membership.restaurant.id);
  const [categories, items, options] = await Promise.all([
    repos.categories.list(),
    repos.items.list(),
    repos.options.listActive()
  ]);

  const itemsByCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  }

  const optionsByItem = new Map<string, typeof options>();
  for (const option of options) {
    const list = optionsByItem.get(option.menuItemId) ?? [];
    list.push(option);
    optionsByItem.set(option.menuItemId, list);
  }

  const unavailableCount = items.filter((item) => !item.isAvailable).length;
  const stats = [
    {label: t('stats.sections'), value: formatNumber(categories.length, locale), icon: 'book'},
    {label: t('stats.dishes'), value: formatNumber(items.length, locale), icon: 'orders'},
    {label: t('stats.unavailable'), value: formatNumber(unavailableCount, locale), icon: 'dot'}
  ];

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
            className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between rounded-2xl border border-hairline bg-surface shadow-card p-4"
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
                <span className="size-2 rounded-full bg-brand" />
              )}
            </span>
          </div>
        ))}
      </div>

      {/* New section */}
      <section className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-4 rounded-2xl border border-hairline bg-surface shadow-card p-5">
        <h2 className="text-base font-semibold">{t('addCategoryTitle')}</h2>
        <AddCategoryForm locale={locale} />
      </section>

      {categories.length === 0 ? (
        <p className="animate-fade-in rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-sm text-muted-foreground">
          {t('emptyCategories')}
        </p>
      ) : (
        categories.map((category, index) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          return (
            <section
              key={category.id}
              style={{animationDelay: `${(index + 1) * 70}ms`}}
              className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-3 rounded-2xl border border-hairline bg-surface shadow-card p-5"
            >
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {category.nameAr}
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                      {formatNumber(categoryItems.length, locale)}
                    </span>
                  </h2>
                  <span className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.98]">
                    {t('edit')}
                  </span>
                </summary>
                <div className="mt-4 flex flex-col gap-4 rounded-base border border-hairline p-4">
                  <EditCategoryForm
                    locale={locale}
                    category={{
                      id: category.id,
                      nameAr: category.nameAr,
                      imageUrl: category.imageUrl ?? null
                    }}
                  />
                  <div className="border-t border-hairline pt-4">
                    <DeleteCategoryButton locale={locale} categoryId={category.id} />
                  </div>
                </div>
              </details>
              {categoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('emptyItems')}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-hairline">
                  {categoryItems.map((item) => (
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
                              {item.nameAr}
                            </span>
                            {item.descriptionAr ? (
                              <span className="truncate text-sm text-muted-foreground">
                                {item.descriptionAr}
                              </span>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground">
                            {t('edit')}
                          </span>
                        </summary>
                        <div className="mt-4 flex flex-col gap-4 border-t border-hairline pt-4">
                          <EditItemForm
                            locale={locale}
                            item={{
                              id: item.id,
                              nameAr: item.nameAr,
                              descriptionAr: item.descriptionAr,
                              pricePiastres: item.pricePiastres,
                              imageUrl: item.imageUrl ?? null
                            }}
                          />
                          <div className="border-t border-hairline pt-4">
                            <ItemOptionsSection
                              locale={locale}
                              currency={membership.restaurant.currency}
                              itemId={item.id}
                              options={(optionsByItem.get(item.id) ?? []).map((option) => ({
                                id: option.id,
                                nameAr: option.nameAr,
                                priceDeltaPiastres: option.priceDeltaPiastres
                              }))}
                            />
                          </div>
                          <div className="border-t border-hairline pt-4">
                            <DeleteItemButton locale={locale} itemId={item.id} />
                          </div>
                        </div>
                      </details>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-medium tabular-nums">
                          {formatPrice(item.pricePiastres, locale, membership.restaurant.currency)}
                        </span>
                        <form action={toggleItemAvailabilityAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <input
                            type="hidden"
                            name="makeAvailable"
                            value={String(!item.isAvailable)}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-hairline px-3 py-1 text-[11px] font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.98]"
                          >
                            {item.isAvailable ? t('hide') : t('show')}
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-hairline pt-4">
                <AddItemForm locale={locale} categoryId={category.id} />
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
