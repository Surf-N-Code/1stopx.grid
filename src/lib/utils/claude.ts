interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

interface StartupAnalysis {
  startup_name: string;
  summary: string;
  meets_criteria: string;
}

interface ClaudeResponse {
  content: string;
  usage: TokenUsage;
  recommended_startups: string[];
  analyses: StartupAnalysis[];
}

export async function analyzeStartups(startupList: string): Promise<ClaudeResponse> {
  const prompt = `You are tasked with evaluating a list of startups to determine their size, popularity, and potential interest for investment. Your goal is to identify smaller startups that are not yet well-known but have already started generating revenue. Here's what you need to do:

First, you will be presented with a list of startups:

<startup_list>
{{STARTUP_LIST}}
</startup_list>

For each startup in the list, you should evaluate the following criteria:

1. Size: Focus on smaller startups, typically those with fewer than 50 employees.
2. Funding: Prioritize startups that have not gone through multiple funding rounds. Early-stage startups (seed, pre-seed, or Series A) are of most interest.
3. Revenue: Look for startups that have already started generating revenue, even if it's modest.
4. Popularity: Seek out startups that are not yet widely known or recognized in their industry.

For each startup, follow these steps:

1. Research the startup using publicly available information.
2. Assess the startup based on the criteria mentioned above.
3. Provide a brief summary of your findings.
4. Determine if the startup meets the desired profile (small, revenue-generating, not widely known, early-stage funding).

Present your analysis for each startup in the following format:

<startup_analysis>
<startup_name>[Name of the startup]</startup_name>
<summary>[Brief summary of your findings, including size, funding status, revenue information, and current popularity]</summary>
<meets_criteria>[Yes/No] - [Brief explanation why]</meets_criteria>
</startup_analysis>

After analyzing all startups, provide a final list of those that meet the desired criteria:

<recommended_startups>
[List the names of startups that meet the criteria]
</recommended_startups>

Remember to be thorough in your research and accurate in your assessments. If you cannot find reliable information about a particular startup, indicate this in your analysis.`;

  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        startupList,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze startups');
    }

    const data = await response.json();
    
    // Parse the response content to extract structured data
    const content = data.content[0].text;
    
    // Extract startup analyses
    const analyses: StartupAnalysis[] = [];
    const analysisRegex = /<startup_analysis>([\s\S]*?)<\/startup_analysis>/g;
    let match;
    
    while ((match = analysisRegex.exec(content)) !== null) {
      const analysis = match[1];
      const nameMatch = analysis.match(/<startup_name>(.*?)<\/startup_name>/);
      const summaryMatch = analysis.match(/<summary>(.*?)<\/summary>/);
      const criteriaMatch = analysis.match(/<meets_criteria>(.*?)<\/meets_criteria>/);
      
      if (nameMatch && summaryMatch && criteriaMatch) {
        analyses.push({
          startup_name: nameMatch[1].trim(),
          summary: summaryMatch[1].trim(),
          meets_criteria: criteriaMatch[1].trim(),
        });
      }
    }
    
    // Extract recommended startups
    const recommendedMatch = content.match(/<recommended_startups>([\s\S]*?)<\/recommended_startups>/);
    const recommended_startups = recommendedMatch 
      ? recommendedMatch[1].split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];

    return {
      content,
      usage: data.usage,
      recommended_startups,
      analyses,
    };
  } catch (error) {
    console.error('Error analyzing startups:', error);
    throw error;
  }
} 