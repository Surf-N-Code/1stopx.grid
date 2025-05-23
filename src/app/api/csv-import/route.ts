import { NextRequest, NextResponse } from 'next/server';
import { db, projects, tables, columns, cells, dataTypeEnum } from '@/server/db/schema';

const BATCH_SIZE = 1000; // Process 1000 cells at a time
const MAX_CELL_LENGTH = 2048; // Maximum length for cell values

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = body;
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    // 1. Create a new project
    const projectRes = await db.insert(projects).values({ name: `CSV Import ${Date.now()}` }).returning({ id: projects.id });
    const projectId = projectRes[0].id;
    // 2. Create a new table for this project
    const tableRes = await db.insert(tables).values({ projectId }).returning({ id: tables.id });
    const tableId = tableRes[0].id;
    // 3. Create columns (all as 'text' type for now)
    const headerRow = data[0];
    const columnRes = await db.insert(columns).values(
      headerRow.map((heading) => ({ tableId, heading, dataType: 'text' as typeof dataTypeEnum.enumValues[0] }))
    ).returning({ id: columns.id });
    const columnIds = columnRes.map((col) => col.id);
    // 4. Create cells in batches
    const cellRows = data.slice(1); // skip header
    const cellInserts = [];
    for (let rowIndex = 0; rowIndex < cellRows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < columnIds.length; colIndex++) {
        const value = cellRows[rowIndex][colIndex] ?? '';
        cellInserts.push({
          columnId: columnIds[colIndex],
          rowIndex,
          value: value.length > MAX_CELL_LENGTH ? value.substring(0, MAX_CELL_LENGTH) : value,
          isAiGenerated: false,
        });
      }
    }
    
    // Process cells in batches
    for (let i = 0; i < cellInserts.length; i += BATCH_SIZE) {
      const batch = cellInserts.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        await db.insert(cells).values(batch);
      }
    }
    
    return NextResponse.json({ success: true, projectId, tableId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 