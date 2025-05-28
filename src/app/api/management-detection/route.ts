import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { columns } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, columnId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt parameter' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that determines if a prompt is specifically designed to detect management positions in job titles.
Consider the following criteria:
1. The prompt should be focused on identifying management roles
2. It should look for executive titles, leadership positions, or management roles
3. It should return a boolean result (true/false)
4. It should not be a general prompt about job titles or roles

Respond with only "true" if the prompt is specifically for management detection, or "false" if it's not.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4.1",
    });

    const result = completion.choices[0]?.message?.content?.toLowerCase().trim();
    const isManagementDetection = result === "true";

    // If columnId is provided, update the column's isManagement flag
    if (columnId) {
      await db
        .update(columns)
        .set({
          isManagement: isManagementDetection,
          updatedAt: new Date(),
        })
        .where(eq(columns.id, columnId));
    }

    return NextResponse.json({ isManagementDetection });
  } catch (error) {
    console.error('Error detecting management prompt:', error);
    return NextResponse.json(
      { error: 'Failed to process management detection' },
      { status: 500 }
    );
  }
} 