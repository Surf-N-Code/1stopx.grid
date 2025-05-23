import { db, projects, tables, columns, cells } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

async function truncateTables() {
  try {
    console.log('Starting database truncation...');

    // Disable foreign key checks temporarily
    await db.execute(sql`SET session_replication_role = 'replica';`);

    // Truncate tables in reverse order of dependencies
    await db.delete(cells);
    console.log('✓ Truncated cells table');

    await db.delete(columns);
    console.log('✓ Truncated columns table');

    await db.delete(tables);
    console.log('✓ Truncated tables table');

    await db.delete(projects);
    console.log('✓ Truncated projects table');

    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin';`);

    console.log('Database truncation completed successfully!');
  } catch (error) {
    console.error('Error truncating database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

truncateTables(); 