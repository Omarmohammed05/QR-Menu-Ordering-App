ALTER TABLE "menu_items" ADD COLUMN "image_urls" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
-- Existing dishes: the cover image becomes the gallery's first entry.
UPDATE "menu_items" SET "image_urls" = ARRAY["image_url"] WHERE "image_url" IS NOT NULL;
