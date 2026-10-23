import { ActionError } from "@/server/actions/secure";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";
import { requirePermission, type MenuUser } from "@/server/services/menu";

/**
 * Owner-editable restaurant settings. An empty string clears the number;
 * any other value must normalize to a valid international number.
 */
export async function updateWhatsAppNumber(
  user: MenuUser,
  input: { restaurantId: string; whatsappNumber: string },
): Promise<{ whatsappNumber: string | null }> {
  await requirePermission(user, input.restaurantId, "restaurant.edit");
  const trimmed = input.whatsappNumber.trim();
  if (trimmed === "") {
    await createRestaurantRepo(input.restaurantId).settings.update({ whatsappNumber: null });
    return { whatsappNumber: null };
  }
  const normalized = normalizeWhatsAppNumber(trimmed);
  if (!normalized) {
    throw new ActionError("INVALID_PHONE");
  }
  await createRestaurantRepo(input.restaurantId).settings.update({ whatsappNumber: normalized });
  return { whatsappNumber: normalized };
}
