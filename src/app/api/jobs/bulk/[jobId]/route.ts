import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { bulkJobs } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = Number(params.jobId);
  if (!jobId) {
    return NextResponse.json({ error: 'Invalid jobId' }, { status: 400 });
  }

  const [job] = await db.select().from(bulkJobs).where(eq(bulkJobs.id, jobId));
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    totalCells: job.totalCells,
    processedCells: job.processedCells,
    successfulCells: job.successfulCells,
    failedCells: job.failedCells,
    error: job.error || null,
  });
}
