import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

async function reset() {
  console.log('🗑️  Truncating all tables...');

  try {
    // Drop all tables in a transaction
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
          END LOOP;
        END $$;
      `);
    });

    console.log('✅ All tables truncated successfully');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }

  process.exit(0);
}

reset();
