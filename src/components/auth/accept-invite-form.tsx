"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { acceptInvitationAction } from "@/server/actions/invitations";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AcceptInviteForm({ token }: { token: string }) {
  const t = useTranslations("auth.invite");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await acceptInvitationAction({ token, name, password });
    setBusy(false);
    if (!result.ok) {
      setError(
        result.code === "user_exists"
          ? "userExists"
          : result.code === "invalid"
            ? "invalid"
            : "generic",
      );
      return;
    }
    setDone(true);
    void router.push("/sign-in");
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={tCommon("name")} htmlFor="name">
        <Input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          required
        />
      </Field>
      <Field
        label={tCommon("password")}
        htmlFor="password"
        hint={t("passwordHint")}
        error={error ? t(error) : null}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={10}
          required
        />
      </Field>
      <Button type="submit" disabled={busy || name.length < 2 || password.length < 10}>
        {busy ? tCommon("loading") : t("submit")}
      </Button>
    </form>
  );
}
