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
if (!title) {
  console.log('Title is empty or undefined.');
  return false;
}

console.log('Original title:', title);
const normalizedTitle = title.toLowerCase();
console.log('Normalized title:', normalizedTitle);

// First, normalize the title by replacing special characters with spaces
// but keep forward slashes as they are important for role separation
const normalizedTitleWithSpaces = normalizedTitle
  .replace(/[^a-z0-9\s/]/g, ' ') // Replace special characters with spaces, keep forward slashes
  .replace(/\s+/g, ' ') // Normalize multiple spaces into single space
  .trim();

console.log('Normalized title with spaces:', normalizedTitleWithSpaces);

// Split the title by forward slashes to check each role separately
const titleParts = normalizedTitleWithSpaces.split('/').map(part => part.trim());
console.log('Title parts:', titleParts);

// Check if any of the keywords match exactly within any part of the title
const isManagement = MANAGEMENT_KEYWORDS.some(keyword => {
  const normalizedKeyword = keyword.toLowerCase();
  return titleParts.some(part => {
    // Check if the part contains the exact keyword
    // This ensures we match complete keywords, not partial words
    const words = part.split(' ');
    const keywordWords = normalizedKeyword.split(' ');

    // For each possible starting position in the title
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      // Check if the next N words match the keyword exactly
      const matches = keywordWords.every((keywordWord, j) => words[i + j] === keywordWord);
      if (matches) {
        console.log(`Match found: "${keyword}" in part "${part}"`);
        return true;
      }
    }
    return false;
  });
});

console.log('Is in management:', isManagement);
return isManagement;
}

// Test the function with the example title
const testTitle = "Founder/Head of Event Coordination and Public Relations at Whats The Point Cologne";
console.log('Test result:', isInManagement(testTitle));

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