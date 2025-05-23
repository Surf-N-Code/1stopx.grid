ALTER TABLE "columns" ALTER COLUMN "data_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "columns" ALTER COLUMN "data_type" SET DEFAULT 'text'::text;--> statement-breakpoint
DROP TYPE "public"."data_type";--> statement-breakpoint
CREATE TYPE "public"."data_type" AS ENUM('text', 'number', 'email', 'url', 'boolean');--> statement-breakpoint
ALTER TABLE "columns" ALTER COLUMN "data_type" SET DEFAULT 'text'::"public"."data_type";--> statement-breakpoint
ALTER TABLE "columns" ALTER COLUMN "data_type" SET DATA TYPE "public"."data_type" USING "data_type"::"public"."data_type";