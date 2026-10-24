ALTER TABLE "restaurants" ADD COLUMN "previous_slugs" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD COLUMN "image_url" text;