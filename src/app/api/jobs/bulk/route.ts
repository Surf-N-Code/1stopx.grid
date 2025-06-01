import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { bulkJobs, bulkJobCells, cells, columns } from '@/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { sendEmailNotification } from '@/lib/utils/email';
import { isInManagement } from '@/columnScripts/management-detection';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getColumnScriptById } from '@/lib/utils/column-scripts';

interface RequiredField {
  field: string;
  description: string;
}

interface CellToProcess {
  cellId: number;
  prompt: string;
  rowDataForIsManagementCheck: string;
  rowData: Record<string, string>;
}

// Extend the column type to include scriptRequiredFields
type ColumnWithScript = typeof columns.$inferSelect & {
  scriptRequiredFields?: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cellsToProcess,
      columnId,
      isManagementPrompt,
      useWebSearch,
      userEmail,
    } = body;

    if (!cellsToProcess?.length || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a bulk job
    const [bulkJob] = await db
      .insert(bulkJobs)
      .values({
        columnId,
        status: 'pending',
        totalCells: cellsToProcess.length,
        processedCells: 0,
        successfulCells: 0,
        failedCells: 0,
      })
      .returning();

    // Create bulk job cells
    await db.insert(bulkJobCells).values(
      cellsToProcess.map(
        ({ cellId, prompt, rowDataForIsManagementCheck }: CellToProcess) => ({
          bulkJobId: bulkJob.id,
          cellId,
          status: 'pending',
        })
      )
    );

    // Send initial email notification
    await sendEmailNotification(
      userEmail,
      'Bulk AI Processing Started',
      `Your bulk AI processing job has started. ${cellsToProcess.length} cells will be processed.`,
      `
        <h2>Bulk AI Processing Started</h2>
        <p>Your bulk AI processing job has started.</p>
        <p>Number of cells to process: ${cellsToProcess.length}</p>
        <p>You will receive another email when the processing is complete.</p>
      `
    );

    // Process jobs in the background
    processBulkJob(
      bulkJob.id,
      columnId,
      cellsToProcess,
      userEmail,
      isManagementPrompt,
      useWebSearch
    );

    return NextResponse.json({
      message: 'Bulk processing started',
      jobId: bulkJob.id,
      totalCells: cellsToProcess.length,
    });
  } catch (error) {
    console.error('Error starting bulk processing:', error);
    return NextResponse.json(
      { error: 'Failed to start bulk processing' },
      { status: 500 }
    );
  }
}

async function processBulkJob(
  bulkJobId: number,
  columnId: number,
  cellsToProcess: CellToProcess[],
  userEmail: string,
  isManagementPrompt: boolean,
  useWebSearch: boolean
) {
  try {
    // Get column information
    const [column] = await db
      .select()
      .from(columns)
      .where(eq(columns.id, columnId));

    if (!column) {
      throw new Error('Column not found');
    }

    // Cast column to include scriptRequiredFields
    const columnWithScript = column as ColumnWithScript;

    const results = await Promise.all(
      cellsToProcess.map(
        async ({ cellId, prompt, rowDataForIsManagementCheck, rowData }) => {
          try {
            // Get the cell data
            const [cell] = await db
              .select()
              .from(cells)
              .where(eq(cells.id, cellId));

            if (!cell) {
              throw new Error(`Cell ${cellId} not found`);
            }

            // Process the cell
            let result = '';

            // If column has a script to execute
            if (columnWithScript.scriptToPopulate) {
              const script = getColumnScriptById(
                columnWithScript.scriptToPopulate
              );
              if (!script) {
                throw new Error(
                  `Script ${columnWithScript.scriptToPopulate} not found`
                );
              }

              // Parse required fields from JSON
              let requiredFields: RequiredField[] = [];
              if (columnWithScript.scriptRequiredFields) {
                try {
                  requiredFields = JSON.parse(
                    columnWithScript.scriptRequiredFields
                  );
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
            } else if (isManagementPrompt) {
              result = isInManagement(rowDataForIsManagementCheck)
                ? 'true'
                : 'false';
            } else {
              // Use OpenAI or Claude based on useWebSearch
              if (useWebSearch) {
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
                  response.content[0].type === 'text'
                    ? response.content[0].text
                    : '';
              } else {
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

            // Update cell
            await db
              .update(cells)
              .set({
                value: result,
                updatedAt: new Date(),
              })
              .where(eq(cells.id, cellId));

            // Update bulk job cell
            await db
              .update(bulkJobCells)
              .set({
                status: 'completed',
                result,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(bulkJobCells.cellId, cellId),
                  eq(bulkJobCells.bulkJobId, bulkJobId)
                )
              );

            // Update bulk job progress
            await db
              .update(bulkJobs)
              .set({
                processedCells: sql`processed_cells + 1`,
                successfulCells: sql`successful_cells + 1`,
                updatedAt: new Date(),
              })
              .where(eq(bulkJobs.id, bulkJobId));

            return { success: true, cellId };
          } catch (error) {
            // Update bulk job cell with error
            await db
              .update(bulkJobCells)
              .set({
                status: 'failed',
                error:
                  error instanceof Error ? error.message : 'Processing failed',
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(bulkJobCells.cellId, cellId),
                  eq(bulkJobCells.bulkJobId, bulkJobId)
                )
              );

            // Update bulk job progress
            await db
              .update(bulkJobs)
              .set({
                processedCells: sql`processed_cells + 1`,
                failedCells: sql`failed_cells + 1`,
                updatedAt: new Date(),
              })
              .where(eq(bulkJobs.id, bulkJobId));

            return { success: false, cellId, error };
          }
        }
      )
    );

    // Get final job status
    const [bulkJob] = await db
      .select()
      .from(bulkJobs)
      .where(eq(bulkJobs.id, bulkJobId));

    // Update bulk job status
    await db
      .update(bulkJobs)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(bulkJobs.id, bulkJobId));

    console.log('bulkJob completed', bulkJob);
    // Send completion email
    try {
      await sendEmailNotification(
        userEmail,
        'Bulk AI Processing Complete',
        `Your bulk AI processing job has completed. ${bulkJob.successfulCells} cells were processed successfully, ${bulkJob.failedCells} failed.`,
        `
          <h2>Bulk AI Processing Complete</h2>
          <p>Your bulk AI processing job has completed.</p>
          <p>Successfully processed: ${bulkJob.successfulCells} cells</p>
          <p>Failed: ${bulkJob.failedCells} cells</p>
          <p>You can view the results in the application.</p>
        `
      );
    } catch (error) {
      console.error('Error sending completion email:', error);
    }
  } catch (error) {
    console.error('Error in background processing:', error);

    // Update bulk job with error
    await db
      .update(bulkJobs)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Processing failed',
        updatedAt: new Date(),
      })
      .where(eq(bulkJobs.id, bulkJobId));

    // Send error email
    await sendEmailNotification(
      userEmail,
      'Bulk AI Processing Error',
      'An error occurred during bulk processing. Please check the application for details.',
      `
        <h2>Bulk AI Processing Error</h2>
        <p>An error occurred during bulk processing.</p>
        <p>Please check the application for details.</p>
      `
    );
  }
}
