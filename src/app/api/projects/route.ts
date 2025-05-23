import { NextResponse } from 'next/server';
import { db, projects } from '@/server/db/schema';

export async function GET() {
  try {
    const projectList = await db
      .select({
        id: projects.id,
        name: projects.name,
      })
      .from(projects)
      .orderBy(projects.name);

    return NextResponse.json(projectList);
  } catch (e) {
    console.error('Failed to fetch projects:', e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
} 