import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tables, columns, cells } from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

type DataType = 'text' | 'number' | 'email' | 'url' | 'boolean';

export async function GET(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const { tableId } = await params;
    const tableIdNumber = Number(tableId);

    // Check if this is a project ID lookup
    const searchParams = req.nextUrl.searchParams;
    const isProjectId = searchParams.get('isProjectId') === 'true';

    let finalTableId = tableIdNumber;

    if (isProjectId) {
      // If this is a project ID, get the corresponding table ID
      const tableResult = await db
        .select({ id: tables.id })
        .from(tables)
        .where(eq(tables.projectId, tableIdNumber))
        .limit(1);

      if (!tableResult.length) {
        return NextResponse.json(
          { error: 'No table found for project' },
          { status: 404 }
        );
      }

      finalTableId = tableResult[0].id;
    }

    // Fetch columns for the table
    const columnList = await db
      .select({
        id: columns.id,
        heading: columns.heading,
        dataType: columns.dataType,
        aiPrompt: columns.aiPrompt,
        useWebSearch: columns.useWebSearch,
      })
      .from(columns)
      .where(eq(columns.tableId, finalTableId))
      .orderBy(columns.id);

    if (!columnList.length) {
      return NextResponse.json(
        { error: 'No columns found for table' },
        { status: 404 }
      );
    }

    // Ensure all columns have a valid dataType
    const validatedColumns = columnList.map(col => ({
      ...col,
      dataType: (col.dataType || 'text') as DataType
    }));

    // Fetch all cells for the table's columns
    const columnIds = validatedColumns.map((col) => col.id);
    const cellList = await db
      .select({
        id: cells.id,
        columnId: cells.columnId,
        rowIndex: cells.rowIndex,
        value: cells.value,
      })
      .from(cells)
      .where(inArray(cells.columnId, columnIds))
      .orderBy(cells.rowIndex, cells.columnId);

    // Group cells by rowIndex and order by column order
    const rows: string[][] = [];
    const cellIds: number[][] = [];
    const colIdToIndex = Object.fromEntries(validatedColumns.map((col, idx) => [col.id, idx]));

    // Initialize arrays with empty values
    const maxRowIndex = Math.max(...cellList.map(cell => cell.rowIndex), -1);
    for (let i = 0; i <= maxRowIndex; i++) {
      rows[i] = Array(validatedColumns.length).fill('');
      cellIds[i] = Array(validatedColumns.length).fill(null);
    }

    // Fill in the values and cell IDs
    for (const cell of cellList) {
      const colIndex = colIdToIndex[cell.columnId];
      
      if (colIndex !== undefined) {
        rows[cell.rowIndex][colIndex] = cell.value ?? '';
        cellIds[cell.rowIndex][colIndex] = cell.id;
      }
    }

    return NextResponse.json({ columns: validatedColumns, rows, cellIds });
  } catch (error) {
    console.error('Failed to fetch table data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
} 