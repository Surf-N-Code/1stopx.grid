import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { columns } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

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
        tableId: targetTableId, // This will be updated by the table component
        columnId: `${sourceColumn[0].heading}_${Date.now()}`, // Ensure unique columnId
      })
      .returning();

    return NextResponse.json(newColumn);
  } catch (error) {
    console.error('Failed to copy column:', error);
    return NextResponse.json(
      { error: 'Failed to copy column' },
      { status: 500 }
    );
  }
}
