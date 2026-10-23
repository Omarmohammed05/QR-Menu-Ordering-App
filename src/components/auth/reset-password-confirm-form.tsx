"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordConfirmForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations("auth.reset");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"form" | "done" | "invalid">("form");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (error) {
      setStatus("invalid");
      return;
    }
    setStatus("done");
    router.push(`/${locale}/sign-in`);
  }

  if (status === "invalid") {
    return <p className="text-sm text-[var(--danger)]">{t("invalidToken")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t("confirmHeading")} htmlFor="new-password">
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </Field>
      {status === "done" ? <p className="text-sm">{t("success")}</p> : null}
      <Button type="submit" disabled={busy || password.length < 10}>
        {busy ? t("loading") : t("confirmSubmit")}
      </Button>
    </form>
  );
}
