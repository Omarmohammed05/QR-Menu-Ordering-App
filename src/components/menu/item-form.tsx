"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type ItemFormValues = {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: string;
  imageUrl?: string;
  isAvailable: boolean;
};

/** Bilingual item form — used for "add item" and inline "edit item". */
export function ItemForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: {
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    price: string;
    imageUrl: string;
    isAvailable: boolean;
  };
  submitLabel: string;
  onSubmit: (values: ItemFormValues) => Promise<boolean>;
  onCancel: () => void;
}) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const formId = useId();
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onSubmit({
      nameAr,
      nameEn: nameEn.trim() || undefined,
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      price,
      imageUrl: imageUrl.trim() || undefined,
      isAvailable,
    });
    setBusy(false);
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
      <Field label={t("descriptionAr")} htmlFor={`${formId}-desc-ar`}>
        <Input
          id={`${formId}-desc-ar`}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          maxLength={500}
        />
      </Field>
      <Field label={t("descriptionEn")} htmlFor={`${formId}-desc-en`}>
        <Input
          id={`${formId}-desc-en`}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          maxLength={500}
        />
      </Field>
      <Field label={t("price")} htmlFor={`${formId}-price`} hint={t("priceHint")}>
        <Input
          id={`${formId}-price`}
          inputMode="decimal"
          pattern="\d+(\.\d{1,2})?"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </Field>
      <Field label={t("imageUrl")} htmlFor={`${formId}-image`}>
        <Input
          id={`${formId}-image`}
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="size-4"
        />
        {t("available")}
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
