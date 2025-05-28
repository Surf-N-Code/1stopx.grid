import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, varchar, timestamp, integer, boolean, pgEnum, text } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

// Enum for column data types
export const dataTypeEnum = pgEnum('data_type', ['text', 'number', 'email', 'url', 'boolean']);
export type DataType = 'text' | 'number' | 'email' | 'url' | 'boolean';

// Enum for column source
export const sourceTypeEnum = pgEnum('source_type', ['manual', 'imported']);
export type SourceType = 'manual' | 'imported';

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
  projectId: integer('project_id').notNull().references(() => projects.id),
  heading: varchar('heading', { length: 255 }).notNull(),
  columnId: varchar('column_id', { length: 512 }).notNull(),
  dataType: dataTypeEnum('data_type').notNull().default('text'),
  aiPrompt: varchar('ai_prompt', { length: 1024 }), // optional
  source: sourceTypeEnum('source').notNull().default('manual'),
  isManagement: boolean('is_management').default(false).notNull(),
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

// Jobs table
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  cellId: integer('cell_id').notNull().references(() => cells.id),
  prompt: varchar('prompt', { length: 2048 }).notNull(),
  result: text('result'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Drizzle connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool); 