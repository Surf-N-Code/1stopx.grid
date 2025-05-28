import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { columns, cells, tables } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { columnId, targetProjectId, targetTableId } = await req.json();

    // Fetch the source column
    const sourceColumn = await db
      .select()
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);

    if (!sourceColumn.length) {
      return NextResponse.json(
        { error: 'Source column not found' },
        { status: 404 }
      );
    }

    // Create a new column in the target project
    const [newColumn] = await db
      .insert(columns)
      .values({
        heading: sourceColumn[0].heading,
        dataType: sourceColumn[0].dataType,
        aiPrompt: sourceColumn[0].aiPrompt,
        useWebSearch: sourceColumn[0].useWebSearch,
        source: 'manual',
        projectId: targetProjectId,
        tableId: targetTableId,
        columnId: `${sourceColumn[0].heading}_${Date.now()}`, // Ensure unique columnId
      })
      .returning();

    // Find the highest rowIndex in any column of the target table
    const result = await db
      .select({
        maxRowIndex: sql<number>`MAX(${cells.rowIndex})`,
      })
      .from(cells)
      .innerJoin(columns, eq(columns.id, cells.columnId))
      .where(eq(columns.tableId, targetTableId));

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
    console.error('Failed to copy column:', error);
    return NextResponse.json(
      { error: 'Failed to copy column' },
      { status: 500 }
    );
  }
}
