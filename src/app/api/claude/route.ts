import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Token costs per 1M tokens (as of March 2024)
const TOKEN_COSTS = {
  'claude-3-7-sonnet-latest': {
    input: 3, // $3 per 1M input tokens
    output: 15, // $15 per 1M output tokens
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, startupList } = body;

    if (!prompt || !startupList) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Replace the placeholder in the prompt with the actual startup list
    const processedPrompt = prompt.replace('{{STARTUP_LIST}}', startupList);

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: processedPrompt
        }
      ],
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5
      }]
    });

    // Calculate token usage and costs
    const model = "claude-3-7-sonnet-latest";
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    
    const inputCost = (inputTokens / 1_000_000) * TOKEN_COSTS[model].input;
    const outputCost = (outputTokens / 1_000_000) * TOKEN_COSTS[model].output;
    const totalCost = inputCost + outputCost;

    return NextResponse.json({
      ...response,
      usage: {
        ...response.usage,
        inputCost,
        outputCost,
        totalCost,
      }
    });
  } catch (error) {
    console.error('Error processing Claude request:', error);
    return NextResponse.json(
      { error: 'Failed to process Claude request' },
      { status: 500 }
    );
  }
} 