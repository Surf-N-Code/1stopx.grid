ALTER TABLE "columns" ADD COLUMN "is_management" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cells" DROP COLUMN "is_management";