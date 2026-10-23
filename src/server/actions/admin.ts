"use server";

import { z } from "zod";
import { createRestaurantWithOwnerInvite } from "@/server/services/restaurants";
import { ActionError, secureAction } from "./secure";

const createRestaurantSchema = z.strictObject({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().max(80).optional(),
  slug: z.string().trim().min(3).max(32),
  ownerEmail: z.email(),
});

export const createRestaurantAction = secureAction({
  schema: createRestaurantSchema,
  authorize: (user) => {
    if (!user.superAdmin || !user.twoFactorEnabled) {
      throw new ActionError("FORBIDDEN");
    }
  },
  handler: async (_user, input) =>
    createRestaurantWithOwnerInvite({
      nameAr: input.nameAr,
      nameEn: input.nameEn || undefined,
      slug: input.slug,
      ownerEmail: input.ownerEmail,
    }),
});
