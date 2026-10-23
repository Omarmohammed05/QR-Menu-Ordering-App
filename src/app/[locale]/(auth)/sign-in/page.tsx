import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.signIn");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      <SignInForm locale={locale} />
    </section>
  );
}
