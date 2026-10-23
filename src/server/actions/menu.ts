"use server";

import { z } from "zod";
import { secureAction } from "./secure";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  moveCategory,
  moveItem,
  renameCategory,
  setItemAvailability,
  updateItem,
} from "@/server/services/menu";

// Per-restaurant authorization (menu.edit on the caller's membership) happens
// inside the service: the restaurantId arrives as validated input, which the
// authorize hook cannot see. secureAction already denies anonymous callers.

const restaurantId = z.string().min(1);
const categoryId = z.string().min(1);
const itemId = z.string().min(1);
const nameAr = z.string().trim().min(2).max(80);
const nameEn = z.string().trim().max(80).optional();
const description = z.string().trim().max(500).optional();
const price = z.string().trim().regex(/^\d+(\.\d{1,2})?$/);
const direction = z.enum(["up", "down"]);
// Either an external absolute URL or an internal photo path (uploaded photos,
// ADR-008) — relative paths are required so photos keep working when the
// public origin changes.
const imageUrl = z
  .union([z.url(), z.string().regex(/^\/api\/photos\/[a-z0-9]+$/i)])
  .optional();

const categoryValues = { nameAr, nameEn } as const;

const itemValues = {
  nameAr,
  nameEn,
  descriptionAr: description,
  descriptionEn: description,
  price,
  imageUrl,
  isAvailable: z.boolean(),
} as const;

export const createCategoryAction = secureAction({
  schema: z.strictObject({ restaurantId, ...categoryValues }),
  authorize: () => {},
  handler: (user, input) => createCategory(user, input),
});

export const renameCategoryAction = secureAction({
  schema: z.strictObject({ restaurantId, categoryId, ...categoryValues }),
  authorize: () => {},
  handler: (user, input) => renameCategory(user, input),
});

export const deleteCategoryAction = secureAction({
  schema: z.strictObject({ restaurantId, categoryId }),
  authorize: () => {},
  handler: (user, input) => deleteCategory(user, input),
});

export const moveCategoryAction = secureAction({
  schema: z.strictObject({ restaurantId, categoryId, direction }),
  authorize: () => {},
  handler: (user, input) => moveCategory(user, input),
});

export const createItemAction = secureAction({
  schema: z.strictObject({ restaurantId, categoryId, ...itemValues }),
  authorize: () => {},
  handler: (user, input) => createItem(user, input),
});

export const updateItemAction = secureAction({
  schema: z.strictObject({ restaurantId, itemId, ...itemValues }),
  authorize: () => {},
  handler: (user, input) => updateItem(user, input),
});

export const setItemAvailabilityAction = secureAction({
  schema: z.strictObject({ restaurantId, itemId, isAvailable: z.boolean() }),
  authorize: () => {},
  handler: (user, input) => setItemAvailability(user, input),
});

export const deleteItemAction = secureAction({
  schema: z.strictObject({ restaurantId, itemId }),
  authorize: () => {},
  handler: (user, input) => deleteItem(user, input),
});

export const moveItemAction = secureAction({
  schema: z.strictObject({ restaurantId, itemId, direction }),
  authorize: () => {},
  handler: (user, input) => moveItem(user, input),
});
