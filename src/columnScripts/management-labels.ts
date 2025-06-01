export const metadata = {
  id: 'management-labels',
  title: 'Management Labels',
  description: `This script defines a structured list of management labels and their variations. Each label represents a common management role, such as CEO or Founder, and includes various titles and terms that are synonymous or closely related. This categorization helps in identifying and grouping management roles based on their labels and variations.`,
  requiredColumns: [
    { content: 'occupation', description: 'job title or occupation' },
  ],
};

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
  {
    label: 'HR',
    variations: [
      'HR',
      'HR-Manager',
      'HR-Managerin',
      'Personal',
      'Personaladministration',
      'Personalentwicklung',
      'Recruiterin',
      'Human Resources',
      'HR Business Partner',
      'HRBP',
      'HR Director',
      'HR Specialist',
      'HR Generalist',
      'Talent Acquisition',
      'Recruiter',
      'Recruitment',
      'Personalleiter',
      'Personalleiterin',
      'HR Operations',
      'HR Coordinator',
      'HR Assistant',
      'HR Consultant',
      'HR Analyst',
      'HR Administrator',
      'HR Representative',
      'HR Officer',
      'HR Executive',
      'HR Lead',
      'HR Team Lead',
      'HR Supervisor',
      'HR Manager',
      'HR Head',
      'HR Director',
      'HR Vice President',
      'HR VP',
      'CHRO',
      'Chief Human Resources Officer',
      'Head of HR',
      'Head of Human Resources',
      'Head of People',
      'Head of Talent',
      'Head of Recruitment',
      'Head of People Operations',
      'Head of People & Culture',
      'Head of People & Organization',
      'Head of People & Development',
      'Head of People & Talent',
      'Head of People & HR',
      'Head of People & Human Resources',
      'Head of People & Recruitment',
      'Head of People & Learning',
      'Head of People & Training',
      'Head of People & Development',
      'Head of People & Performance',
      'Head of People & Engagement',
      'Head of People & Experience',
      'Head of People & Wellbeing',
      'Head of People & Benefits',
      'Head of People & Compensation',
      'Head of People & Rewards',
      'Head of People & Total Rewards',
      'Head of People & Compensation & Benefits',
      'Head of People & Rewards & Benefits',
      'Head of People & Compensation & Rewards',
      'Head of People & Total Rewards & Benefits',
      'Head of People & Compensation & Benefits & Rewards',
      'Head of People & Total Rewards & Benefits & Compensation',
      'Head of People & Compensation & Benefits & Rewards & Benefits',
      'Head of People & Total Rewards & Benefits & Compensation & Benefits',
      'HR',
      'HR-Manager',
      'HR-Managerin',
      'HR Business Partner',
      'HR Consultant',
      'HR Generalist',
      'HR Specialist',
      'HR Director',
      'Head of HR',
      'Head of People',
      'Head of People & Culture',
      'People Manager',
      'People & Culture',
      'People Operations',
      'Recruiter',
      'Recruiterin',
      'Recruiting Manager',
      'Recruiting Specialist',
      'Talent Acquisition',
      'Talent Manager',
      'Talent Partner',
      'Human Resources',
      'Human Resources Manager',
      'Human Resources Business Partner',
      'Human Resources Director',
      'HR Assistant',
      'Personal',
      'Personalabteilung',
      'Personalentwicklung',
      'Personaladministration',
      'Personalleiter',
      'Personalleiterin',
      'Leiter Personal',
      'Leiterin Personal',
      'Personalreferent',
      'Personalreferentin',
      'Personalmanager',
      'Personalmanagerin',
      'Personalberatung',
      'Personalberater',
      'Personalberaterin',
      'Dozent Personalwesen',
      'People Lead',
    ],
  },
];

export function getManagementLabel(title: string): string | null {
  if (!title) {
    console.log('No title provided, returning null.');
    return null;
  }

  const normalizedTitle = title.toLowerCase();
  console.log(`Normalized title: ${normalizedTitle}`);

  // First, normalize the title by replacing special characters with spaces
  // but keep forward slashes as they are important for role separation
  const normalizedTitleWithSpaces = normalizedTitle
    .replace(/[^a-z0-9üäöß\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  console.log(`Normalized title with spaces: ${normalizedTitleWithSpaces}`);

  // Split the title by forward slashes to check each role separately
  const titleParts = normalizedTitleWithSpaces
    .split('/')
    .map((part) => part.trim());
  console.log(`Title parts: ${titleParts.join(', ')}`);

  // Check each part of the title against our normalized labels
  for (const part of titleParts) {
    const words = part.split(' ');
    console.log(`Checking part: ${part}`);

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
            console.log(`Match found: ${variation} for label ${label.label}`);
            return label.label;
          }
        }
      }
    }
  }

  console.log('No matching label found, returning null.');
  return null;
}
