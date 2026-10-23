"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import type { ActionResult } from "@/server/actions/secure";
import type { MenuSnapshot } from "@/server/services/menu";
import {
  createCategoryAction,
  createItemAction,
  deleteCategoryAction,
  deleteItemAction,
  moveCategoryAction,
  moveItemAction,
  renameCategoryAction,
  setItemAvailabilityAction,
  updateItemAction,
} from "@/server/actions/menu";
import { CategoryNameForm, type CategoryNameValues } from "./category-name-form";
import { CategoryCard } from "./category-card";

type MenuErrorKey =
  | "errorForbidden"
  | "errorInvalid"
  | "errorNotFound"
  | "categoryNotEmpty"
  | "genericError";

function errorKey(code: string): MenuErrorKey {
  switch (code) {
    case "FORBIDDEN":
      return "errorForbidden";
    case "INVALID_INPUT":
      return "errorInvalid";
    case "NOT_FOUND":
      return "errorNotFound";
    case "CATEGORY_NOT_EMPTY":
      return "categoryNotEmpty";
    default:
      return "genericError";
  }
}

/**
 * Owns the menu state: every action returns the full fresh snapshot from the
 * server, which replaces the local state (ADR-005 — no optimistic updates).
 */
export function MenuManager({
  restaurantId,
  initialMenu,
  locale,
}: {
  restaurantId: string;
  initialMenu: MenuSnapshot;
  locale: AppLocale;
}) {
  const t = useTranslations("menu");
  const [menu, setMenu] = useState(initialMenu);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<ActionResult<MenuSnapshot>>): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      setMenu(result.data);
      setError(null);
      return true;
    }
    setError(t(errorKey(result.code)));
    return false;
  }

  const addCategory = (values: CategoryNameValues) =>
    run(() => createCategoryAction({ restaurantId, ...values }));

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("categories")}</h2>
        {menu.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">{t("noCategories")}</p>
        ) : (
          <ul className="flex flex-col gap-8">
            {menu.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                locale={locale}
                isFirst={index === 0}
                isLast={index === menu.length - 1}
                disabled={busy}
                onRename={(values) =>
                  run(() => renameCategoryAction({ restaurantId, categoryId: category.id, ...values }))
                }
                onDelete={() => run(() => deleteCategoryAction({ restaurantId, categoryId: category.id }))}
                onMove={(direction) =>
                  run(() => moveCategoryAction({ restaurantId, categoryId: category.id, direction }))
                }
                onAddItem={(values) =>
                  run(() => createItemAction({ restaurantId, categoryId: category.id, ...values }))
                }
                onUpdateItem={(itemId, values) =>
                  run(() => updateItemAction({ restaurantId, itemId, ...values }))
                }
                onItemAvailability={(itemId, isAvailable) =>
                  run(() => setItemAvailabilityAction({ restaurantId, itemId, isAvailable }))
                }
                onItemMove={(itemId, direction) =>
                  run(() => moveItemAction({ restaurantId, itemId, direction }))
                }
                onItemDelete={(itemId) => run(() => deleteItemAction({ restaurantId, itemId }))}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--line)] pt-6">
        <h2 className="text-lg font-medium">{t("addCategory")}</h2>
        <CategoryNameForm submitLabel={t("addCategory")} onSubmit={addCategory} />
      </section>
    </div>
  );
}
