import { NextRequest, NextResponse } from 'next/server';
import { db, projects, tables, columns, cells } from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const projectIdNumber = Number(projectId);

    // 1. Get the table ID for the project
    const tableResult = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.projectId, projectIdNumber))
      .limit(1);

    if (!tableResult.length) {
      return NextResponse.json({ error: 'No table found for project' }, { status: 404 });
    }

    const tableId = tableResult[0].id;

    // 2. Fetch columns for the table
    const columnList = await db
      .select({ id: columns.id, heading: columns.heading })
      .from(columns)
      .where(eq(columns.tableId, tableId))
      .orderBy(columns.id);

    if (!columnList.length) {
      return NextResponse.json({ error: 'No columns found for table' }, { status: 404 });
    }

    // 3. Fetch all cells for the table's columns
    const columnIds = columnList.map((col) => col.id);
    const cellList = await db
      .select({ columnId: cells.columnId, rowIndex: cells.rowIndex, value: cells.value })
      .from(cells)
      .where(inArray(cells.columnId, columnIds))
      .orderBy(cells.rowIndex, cells.columnId);

    // 4. Group cells by rowIndex and order by column order
    const rows: string[][] = [];
    const colIdToIndex = Object.fromEntries(columnList.map((col, idx) => [col.id, idx]));

    for (const cell of cellList) {
      if (!rows[cell.rowIndex]) {
        rows[cell.rowIndex] = Array(columnList.length).fill('');
      }
      rows[cell.rowIndex][colIdToIndex[cell.columnId]] = cell.value ?? '';
    }

    return NextResponse.json({ columns: columnList, rows });
  } catch (e) {
    console.error('Failed to fetch table data:', e);
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });
  }
} 