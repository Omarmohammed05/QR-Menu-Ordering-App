"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth.reset");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Always show the same message — enumeration resistance (spec 11).
    await authClient.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password/confirm`,
    });
    setSent(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {sent ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--line)] p-4">
          <p className="text-sm">{t("sent")}</p>
          <p className="text-xs text-[var(--fg-subtle)]">{t("devHint")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label={tCommon("email")} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" disabled={email.length === 0}>
            {t("submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
