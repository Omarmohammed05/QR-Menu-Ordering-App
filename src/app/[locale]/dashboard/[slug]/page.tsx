import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { can } from "@/server/auth/rbac";
import { requireSession } from "@/server/auth/session";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";
import { getRestaurantBySlug } from "@/server/repos/restaurants";
import { listMenu } from "@/server/services/menu";
import { pickLocalized } from "@/lib/localized-text";
import { MenuManager } from "@/components/menu/menu-manager";
import { QrPanel } from "@/components/menu/qr-panel";

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

  // The QR encodes the absolute public menu URL — built from the request host
  // so it is correct in every environment without extra configuration.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const publicMenuUrl = `${proto}://${host}/${locale}/menu/${restaurant.slug}`;
  const qrDataUrl = await QRCode.toDataURL(publicMenuUrl, { width: 512, margin: 2 });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold">
          {pickLocalized(restaurant.name, locale as "ar" | "en")}
        </h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("title")}</p>
        <Link
          href={`/menu/${restaurant.slug}`}
          className="mt-3 inline-flex min-h-12 w-fit items-center rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-5 py-2 text-sm"
        >
          {t("viewPublic")}
        </Link>
      </header>
      <QrPanel dataUrl={qrDataUrl} url={publicMenuUrl} fileName={`${restaurant.slug}-menu-qr`} />
      <MenuManager restaurantId={restaurant.id} initialMenu={menu} locale={locale as "ar" | "en"} />
    </main>
  );
}
