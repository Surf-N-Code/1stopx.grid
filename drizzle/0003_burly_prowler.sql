ALTER TABLE "columns" ADD COLUMN "project_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "columns" ADD COLUMN "column_id" varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;