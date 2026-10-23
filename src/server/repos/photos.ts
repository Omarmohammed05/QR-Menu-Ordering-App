import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { itemPhotos } from "@/server/db/tenant-tables";
import type { ItemPhoto } from "./create-restaurant-repo";

// Platform-level photo lookup (not tenant-scoped). Cross-tenant use is
// restricted to the public photo route (spec 3.2): ids are unguessable cuid2
// and photos are inherently public — the QR menu shows them to anonymous
// customers (ADR-008).

export async function getPhotoById(id: string): Promise<ItemPhoto | null> {
  const [row] = await db.select().from(itemPhotos).where(eq(itemPhotos.id, id)).limit(1);
  return row ?? null;
}
