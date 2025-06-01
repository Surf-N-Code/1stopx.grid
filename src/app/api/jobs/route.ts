import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { jobs, cells, columns } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { isInManagement } from '@/columnScripts/management-detection';
import { getColumnScriptById } from '@/lib/utils/column-scripts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extend the column type to include scriptRequiredFields
type ColumnWithScript = typeof columns.$inferSelect & {
  scriptRequiredFields?: string;
};

interface RequiredField {
  field: string;
  description: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cellId,
      columnId,
      prompt,
      isManagementDetection,
      useWebSearch,
      rowDataForIsManagementCheck,
      rowData,
    } = body;

    if (!cellId || !prompt || !columnId) {
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
      let result = '';

      // Fetch column information
      const [column] = await db
        .select()
        .from(columns)
        .where(eq(columns.id, parseInt(columnId)));

      if (!column) {
        throw new Error('Column not found');
      }

      // Cast column to include scriptRequiredFields
      const columnWithScript = column as ColumnWithScript;

      // If column has a script to execute
      if (columnWithScript.scriptToPopulate) {
        const script = getColumnScriptById(columnWithScript.scriptToPopulate);
        if (!script) {
          throw new Error(
            `Script ${columnWithScript.scriptToPopulate} not found`
          );
        }

        // Parse required fields from JSON
        let requiredFields: RequiredField[] = [];
        if (columnWithScript.scriptRequiredFields) {
          try {
            requiredFields = JSON.parse(columnWithScript.scriptRequiredFields);
          } catch (error) {
            console.error('Error parsing script required fields:', error);
            throw new Error('Invalid script required fields format');
          }
        }

        // Get values from required fields
        const inputValues = requiredFields.map(({ field }) => {
          const value = rowData[field.toLowerCase()];
          return value || '';
        });

        // Join values with spaces, or use the column's own value if no required fields
        const inputValue =
          inputValues.length > 0
            ? inputValues.join(' ')
            : rowData[columnWithScript.heading.toLowerCase()] || '';

        result = await script.execute(inputValue, rowData);
      } else if (isManagementDetection) {
        // Execute management detection script
        result = isInManagement(rowDataForIsManagementCheck) ? 'true' : 'false';
      } else {
        // Process with AI
        console.log('Processing with AI:', { prompt, cellId, useWebSearch });

        if (useWebSearch) {
          // Use Claude with web search
          const response = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-latest',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            tools: [
              {
                type: 'web_search_20250305',
                name: 'web_search',
                max_uses: 5,
              },
            ],
          });
          result =
            response.content[0].type === 'text' ? response.content[0].text : '';
        } else {
          // Use OpenAI
          const completion = await openai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful assistant that provides concise, direct answers.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            model: 'gpt-4.1',
          });
          result = completion.choices[0]?.message?.content || '';
        }
      }

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

      // Update the cell with the AI-generated value and management status
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
          error:
            aiError instanceof Error ? aiError.message : 'AI processing failed',
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
