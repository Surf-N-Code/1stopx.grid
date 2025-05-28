import { NextRequest, NextResponse } from 'next/server';
import { db, columns, cells } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/columns/:id - Update a column
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { heading, dataType, aiPrompt, source, useWebSearch } = body;
    const columnId = Number(params.id);

    if (!heading || !dataType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current column to get its project ID
    const [currentColumn] = await db
      .select({ projectId: columns.projectId })
      .from(columns)
      .where(eq(columns.id, columnId));

    if (!currentColumn) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    // Create the new column ID from project ID and lowercase heading
    const newColumnId = `${currentColumn.projectId}_${heading.toLowerCase().replace(/\s+/g, '_')}`;

    const [updatedColumn] = await db
      .update(columns)
      .set({
        heading,
        dataType,
        columnId: newColumnId,
        aiPrompt: aiPrompt || null,
        source: source || 'manual',
        useWebSearch: useWebSearch ?? false,
        updatedAt: new Date(),
      })
      .where(eq(columns.id, columnId))
      .returning();

    if (!updatedColumn) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error('Failed to update column:', error);
    return NextResponse.json(
      { error: 'Failed to update column' },
      { status: 500 }
    );
  }
}

// DELETE /api/columns/:id - Delete a column
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const columnId = Number(params.id);

    // First delete all cells in this column
    await db.delete(cells).where(eq(cells.columnId, columnId));

    // Then delete the column
    const [deletedColumn] = await db
      .delete(columns)
      .where(eq(columns.id, columnId))
      .returning();

    if (!deletedColumn) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedColumn);
  } catch (error) {
    console.error('Failed to delete column:', error);
    return NextResponse.json(
      { error: 'Failed to delete column' },
      { status: 500 }
    );
  }
} 