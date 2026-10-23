export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Menu-namespace message key for a rejected upload, or null when acceptable. */
export function photoUploadError(
  mimeType: string,
  sizeBytes: number,
): "photoInvalidType" | "photoTooLarge" | null {
  if (!PHOTO_MIME_TYPES.includes(mimeType as (typeof PHOTO_MIME_TYPES)[number])) {
    return "photoInvalidType";
  }
  if (sizeBytes > PHOTO_MAX_BYTES) {
    return "photoTooLarge";
  }
  return null;
}
