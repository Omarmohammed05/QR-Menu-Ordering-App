import { getPhotoById } from "@/server/repos/photos";

/**
 * Public item-photo endpoint (ADR-008): photos are shown to anonymous
 * customers on the QR menu, so ids (unguessable cuid2) are public. Bytes are
 * immutable per id — uploads always create a new photo row.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getPhotoById(id);
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
