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
    const response = await fetch('/api/management-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to detect management prompt');
    }

    const data = await response.json();
    return data.isManagementDetection;
  } catch (error) {
    console.error("Error detecting management prompt:", error);
    return false;
  }
} 