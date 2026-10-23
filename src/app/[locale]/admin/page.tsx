import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSuperAdmin } from "@/server/auth/session";
import { listRestaurants } from "@/server/repos/restaurants";
import { pickLocalized } from "@/lib/localized-text";
import { CreateRestaurantForm } from "@/components/admin/create-restaurant-form";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSuperAdmin(locale);
  const t = await getTranslations("admin");
  const tDashboard = await getTranslations("dashboard");

  const restaurants = await listRestaurants();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/dashboard" className="text-sm underline underline-offset-4">
          {tDashboard("title")}
        </Link>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("heading")}</h2>
        {restaurants.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">{t("noRestaurants")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line-strong)] text-start text-[var(--fg-muted)]">
                  <th className="py-2 pe-4 text-start font-medium">{t("columns.name")}</th>
                  <th className="py-2 pe-4 text-start font-medium">{t("columns.slug")}</th>
                  <th className="py-2 pe-4 text-start font-medium">{t("columns.status")}</th>
                  <th className="py-2 pe-4 text-start font-medium">{t("columns.plan")}</th>
                  <th className="py-2 text-start font-medium">{t("columns.created")}</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-b border-[var(--line)]">
                    <td className="py-2 pe-4">
                      {pickLocalized(restaurant.name, locale as "ar" | "en")}
                    </td>
                    <td className="py-2 pe-4 font-mono text-xs">{restaurant.slug}</td>
                    <td className="py-2 pe-4">{t(`status.${restaurant.status}`)}</td>
                    <td className="py-2 pe-4">{t(`plan.${restaurant.plan}`)}</td>
                    <td className="py-2 text-xs text-[var(--fg-subtle)]">
                      <time dateTime={restaurant.createdAt.toISOString()}>
                        {restaurant.createdAt.toISOString().slice(0, 10)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t("create")}</h2>
        <CreateRestaurantForm locale={locale} />
      </section>
    </main>
  );
}
