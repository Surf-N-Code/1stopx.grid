DO $$ BEGIN
    CREATE TYPE "data_type" AS ENUM('text', 'number', 'email', 'url', 'boolean');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 