import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { can } from "@/server/auth/rbac";
import { requireSession } from "@/server/auth/session";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";
import { getRestaurantBySlug } from "@/server/repos/restaurants";
import { listMenu } from "@/server/services/menu";
import { pickLocalized } from "@/lib/localized-text";
import { MenuManager } from "@/components/menu/menu-manager";

export default async function ManageRestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const session = await requireSession(locale);
  const t = await getTranslations("menu");

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    notFound();
  }

  // Non-members are redirected: slug probing must not reveal restaurant menus.
  const member = await createRestaurantRepo(restaurant.id).members.getByUserId(session.user.id);
  if (!can({ memberRole: member?.role ?? null, superAdmin: session.user.superAdmin ?? false }, "menu.edit")) {
    redirect(`/${locale}/dashboard`);
  }

  const menu = await listMenu(restaurant.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold">
          {pickLocalized(restaurant.name, locale as "ar" | "en")}
        </h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("title")}</p>
      </header>
      <MenuManager restaurantId={restaurant.id} initialMenu={menu} locale={locale as "ar" | "en"} />
    </main>
  );
}
