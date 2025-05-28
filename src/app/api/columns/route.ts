import { NextRequest, NextResponse } from 'next/server';
import { db, columns, cells, tables } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/columns - Add a new column
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, heading, dataType, aiPrompt, source = 'manual', useWebSearch = false } = body;

    if (!tableId || !heading || !dataType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the project ID from the table
    const [table] = await db
      .select({ projectId: tables.projectId })
      .from(tables)
      .where(eq(tables.id, tableId));

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Create the column ID from project ID and lowercase heading
    const columnId = `${table.projectId}_${heading.toLowerCase().replace(/\s+/g, '_')}`;

    // Insert the new column
    const [newColumn] = await db
      .insert(columns)
      .values({
        tableId,
        projectId: table.projectId,
        columnId,
        heading,
        dataType,
        aiPrompt: aiPrompt || null,
        source,
        useWebSearch,
      })
      .returning();

    // Find the highest rowIndex in any column of this table
    const result = await db
      .select({
        maxRowIndex: sql<number>`MAX(${cells.rowIndex})`
      })
      .from(cells)
      .innerJoin(columns, eq(columns.id, cells.columnId))
      .where(eq(columns.tableId, tableId));

    const maxRowIndex = result[0]?.maxRowIndex ?? -1;

    // Create empty cells for each row if there are existing rows
    if (maxRowIndex >= 0) {
      const cellsToInsert = Array.from({ length: maxRowIndex + 1 }, (_, i) => ({
        columnId: newColumn.id,
        rowIndex: i,
        value: '',
        isAiGenerated: false,
      }));

      await db.insert(cells).values(cellsToInsert);
    }

    return NextResponse.json(newColumn);
  } catch (error) {
    console.error('Failed to create column:', error);
    return NextResponse.json(
      { error: 'Failed to create column' },
      { status: 500 }
    );
  }
}