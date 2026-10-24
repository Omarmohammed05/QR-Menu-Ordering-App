CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "order_counter" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "public_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "idempotency_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "locale" text DEFAULT 'ar' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "status_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
--> Backfill existing rows before the unique constraints below are applied:
--> sequential numbers by arrival order per tenant, unguessable public ids,
--> unique idempotency keys, and counters resuming from the highest number.
--> statement-breakpoint
WITH "numbered" AS (
	SELECT "id", row_number() OVER (PARTITION BY "restaurant_id" ORDER BY "created_at", "id") AS "rn"
	FROM "orders"
)
UPDATE "orders" SET "number" = "numbered"."rn" FROM "numbered" WHERE "orders"."id" = "numbered"."id";--> statement-breakpoint
UPDATE "orders" SET "public_id" = replace(gen_random_uuid()::text, '-', '') WHERE "public_id" = '';--> statement-breakpoint
UPDATE "orders" SET "idempotency_key" = "id"::text WHERE "idempotency_key" = '';--> statement-breakpoint
UPDATE "restaurants" SET "order_counter" = COALESCE((SELECT MAX("number") FROM "orders" WHERE "orders"."restaurant_id" = "restaurants"."id"), 0);--> statement-breakpoint
--> Every pre-existing order gets its creation event so no timeline is empty.
--> statement-breakpoint
INSERT INTO "order_events" ("restaurant_id", "order_id", "from_status", "to_status")
SELECT "restaurant_id", "id", NULL, "status" FROM "orders" "o"
WHERE NOT EXISTS (SELECT 1 FROM "order_events" "e" WHERE "e"."order_id" = "o"."id");--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_fk" FOREIGN KEY ("restaurant_id","order_id") REFERENCES "public"."orders"("restaurant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("restaurant_id","order_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_number_unique" UNIQUE("restaurant_id","number");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_idempotency_unique" UNIQUE("restaurant_id","idempotency_key");