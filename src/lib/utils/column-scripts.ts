import {
  MANAGEMENT_KEYWORDS,
  metadata as managementDetectionMetadata,
  isInManagement,
} from '@/columnScripts/management-detection';
import {
  MANAGEMENT_LABELS,
  metadata as managementLabelsMetadata,
  getManagementLabel,
} from '@/columnScripts/management-labels';

export interface ColumnScript {
  id: string;
  title: string;
  description: string;
  requiredColumns?: { content: string; description: string }[]; // Array of required column names
  execute: (value: string, rowData: Record<string, string>) => Promise<string>;
}

export const COLUMN_SCRIPTS: ColumnScript[] = [
  {
    id: managementDetectionMetadata.id,
    title: managementDetectionMetadata.title,
    description: 'Detects if a title indicates a management position',
    requiredColumns: managementDetectionMetadata.requiredColumns,
    execute: async (value: string, rowData: Record<string, string>) => {
      return isInManagement(value) ? 'true' : 'false';
    },
  },
  {
    id: managementLabelsMetadata.id,
    title: managementLabelsMetadata.title,
    description: 'Returns the standardized management label for a title',
    requiredColumns: managementLabelsMetadata.requiredColumns,
    execute: async (value: string, rowData: Record<string, string>) => {
      return getManagementLabel(value) || '';
    },
  },
];

export function getColumnScriptById(id: string): ColumnScript | undefined {
  return COLUMN_SCRIPTS.find((script) => script.id === id);
}
