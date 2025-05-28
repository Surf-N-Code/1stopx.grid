CREATE TABLE "bulk_job_cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"bulk_job_id" integer NOT NULL,
	"cell_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"result" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulk_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"column_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"total_cells" integer NOT NULL,
	"processed_cells" integer DEFAULT 0 NOT NULL,
	"successful_cells" integer DEFAULT 0 NOT NULL,
	"failed_cells" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bulk_job_cells" ADD CONSTRAINT "bulk_job_cells_bulk_job_id_bulk_jobs_id_fk" FOREIGN KEY ("bulk_job_id") REFERENCES "public"."bulk_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_job_cells" ADD CONSTRAINT "bulk_job_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE no action ON UPDATE no action;