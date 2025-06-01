ALTER TABLE "bulk_job_cells" DROP CONSTRAINT "bulk_job_cells_bulk_job_id_bulk_jobs_id_fk";
--> statement-breakpoint
ALTER TABLE "bulk_job_cells" DROP CONSTRAINT "bulk_job_cells_cell_id_cells_id_fk";
--> statement-breakpoint
ALTER TABLE "bulk_jobs" DROP CONSTRAINT "bulk_jobs_column_id_columns_id_fk";
--> statement-breakpoint
ALTER TABLE "cells" DROP CONSTRAINT "cells_column_id_columns_id_fk";
--> statement-breakpoint
ALTER TABLE "columns" DROP CONSTRAINT "columns_table_id_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "columns" DROP CONSTRAINT "columns_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_cell_id_cells_id_fk";
--> statement-breakpoint
ALTER TABLE "tables" DROP CONSTRAINT "tables_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "cells" ALTER COLUMN "value" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bulk_job_cells" ADD CONSTRAINT "bulk_job_cells_bulk_job_id_bulk_jobs_id_fk" FOREIGN KEY ("bulk_job_id") REFERENCES "public"."bulk_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_job_cells" ADD CONSTRAINT "bulk_job_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;