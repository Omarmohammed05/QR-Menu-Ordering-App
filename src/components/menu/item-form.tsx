"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { photoUploadError } from "@/lib/photo";
import { uploadPhotoAction } from "@/server/actions/photos";

export type ItemFormValues = {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: string;
  imageUrl?: string;
  isAvailable: boolean;
};

function photoErrorKey(code: string): string {
  switch (code) {
    case "FILE_TOO_LARGE":
      return "photoTooLarge";
    case "INVALID_FILE_TYPE":
      return "photoInvalidType";
    case "FORBIDDEN":
      return "errorForbidden";
    case "INVALID_INPUT":
      return "errorInvalid";
    default:
      return "genericError";
  }
}

/** Bilingual item form — used for "add item" and inline "edit item". */
export function ItemForm({
  restaurantId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  restaurantId: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again after an error
    if (!file) return;
    const rejection = photoUploadError(file.type, file.size);
    if (rejection) {
      setPhotoError(t(rejection));
      return;
    }
    setPhotoError(null);
    setUploading(true);
    const result = await uploadPhotoAction({ restaurantId, file });
    setUploading(false);
    if (result.ok) {
      setImageUrl(result.data.url);
    } else {
      setPhotoError(t(photoErrorKey(result.code)));
    }
  }

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
      <Field label={t("photo")} htmlFor={`${formId}-photo`} hint={t("photoHint")} error={photoError}>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="h-16 w-16 rounded-[var(--radius-md)] border border-[var(--line)] object-cover"
              />
              <button
                type="button"
                aria-label={t("removePhoto")}
                onClick={() => setImageUrl("")}
                className="press absolute -end-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--bg)] text-xs"
              >
                ×
              </button>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            id={`${formId}-photo`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelected}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={uploading || busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? t("uploading") : t("uploadPhoto")}
          </Button>
        </div>
      </Field>
      {/* text (not type="url"): uploaded photos fill this with a relative
          /api/photos/{id} path, which native URL validation would reject.
          Manual URLs are validated server-side. */}
      <Field label={t("imageUrl")} htmlFor={`${formId}-image`}>
        <Input
          id={`${formId}-image`}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          maxLength={2048}
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
