CREATE TABLE "menu_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"table_id" uuid,
	"menu_item_id" uuid,
	"locale" text DEFAULT 'ar' NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_views" ADD CONSTRAINT "menu_views_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_views" ADD CONSTRAINT "menu_views_table_fk" FOREIGN KEY ("restaurant_id","table_id") REFERENCES "public"."restaurant_tables"("restaurant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_views" ADD CONSTRAINT "menu_views_item_fk" FOREIGN KEY ("restaurant_id","menu_item_id") REFERENCES "public"."menu_items"("restaurant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_views_restaurant_viewed_idx" ON "menu_views" USING btree ("restaurant_id","viewed_at");