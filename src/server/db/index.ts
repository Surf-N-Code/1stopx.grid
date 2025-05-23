import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/server/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = drizzle(pool, { schema }); 