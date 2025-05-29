export interface ManagementLabel {
  label: string;
  variations: string[];
}

export const MANAGEMENT_LABELS: ManagementLabel[] = [
  {
    label: 'CEO',
    variations: [
      'CEO',
      'Chief Executive Officer',
      'Geschäftsführer',
      'Geschäftsführerin',
      'Managing Director',
      'Geschäftsleiter',
      'Geschäftsstellenleiter',
      'Agenturleiter',
      'Geschäftsführung',
      'President',
    ],
  },
  {
    label: 'FOUNDER',
    variations: [
      'Founder',
      'Co-Founder',
      'Gründer',
      'Gründerin',
      'Inhaber',
      'Inhaberin',
    ],
  },
  {
    label: 'BOARD_MEMBER',
    variations: [
      'Aufsichtsratsmitglied',
      'Aufsichtsratsmitgliedin',
      'Aufsichtsrat',
      'Advisory Board Member',
      'Advisory Board',
      'Board Member',
      'Vorstand',
      'Beirat',
      'Mitglied der Geschäftsleitung',
      'Vorstandsmitglied',
      'Initiator & Executive Board Member',
      'Gesellschafter',
    ],
  },
  {
    label: 'BOARD_CHAIR',
    variations: [
      'Aufsichtsratsvorsitzender',
      'Aufsichtsratsvorsitzende',
      'Aufsichtsratsvorsitzenderin',
      'Chair of the Supervisory Board',
      'Chairman',
      'Chairperson',
      'Chairwoman of the Board',
    ],
  },
  {
    label: 'C_LEVEL',
    variations: [
      'Chief Information Security Officer',
      'Chief Process Officer',
      'Chief Experience Officer',
      'Chief Product Officer',
      'Chief Commercial Officer',
      'Chief Strategy Officer',
      'Chief Revenue Officer',
      'Chief Human Resources Officer',
      'Chief People Officer',
      'Chief Delivery Officer',
      'Chief of Staff',
      'Chief Marketing Officer',
      'Chief Technology Officer',
      'Chief Financial Officer',
      'Chief Operating Officer',
      'Chief Sales Officer',
      'Chief Digital Officer',
      'Chief Growth Officer',
      'CFO',
      'CMO',
      'COO',
      'CTO',
      'CDO',
      'CSO',
      'CPO',
      'CHRO',
      'CINO',
    ],
  },
  {
    label: 'HEAD_OF',
    variations: [
      'Head of',
      'Leiter',
      'Leiterin',
      'Bereichsleiter',
      'Team Leader',
      'Teamlead',
      'Teamleitung',
      'Projektleitung',
      'Stabsstellenleiter',
      'Cluster Head',
      'Head of Strategy',
      'Head of Sales',
      'Head of Product',
      'Head of Marketing',
      'Head of Engineering',
      'Head of Business Development',
      'Head of Innovation',
      'Managing Editor',
    ],
  },
  {
    label: 'PARTNER',
    variations: [
      'Partner',
      'Associate Partner',
      'Managing Partner',
      'Shareholder & Executive',
      'Managing Owner',
      'Founder & Managing Owner',
      'Managing Shareholder',
    ],
  },
  {
    label: 'DIRECTOR',
    variations: ['Director', 'Executive Director', 'Prokurist'],
  },
  {
    label: 'VICE_PRESIDENT',
    variations: ['VP', 'Vice President'],
  },
  {
    label: 'LEAD',
    variations: [
      'Lead',
      'Unit Lead',
      'Cluster Lead',
      'Group Lead',
      'Principal',
    ],
  },
  {
    label: 'EXECUTIVE',
    variations: ['Executive', 'Leadership'],
  },
];

export function getManagementLabel(title: string): string | null {
  if (!title) {
    return null;
  }

  const normalizedTitle = title.toLowerCase();

  // First, normalize the title by replacing special characters with spaces
  // but keep forward slashes as they are important for role separation
  const normalizedTitleWithSpaces = normalizedTitle
    .replace(/[^a-z0-9üäöß\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split the title by forward slashes to check each role separately
  const titleParts = normalizedTitleWithSpaces
    .split('/')
    .map((part) => part.trim());

  // Check each part of the title against our normalized labels
  for (const part of titleParts) {
    const words = part.split(' ');

    for (const label of MANAGEMENT_LABELS) {
      for (const variation of label.variations) {
        const variationWords = variation.toLowerCase().split(' ');

        // For each possible starting position in the title
        for (let i = 0; i <= words.length - variationWords.length; i++) {
          // Check if the next N words match the variation exactly
          const matches = variationWords.every(
            (variationWord, j) => words[i + j] === variationWord
          );

          if (matches) {
            return label.label;
          }
        }
      }
    }
  }

  return null;
}
