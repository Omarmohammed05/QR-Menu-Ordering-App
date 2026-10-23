import { ActionError } from "@/server/actions/secure";
import { photoUploadError } from "@/lib/photo";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";
import { requirePermission, type MenuUser } from "@/server/services/menu";

export type { MenuUser };

export type PhotoUpload = { url: string };

/** Upload a menu item photo; returns the public URL that the item references. */
export async function uploadPhoto(
  user: MenuUser,
  input: { restaurantId: string; file: File },
): Promise<PhotoUpload> {
  const rejection = photoUploadError(input.file.type, input.file.size);
  if (rejection === "photoInvalidType") {
    throw new ActionError("INVALID_FILE_TYPE");
  }
  if (rejection === "photoTooLarge") {
    throw new ActionError("FILE_TOO_LARGE");
  }
  await requirePermission(user, input.restaurantId, "menu.edit");
  const data = Buffer.from(await input.file.arrayBuffer());
  const repo = createRestaurantRepo(input.restaurantId);
  const [photo] = await repo.photos.create({
    mimeType: input.file.type,
    sizeBytes: data.byteLength,
    data,
  });
  return { url: `/api/photos/${photo.id}` };
}
