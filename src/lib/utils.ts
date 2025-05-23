import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToCSV(columns: { heading: string }[], rows: string[][]): string {
  // Create header row with column headings
  const headerRow = columns.map(col => col.heading).join(';');
  
  // Convert each row to CSV format
  const csvRows = rows.map(row => row.join(';'));
  
  // Combine header and rows
  return [headerRow, ...csvRows].join('\n');
}
