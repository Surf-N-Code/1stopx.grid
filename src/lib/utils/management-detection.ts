import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MANAGEMENT_KEYWORDS: string[] = [
  // General
  'CEO', 'Chief Executive Officer', 'Founder', 'Co-Founder', 'Gründer', 'Gründerin',
  'Managing Director', 'Geschäftsführer', 'Geschäftsführerin', 'Inhaber', 'Inhaberin',
  'Partner', 'Associate Partner', 'Executive Director', 'Director', 'Chairman',
  'Chairperson', 'President', 'Vorstand', 'Beirat', 'Board Member', 'Aufsichtsrat', 'Shareholder & Executive',

  // Department and Area Leadership
  'Head of', 'Leiter', 'Leiterin', 'VP', 'Vice President', 'Head of Strategy',
  'Head of Sales', 'Head of Product', 'Head of Marketing', 'Head of Engineering',
  'Head of Business Development', 'Head of Innovation', 'Chief Marketing Officer',
  'Chief Technology Officer', 'Chief Financial Officer', 'Chief Operating Officer',
  'Chief Sales Officer', 'Chief Digital Officer', 'Chief Growth Officer',
  'CFO', 'CMO', 'COO', 'CTO', 'CDO', 'CSO', 'CPO', 'CHRO', 'CINO',

  // Other typical management roles
  'Executive', 'Leadership', 'Principal', 'Lead', 'Initiator & Executive Board Member',
  'Managing Partner', 'Unit Lead', 'Cluster Lead', 'Group Lead', 'Projektleitung'
];

export function isInManagement(title: string): boolean {
  if (!title) return false;
  const normalizedTitle = title.toLowerCase();
  return MANAGEMENT_KEYWORDS.some(keyword =>
    normalizedTitle.includes(keyword.toLowerCase())
  );
}

export async function isManagementDetectionPrompt(prompt: string): Promise<boolean> {
  try {
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
    return result === "true";
  } catch (error) {
    console.error("Error detecting management prompt:", error);
    return false;
  }
} 