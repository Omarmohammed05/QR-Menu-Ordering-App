"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/localized-text";
import type { MenuCategoryDto } from "@/server/services/menu";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { CategoryNameForm, type CategoryNameValues } from "./category-name-form";
import { ItemForm, type ItemFormValues } from "./item-form";
import { ItemRow } from "./item-row";

export function CategoryCard({
  category,
  locale,
  isFirst,
  isLast,
  disabled,
  onRename,
  onDelete,
  onMove,
  onAddItem,
  onUpdateItem,
  onItemAvailability,
  onItemMove,
  onItemDelete,
}: {
  category: MenuCategoryDto;
  locale: AppLocale;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onRename: (values: CategoryNameValues) => Promise<boolean>;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onAddItem: (values: ItemFormValues) => Promise<boolean>;
  onUpdateItem: (itemId: string, values: ItemFormValues) => Promise<boolean>;
  onItemAvailability: (itemId: string, isAvailable: boolean) => void;
  onItemMove: (itemId: string, direction: "up" | "down") => void;
  onItemDelete: (itemId: string) => void;
}) {
  const t = useTranslations("menu");
  const [renaming, setRenaming] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  return (
    <li className="flex flex-col gap-4 border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{pickLocalized(category.name, locale)}</h3>
        <div className="flex items-center gap-2">
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
          <IconButton disabled={disabled} onClick={() => setRenaming((value) => !value)}>
            {t("renameCategory")}
          </IconButton>
          <IconButton
            disabled={disabled}
            className="border-[var(--danger)] text-[var(--danger)]"
            onClick={() => {
              if (window.confirm(t("deleteCategoryConfirm"))) onDelete();
            }}
          >
            {t("delete")}
          </IconButton>
        </div>
      </div>

      {renaming ? (
        <CategoryNameForm
          initial={{ nameAr: category.name.ar, nameEn: category.name.en ?? "" }}
          submitLabel={t("save")}
          onCancel={() => setRenaming(false)}
          onSubmit={async (values) => {
            const ok = await onRename(values);
            if (ok) setRenaming(false);
            return ok;
          }}
        />
      ) : null}

      {category.items.length === 0 ? (
        <p className="text-sm text-[var(--fg-muted)]">{t("noItems")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--line)]">
          {category.items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              locale={locale}
              isFirst={index === 0}
              isLast={index === category.items.length - 1}
              disabled={disabled}
              onEdit={(values) => onUpdateItem(item.id, values)}
              onAvailability={(isAvailable) => onItemAvailability(item.id, isAvailable)}
              onMove={(direction) => onItemMove(item.id, direction)}
              onDelete={() => onItemDelete(item.id)}
            />
          ))}
        </ul>
      )}

      {addingItem ? (
        <ItemForm
          submitLabel={t("addItem")}
          onCancel={() => setAddingItem(false)}
          onSubmit={async (values) => {
            const ok = await onAddItem(values);
            if (ok) setAddingItem(false);
            return ok;
          }}
        />
      ) : (
        <Button
          variant="ghost"
          className="self-start"
          disabled={disabled}
          onClick={() => setAddingItem(true)}
        >
          {t("addItem")}
        </Button>
      )}
    </li>
  );
}
