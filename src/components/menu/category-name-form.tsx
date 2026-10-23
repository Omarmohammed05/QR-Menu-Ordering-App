"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type CategoryNameValues = { nameAr: string; nameEn?: string };

/** Bilingual category name form — used for both "add" and inline "rename". */
export function CategoryNameForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { nameAr: string; nameEn: string };
  submitLabel: string;
  onSubmit: (values: CategoryNameValues) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const formId = useId();
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await onSubmit({ nameAr, nameEn: nameEn.trim() || undefined });
    setBusy(false);
    if (ok) {
      setNameAr("");
      setNameEn("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label={t("nameAr")} htmlFor={`${formId}-ar`}>
        <Input
          id={`${formId}-ar`}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          required
          minLength={2}
          maxLength={80}
        />
      </Field>
      <Field label={t("nameEn")} htmlFor={`${formId}-en`}>
        <Input
          id={`${formId}-en`}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          maxLength={80}
        />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
