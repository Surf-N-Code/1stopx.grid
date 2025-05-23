import { type Config } from 'drizzle-kit';

import { dbEnv } from '@/server/db-env';

export default {
  schema: './src/server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbEnv.DATABASE_URL,
  },
  tablesFilter: ['grid_ai_*'],
} satisfies Config;
