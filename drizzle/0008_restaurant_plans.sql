CREATE TYPE "restaurant_plan" AS ENUM('basic', 'pro', 'chain');--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "plan" "restaurant_plan" DEFAULT 'pro' NOT NULL;--> statement-breakpoint
