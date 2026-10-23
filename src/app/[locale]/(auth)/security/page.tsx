import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/server/auth/session";
import { TwoFactorPanel } from "@/components/auth/two-factor-panel";

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSession(locale);
  const t = await getTranslations("auth.security");
  const tCommon = await getTranslations("common");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      <TwoFactorPanel initialEnabled={session.user.twoFactorEnabled ?? false} />
      <footer>
        <Link href="/dashboard" className="text-sm underline underline-offset-4">
          {tCommon("back")}
        </Link>
      </footer>
    </section>
  );
}
