import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function LocaleSwitch({ locale }: { locale: string }) {
  const t = await getTranslations("placeholder");
  const target = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href="/"
      locale={target}
      className="inline-flex min-h-12 items-center rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-5 py-2 text-sm"
    >
      {t("language")}
    </Link>
  );
}
