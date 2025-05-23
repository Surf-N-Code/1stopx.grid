-- Create the source type enum
CREATE TYPE "source_type" AS ENUM ('manual', 'imported');

-- Add source column to columns table with default value 'manual'
ALTER TABLE "columns" ADD COLUMN "source" "source_type" NOT NULL DEFAULT 'manual'; 