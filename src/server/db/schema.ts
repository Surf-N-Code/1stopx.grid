import { pgTable, serial, varchar, timestamp, integer, boolean, pgEnum, uniqueIndex, pgSchema } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Enum for column data types
export const dataTypeEnum = pgEnum('data_type', ['number', 'text', 'email', 'url']);

// Projects table (each project has one table)
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tables table (1:1 with projects)
export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().unique().references(() => projects.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Columns table
export const columns = pgTable('columns', {
  id: serial('id').primaryKey(),
  tableId: integer('table_id').notNull().references(() => tables.id),
  heading: varchar('heading', { length: 255 }).notNull(),
  dataType: dataTypeEnum('data_type').notNull(),
  aiPrompt: varchar('ai_prompt', { length: 1024 }), // optional
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cells table
export const cells = pgTable('cells', {
  id: serial('id').primaryKey(),
  columnId: integer('column_id').notNull().references(() => columns.id),
  rowIndex: integer('row_index').notNull(),
  value: varchar('value', { length: 2048 }),
  isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Drizzle connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool); 