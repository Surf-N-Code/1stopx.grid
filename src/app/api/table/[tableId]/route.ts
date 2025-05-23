import { NextRequest, NextResponse } from 'next/server';
import { db, columns, cells } from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const { tableId } = await params;
    const tableIdNumber = Number(tableId);
    // 1. Fetch columns for the table, ordered by id (or add an order field if available)
    const columnList = await db
      .select({ id: columns.id, heading: columns.heading })
      .from(columns)
      .where(eq(columns.tableId, tableIdNumber));
    if (!columnList.length) {
      return NextResponse.json({ error: 'No columns found for table' }, { status: 404 });
    }
    // 2. Fetch all cells for the table's columns
    const columnIds = columnList.map((col) => col.id);
    const cellList = await db
      .select({ columnId: cells.columnId, rowIndex: cells.rowIndex, value: cells.value })
      .from(cells)
      .where(inArray(cells.columnId, columnIds));
    // 3. Group cells by rowIndex and order by column order
    const rows: string[][] = [];
    const colIdToIndex = Object.fromEntries(columnList.map((col, idx) => [col.id, idx]));
    for (const cell of cellList) {
      if (!rows[cell.rowIndex]) rows[cell.rowIndex] = Array(columnList.length).fill('');
      rows[cell.rowIndex][colIdToIndex[cell.columnId]] = cell.value ?? '';
    }
    return NextResponse.json({ columns: columnList, rows });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });
  }
} 