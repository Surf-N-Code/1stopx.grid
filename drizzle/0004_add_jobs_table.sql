CREATE TABLE IF NOT EXISTS "jobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "cell_id" integer NOT NULL,
  "prompt" varchar(2048) NOT NULL,
  "result" text,
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "jobs_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "cells"("id") ON DELETE CASCADE ON UPDATE CASCADE
); 