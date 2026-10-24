import {isOpenAt, type OpeningHoursRow} from '@/lib/opening-hours';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';

/**
 * Serializable menu for the public customer page: active categories holding
 * available dishes, the scanned table (if any) and the open/closed badge.
 */
/** A selectable extra on a dish (e.g. "extra cheese +500 piastres"). */
export type PublicMenuOption = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  priceDeltaPiastres: number;
};

export type PublicMenuItem = {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  pricePiastres: number;
  imageUrl: string | null;
  options: PublicMenuOption[];
};

export type PublicMenuCategory = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  imageUrl: string | null;
  items: PublicMenuItem[];
};

export type PublicMenu = {
  restaurant: {
    slug: string;
    nameAr: string;
    nameEn: string | null;
    logoUrl: string | null;
    currency: string;
    /** InstaPay address — null means the checkout only offers cash. */
    instapayHandle: string | null;
  };
  table: {id: string; label: string} | null;
  isOpen: boolean;
  categories: PublicMenuCategory[];
  /** Physical branches, rendered to the customer below the dishes. */
  addresses: {id: string; label: string; address: string}[];
};

/**
 * Resolves the tenant from the public slug (tenant-root path, ADR-002), then
 * builds the customer-facing menu through the scoped repos. `token` comes
 * from a table QR; a stale/foreign token is ignored (takeaway order).
 */
export async function loadPublicMenu(slug: string, token?: string): Promise<PublicMenu | null> {
  const restaurant = await restaurantsRepo.findBySlug(slug);
  if (!restaurant || !restaurant.isActive) return null;

  const repos = createRestaurantRepos(restaurant.id);
  const [categories, items, options, slots, addresses] = await Promise.all([
    repos.categories.list(),
    repos.items.list(),
    repos.options.listActive(),
    repos.hours.list() as Promise<OpeningHoursRow[]>,
    repos.addresses.list()
  ]);
  const optionsByItem = new Map<string, PublicMenuOption[]>();
  for (const option of options) {
    const list = optionsByItem.get(option.menuItemId) ?? [];
    list.push({
      id: option.id,
      nameAr: option.nameAr,
      nameEn: option.nameEn ?? null,
      priceDeltaPiastres: option.priceDeltaPiastres
    });
    optionsByItem.set(option.menuItemId, list);
  }

  let table: PublicMenu['table'] = null;
  if (token) {
    const resolved = await tablesByToken.findActive(token);
    if (resolved && resolved.restaurant.id === restaurant.id) {
      table = {id: resolved.table.id, label: resolved.table.label};
    }
  }

  // Only what a customer may order: active sections, available dishes.
  const publicItems: PublicMenuItem[] = items
    .filter((item) => item.isAvailable)
    .map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn ?? null,
      pricePiastres: item.pricePiastres,
      imageUrl: item.imageUrl ?? null,
      options: optionsByItem.get(item.id) ?? []
    }));

  return {
    restaurant: {
      slug: restaurant.slug,
      nameAr: restaurant.nameAr,
      nameEn: restaurant.nameEn,
      logoUrl: restaurant.logoUrl ?? null,
      currency: restaurant.currency,
      instapayHandle: restaurant.instapayHandle ?? null
    },
    table,
    isOpen: isOpenAt(slots, new Date(), restaurant.timezone),
    addresses: addresses.map(({id, label, address}) => ({id, label, address})),
    categories: categories
      .filter((category) => category.isActive)
      .map((category) => ({
        id: category.id,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        imageUrl: category.imageUrl ?? null,
        items: publicItems.filter((item) => item.categoryId === category.id)
      }))
      .filter((category) => category.items.length > 0)
  };
}

/**
 * One dish with its active options for the customer detail page. Tenant
 * resolution and scoping mirror `loadPublicMenu`; an unavailable or foreign
 * item id resolves to null (the page renders its 404).
 */
export async function loadPublicItemDetail(
  slug: string,
  itemId: string
): Promise<PublicMenuItem | null> {
  const restaurant = await restaurantsRepo.findBySlug(slug);
  if (!restaurant || !restaurant.isActive) return null;

  const repos = createRestaurantRepos(restaurant.id);
  const item = await repos.items.findById(itemId);
  if (!item || !item.isAvailable) return null;

  const options = await repos.options.listActiveByItem(item.id);
  return {
    id: item.id,
    categoryId: item.categoryId,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    descriptionAr: item.descriptionAr ?? null,
    descriptionEn: item.descriptionEn ?? null,
    pricePiastres: item.pricePiastres,
    imageUrl: item.imageUrl ?? null,
    options: options.map((option) => ({
      id: option.id,
      nameAr: option.nameAr,
      nameEn: option.nameEn ?? null,
      priceDeltaPiastres: option.priceDeltaPiastres
    }))
  };
}
