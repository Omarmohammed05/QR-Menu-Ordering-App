import { getTranslations, setRequestLocale } from "next-intl/server";
import { LocaleSwitch } from "@/components/locale-switch";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("placeholder");

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-8 px-6 text-center">
      <LocaleSwitch locale={locale} />
      <h1 className="text-3xl font-semibold leading-relaxed">{t("heading")}</h1>
      <p className="text-lg text-[var(--fg-muted)]">{t("body")}</p>
      <ThemeToggle />
    </main>
  );
}
