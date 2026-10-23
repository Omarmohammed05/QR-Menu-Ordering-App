import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {toggleItemAvailabilityAction} from '@/server/actions/menu';
import {AddCategoryForm} from '@/components/dashboard/add-category-form';
import {AddItemForm} from '@/components/dashboard/add-item-form';
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
  const [categories, items] = await Promise.all([repos.categories.list(), repos.items.list()]);

  const itemsByCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </header>

      <section className="flex flex-col gap-4 border-t border-hairline pt-6">
        <h2 className="text-base font-semibold">{t('addCategoryTitle')}</h2>
        <AddCategoryForm locale={locale} />
      </section>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('emptyCategories')}</p>
      ) : (
        categories.map((category) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          return (
            <section key={category.id} className="flex flex-col gap-3 border-t border-hairline pt-6">
              <h2 className="text-lg font-semibold">{category.nameAr}</h2>
              {categoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('emptyItems')}</p>
              ) : (
                <ul className="flex flex-col">
                  {categoryItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0"
                    >
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
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm tabular-nums">
                          {formatPrice(item.pricePiastres, locale)}
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
                            className="rounded-base border border-hairline px-3 py-1.5 text-xs font-medium transition-[transform] duration-100 active:scale-[0.98]"
                          >
                            {item.isAvailable ? t('hide') : t('show')}
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <AddItemForm locale={locale} categoryId={category.id} />
            </section>
          );
        })
      )}
    </div>
  );
}
