CREATE TYPE "public"."source_type" AS ENUM('manual', 'imported');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cell_id" integer NOT NULL,
	"prompt" varchar(2048) NOT NULL,
	"result" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "columns" ADD COLUMN "source" "source_type" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE no action ON UPDATE no action;