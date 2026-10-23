import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordConfirmForm } from "@/components/auth/reset-password-confirm-form";

export default async function ResetPasswordConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth.reset");
  const tokenValue = Array.isArray(token) ? token[0] : token;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("confirmHeading")}</h1>
      <ResetPasswordConfirmForm locale={locale} token={tokenValue ?? ""} />
    </section>
  );
}
