import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { jobs } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = await params;
    const jobIdNumber = Number(jobId);

    // Get all jobs for this cell and order by id desc to get the latest
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobIdNumber))
      .orderBy(desc(jobs.id))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // If this job is not the latest for its cell, get the latest one instead
    if (job.status === 'completed' || job.status === 'failed') {
      const [latestJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.cellId, job.cellId))
        .orderBy(desc(jobs.id))
        .limit(1);

      // If there's a newer job, return that instead
      if (latestJob && latestJob.id > job.id) {
        return NextResponse.json(latestJob);
      }
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