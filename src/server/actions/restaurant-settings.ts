"use server";

import { z } from "zod";
import { secureAction } from "./secure";
import { updateWhatsAppNumber } from "@/server/services/restaurant-settings";

// Per-restaurant authorization (restaurant.edit on the caller's membership)
// happens inside the service, same as the menu actions.

export const updateWhatsAppNumberAction = secureAction({
  schema: z.strictObject({
    restaurantId: z.string().min(1),
    whatsappNumber: z.string().max(20),
  }),
  authorize: () => {},
  handler: (user, input) => updateWhatsAppNumber(user, input),
});
