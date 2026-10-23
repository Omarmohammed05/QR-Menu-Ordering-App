import { getTranslations, setRequestLocale } from "next-intl/server";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { getInvitationContext } from "@/server/services/invitations";

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth.invite");
  const tokenValue = Array.isArray(token) ? token[0] : token;
  const context = tokenValue ? await getInvitationContext(tokenValue) : null;

  if (!context?.valid) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("heading")}</h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("invalid")}</p>
      </section>
    );
  }

  const roleLabels: Record<string, string> = {
    owner: t("roleOwner"),
    manager: t("roleManager"),
    staff: t("roleStaff"),
  };

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      <p className="text-base">
        {t("youAreInvited", {
          restaurant:
            locale === "en" && context.restaurantName.en
              ? context.restaurantName.en
              : context.restaurantName.ar,
          role: roleLabels[context.role] ?? context.role,
        })}
      </p>
      <p className="text-sm text-[var(--fg-muted)]">{t("accountFor", { email: context.email })}</p>
      <AcceptInviteForm token={tokenValue as string} />
    </section>
  );
}
