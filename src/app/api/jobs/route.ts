import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { jobs, cells } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cellId, prompt } = body;

    if (!cellId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a new job
    const [job] = await db
      .insert(jobs)
      .values({
        cellId,
        prompt,
        status: 'pending',
      })
      .returning();

    try {
      // Process with AI
      console.log('Processing with AI:', { prompt, cellId });
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides concise, direct answers.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "gpt-4o-mini",
      });

      const result = completion.choices[0]?.message?.content || '';
      console.log('result', result);

      // Update the job with the result
      const [updatedJob] = await db
        .update(jobs)
        .set({
          status: 'completed',
          result,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id))
        .returning();

      // Update the cell with the AI-generated value
      await db
        .update(cells)
        .set({
          value: result,
          isAiGenerated: true,
          updatedAt: new Date(),
        })
        .where(eq(cells.id, cellId));

      return NextResponse.json(updatedJob);
    } catch (aiError) {
      // Update job with error
      const [failedJob] = await db
        .update(jobs)
        .set({
          status: 'failed',
          error: aiError instanceof Error ? aiError.message : 'AI processing failed',
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id))
        .returning();

      throw aiError;
    }
  } catch (error) {
    console.error('Error processing job:', error);
    return NextResponse.json(
      { error: 'Failed to process job' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cellId = searchParams.get('cellId');

    if (!cellId) {
      return NextResponse.json(
        { error: 'Missing cellId parameter' },
        { status: 400 }
      );
    }

    const jobsList = await db
      .select()
      .from(jobs)
      .where(eq(jobs.cellId, parseInt(cellId)))
      .orderBy(jobs.createdAt);

    return NextResponse.json(jobsList);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 