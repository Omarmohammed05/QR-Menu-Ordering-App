import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/localized-text";
import { getRestaurantBySlug } from "@/server/repos/restaurants";
import { listMenu } from "@/server/services/menu";
import { MenuView } from "@/components/public/menu-view";

/** Suspended and unknown slugs are indistinguishable to a scanner (ADR-006). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant || restaurant.status !== "active") {
    return {};
  }
  const description = restaurant.description
    ? pickLocalized(restaurant.description, locale as AppLocale)
    : undefined;
  return {
    title: pickLocalized(restaurant.name, locale as AppLocale),
    ...(description ? { description } : {}),
  };
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant || restaurant.status !== "active") {
    notFound();
  }

  const menu = await listMenu(restaurant.id);

  return (
    <MenuView
      slug={restaurant.slug}
      name={restaurant.name}
      description={restaurant.description ?? null}
      menu={menu}
      locale={locale as AppLocale}
      whatsappNumber={restaurant.whatsappNumber ?? null}
      acceptingOrders={restaurant.acceptingOrders}
    />
  );
}
