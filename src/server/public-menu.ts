import {isOpenAt, type OpeningHoursRow} from '@/lib/opening-hours';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';

/**
 * Serializable menu for the public customer page: active categories holding
 * available dishes, the scanned table (if any) and the open/closed badge.
 */
export type PublicMenuItem = {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  pricePiastres: number;
  imageUrl: string | null;
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
  };
  table: {id: string; label: string} | null;
  isOpen: boolean;
  categories: PublicMenuCategory[];
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
  const [categories, items, slots] = await Promise.all([
    repos.categories.list(),
    repos.items.list(),
    repos.hours.list() as Promise<OpeningHoursRow[]>
  ]);

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
      pricePiastres: item.pricePiastres,
      imageUrl: item.imageUrl ?? null
    }));

  return {
    restaurant: {
      slug: restaurant.slug,
      nameAr: restaurant.nameAr,
      nameEn: restaurant.nameEn,
      logoUrl: restaurant.logoUrl ?? null
    },
    table,
    isOpen: isOpenAt(slots, new Date(), restaurant.timezone),
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
