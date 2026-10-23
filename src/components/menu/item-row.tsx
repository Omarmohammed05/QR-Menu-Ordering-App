"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { formatMoney } from "@/lib/money";
import { pickLocalized } from "@/lib/localized-text";
import type { MenuItemDto } from "@/server/services/menu";
import { IconButton } from "@/components/ui/icon-button";
import { ItemForm, type ItemFormValues } from "./item-form";

export function ItemRow({
  item,
  locale,
  isFirst,
  isLast,
  disabled,
  onEdit,
  onAvailability,
  onMove,
  onDelete,
}: {
  item: MenuItemDto;
  locale: AppLocale;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onEdit: (values: ItemFormValues) => Promise<boolean>;
  onAvailability: (isAvailable: boolean) => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}) {
  const t = useTranslations("menu");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-3">
        <ItemForm
          initial={{
            nameAr: item.name.ar,
            nameEn: item.name.en ?? "",
            descriptionAr: item.description?.ar ?? "",
            descriptionEn: item.description?.en ?? "",
            price: (item.pricePiastres / 100).toFixed(2),
            imageUrl: item.imageUrl ?? "",
            isAvailable: item.isAvailable,
          }}
          submitLabel={t("save")}
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            const ok = await onEdit(values);
            if (ok) setEditing(false);
            return ok;
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{pickLocalized(item.name, locale)}</span>
        <span className="text-xs text-[var(--fg-muted)]">{formatMoney(item.pricePiastres, locale)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton
          disabled={disabled}
          aria-label={item.isAvailable ? t("available") : t("unavailable")}
          className={item.isAvailable ? "" : "border-[var(--danger)] text-[var(--danger)]"}
          onClick={() => onAvailability(!item.isAvailable)}
        >
          {item.isAvailable ? t("available") : t("unavailable")}
        </IconButton>
        <IconButton
          disabled={disabled || isFirst}
          aria-label={t("moveUp")}
          onClick={() => onMove("up")}
        >
          ↑
        </IconButton>
        <IconButton
          disabled={disabled || isLast}
          aria-label={t("moveDown")}
          onClick={() => onMove("down")}
        >
          ↓
        </IconButton>
        <IconButton disabled={disabled} onClick={() => setEditing(true)}>
          {t("editItem")}
        </IconButton>
        <IconButton
          disabled={disabled}
          className="border-[var(--danger)] text-[var(--danger)]"
          onClick={() => {
            if (window.confirm(t("deleteItemConfirm"))) onDelete();
          }}
        >
          {t("delete")}
        </IconButton>
      </div>
    </li>
  );
}
