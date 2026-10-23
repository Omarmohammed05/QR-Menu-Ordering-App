import { describe, expect, it } from "vitest";
import { PHOTO_MAX_BYTES, photoUploadError } from "@/lib/photo";

describe("photoUploadError", () => {
  it("accepts a supported type within the size limit", () => {
    expect(photoUploadError("image/jpeg", 1024)).toBeNull();
    expect(photoUploadError("image/png", PHOTO_MAX_BYTES)).toBeNull();
    expect(photoUploadError("image/webp", 1)).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(photoUploadError("image/gif", 1024)).toBe("photoInvalidType");
    expect(photoUploadError("image/svg+xml", 1024)).toBe("photoInvalidType");
    expect(photoUploadError("", 1024)).toBe("photoInvalidType");
  });

  it("rejects files over the size limit", () => {
    expect(photoUploadError("image/jpeg", PHOTO_MAX_BYTES + 1)).toBe("photoTooLarge");
  });
});
