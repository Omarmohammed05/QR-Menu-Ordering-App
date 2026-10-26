CREATE TABLE "subscription_durations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"months" integer NOT NULL,
	"discount_percent" smallint DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_durations_months_unique" UNIQUE("months"),
	CONSTRAINT "subscription_durations_months_check" check ("months" between 1 and 60),
	CONSTRAINT "subscription_durations_discount_check" check ("discount_percent" between 0 and 90)
);
--> statement-breakpoint
INSERT INTO "subscription_durations" ("months", "discount_percent") VALUES (1, 0), (3, 5), (6, 10), (12, 20);