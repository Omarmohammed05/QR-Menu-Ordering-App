CREATE TYPE "public"."payment_method" AS ENUM('cash', 'instapay');--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "instapay_handle" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'cash' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_proof_url" text;