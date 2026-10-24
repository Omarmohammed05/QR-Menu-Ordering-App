import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {loadPublicItemDetail} from '@/server/public-menu';
import {restaurantsRepo} from '@/server/db/repos';
import {ItemDetail} from '@/components/public/item-detail';

type Props = {
  params: Promise<{locale: string; slug: string; itemId: string}>;
  searchParams: Promise<{t?: string | string[]}>;
};

/**
 * The dish detail page (`/{slug}/item/{itemId}`) — reached by tapping a dish
 * on the customer menu. Public and read-only like the menu itself; the only
 * write remains `placeOrderAction`, fed from the sessionStorage cart.
 */
export default async function ItemDetailPage({params, searchParams}: Props) {
  const {slug, itemId} = await params;
  const {t} = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;

  const restaurant = await restaurantsRepo.findBySlug(slug);
  if (!restaurant || !restaurant.isActive) notFound();

  const item = await loadPublicItemDetail(slug, itemId);
  if (!item) notFound();

  return (
    <ItemDetail
      item={item}
      slug={restaurant.slug}
      currency={restaurant.currency}
      tableToken={token ?? null}
    />
  );
}

type GenerateMetadataProps = {
  params: Promise<{locale: string; slug: string; itemId: string}>;
};

export async function generateMetadata({params}: GenerateMetadataProps): Promise<Metadata> {
  const {locale, slug, itemId} = await params;
  const item = await loadPublicItemDetail(slug, itemId);
  if (!item) return {};
  return {title: locale === 'en' && item.nameEn ? item.nameEn : item.nameAr};
}
