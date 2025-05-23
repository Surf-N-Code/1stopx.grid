import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { jobs } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = await params;
    const jobIdNumber = Number(jobId);

    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobIdNumber));

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
} 