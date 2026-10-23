"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createRestaurantAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type CreateState =
  { kind: "form" } | { kind: "created"; inviteLink: string } | { kind: "error"; message: string };

export function CreateRestaurantForm({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<CreateState>({ kind: "form" });
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setState({ kind: "form" });
    const result = await createRestaurantAction({ nameAr, nameEn, slug, ownerEmail });
    setBusy(false);
    if (!result.ok) {
      setState({ kind: "error", message: result.code === "INVALID_INPUT" ? t("slugInvalid") : t("genericError") });
      return;
    }
    if (!result.data.ok) {
      setState({
        kind: "error",
        message:
          result.data.code === "slug_taken"
            ? t("slugTaken")
            : result.data.code === "slug_invalid"
              ? t("slugInvalid")
              : t("genericError"),
      });
      return;
    }
    setState({
      kind: "created",
      inviteLink: `${window.location.origin}/${locale}/accept-invite?token=${result.data.inviteToken}`,
    });
  }

  async function onCopy() {
    if (state.kind !== "created") return;
    await navigator.clipboard.writeText(state.inviteLink);
    setCopied(true);
  }

  if (state.kind === "created") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--line)] p-4">
        <p className="text-sm font-medium">{t("created")}</p>
        <p className="text-sm text-[var(--fg-muted)]">{t("inviteLinkHint")}</p>
        <div className="flex items-center gap-2">
          <Input readOnly value={state.inviteLink} className="flex-1 font-mono text-xs" />
          <Button variant="ghost" onClick={onCopy}>
            {copied ? tCommon("copied") : tCommon("copy")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field label={t("nameAr")} htmlFor="name-ar">
        <Input
          id="name-ar"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          required
          minLength={2}
        />
      </Field>
      <Field label={t("nameEn")} htmlFor="name-en">
        <Input id="name-en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      </Field>
      <Field label={t("slug")} htmlFor="slug" hint={t("slugHint")}>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </Field>
      <Field label={t("ownerEmail")} htmlFor="owner-email">
        <Input
          id="owner-email"
          type="email"
          inputMode="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          required
        />
      </Field>
      {state.kind === "error" ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {t("create")}
      </Button>
    </form>
  );
}
