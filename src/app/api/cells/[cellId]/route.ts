import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { cells } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: { cellId: string } }
) {
  try {
    const { cellId } = params;
    const body = await request.json();
    const { value } = body;

    if (value === undefined) {
      return NextResponse.json(
        { error: 'Missing value field' },
        { status: 400 }
      );
    }

    const [updatedCell] = await db
      .update(cells)
      .set({
        value,
        isAiGenerated: true,
        updatedAt: new Date(),
      })
      .where(eq(cells.id, parseInt(cellId)))
      .returning();

    if (!updatedCell) {
      return NextResponse.json(
        { error: 'Cell not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCell);
  } catch (error) {
    console.error('Error updating cell:', error);
    return NextResponse.json(
      { error: 'Failed to update cell' },
      { status: 500 }
    );
  }
} 