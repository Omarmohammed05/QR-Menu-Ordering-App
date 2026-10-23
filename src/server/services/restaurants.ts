import { validateSlug } from "@/lib/slug";
import { createRestaurant, restaurantSlugExists } from "@/server/repos/restaurants";
import { createInvitation } from "@/server/services/invitations";

export type CreateRestaurantResult =
  | { ok: true; restaurantId: string; inviteToken: string }
  | { ok: false; code: "slug_invalid" | "slug_taken" };

/** Platform admin: creates a restaurant plus its first-owner invitation. */
export async function createRestaurantWithOwnerInvite(input: {
  nameAr: string;
  nameEn?: string;
  slug: string;
  ownerEmail: string;
}): Promise<CreateRestaurantResult> {
  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.ok) {
    return { ok: false, code: "slug_invalid" };
  }
  if (await restaurantSlugExists(slugCheck.slug)) {
    return { ok: false, code: "slug_taken" };
  }

  const restaurant = await createRestaurant({
    slug: slugCheck.slug,
    name: { ar: input.nameAr.trim(), ...(input.nameEn ? { en: input.nameEn.trim() } : {}) },
  });

  const inviteToken = await createInvitation({
    restaurantId: restaurant.id,
    email: input.ownerEmail.trim().toLowerCase(),
    role: "owner",
  });

  return { ok: true, restaurantId: restaurant.id, inviteToken };
}
