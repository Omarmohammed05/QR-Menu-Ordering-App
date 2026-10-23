import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSession, getMemberships } from "@/server/auth/session";
import { pickLocalized } from "@/lib/localized-text";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSession(locale);
  const t = await getTranslations("dashboard");

  const memberships = await getMemberships(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("welcome", { name: session.user.name })}</h1>
        <SignOutButton />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("yourRestaurants")}</h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">{t("noRestaurants")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--line)]">
            {memberships.map((membership) => (
              <li
                key={membership.restaurantId}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span>{pickLocalized(membership.name, locale as "ar" | "en")}</span>
                <span className="font-mono text-xs text-[var(--fg-subtle)]">{membership.slug}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[var(--fg-subtle)]">{t("comingSoon")}</p>
      </section>

      <footer className="flex flex-wrap gap-4 text-sm">
        {session.user.superAdmin ? (
          <Link href="/admin" className="underline underline-offset-4">
            {t("goAdmin")}
          </Link>
        ) : null}
        <Link href="/security" className="underline underline-offset-4">
          {t("goSecurity")}
        </Link>
      </footer>
    </main>
  );
}
