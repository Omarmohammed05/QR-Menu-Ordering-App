"use server";

import { z } from "zod";
import { secureAction } from "./secure";
import { uploadPhoto } from "@/server/services/photos";

// Per-restaurant authorization (menu.edit on the caller's membership) happens
// inside the service, like the menu actions — the restaurantId arrives as
// validated input the authorize hook cannot see.

export const uploadPhotoAction = secureAction({
  schema: z.strictObject({
    restaurantId: z.string().min(1),
    file: z.instanceof(File),
  }),
  authorize: () => {},
  handler: (user, input) => uploadPhoto(user, input),
});
