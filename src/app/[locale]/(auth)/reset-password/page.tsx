import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.reset");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      <ResetPasswordForm locale={locale} />
    </section>
  );
}
