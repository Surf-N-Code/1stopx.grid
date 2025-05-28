import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToCSV(
  columns: { heading: string }[],
  rows: string[][]
): string {
  // Create header row with column headings
  const headerRow = columns.map((col) => col.heading).join(';');

  // Convert each row to CSV format
  const csvRows = rows.map((row) => row.join(';'));

  // Combine header and rows
  return [headerRow, ...csvRows].join('\n');
}

interface MergedFileData {
  headers: string[];
  rows: string[][];
}

function detectDelimiter(text: string): string {
  // Count occurrences of common delimiters in the first few lines
  const lines = text.split(/\r?\n/).slice(0, 5); // Check first 5 lines
  const delimiterCounts = new Map<string, number>();

  for (const line of lines) {
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;

    delimiterCounts.set(',', (delimiterCounts.get(',') || 0) + commaCount);
    delimiterCounts.set(';', (delimiterCounts.get(';') || 0) + semicolonCount);
    delimiterCounts.set('\t', (delimiterCounts.get('\t') || 0) + tabCount);
  }

  // Find the delimiter with the highest count
  let maxCount = 0;
  let detectedDelimiter = ','; // Default to comma

  for (const [delimiter, count] of delimiterCounts) {
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

export async function mergeFiles(files: File[]): Promise<MergedFileData> {
  const allData: string[][][] = [];
  const headerMap = new Map<string, number>(); // Maps header name to column index in final output
  let finalHeaders: string[] = [];

  // First pass: collect all headers and create mapping
  for (const file of files) {
    let fileData: string[][];

    if (file.name.endsWith('.xlsx')) {
      fileData = await parseExcel(file);
    } else {
      const text = await file.text();
      const delimiter = detectDelimiter(text);
      fileData = text
        .split(/\r?\n/)
        .map((line) => parseCSVLine(line, delimiter));
    }

    // Filter out empty rows
    fileData = fileData.filter((row) => row.some((cell) => cell.length > 0));

    if (fileData.length === 0) continue;

    const fileHeaders = fileData[0];
    const rows = fileData.slice(1);

    // Add new headers to the map if they don't exist
    fileHeaders.forEach((header, index) => {
      if (!headerMap.has(header)) {
        headerMap.set(header, finalHeaders.length);
        finalHeaders.push(header);
      }
    });

    allData.push(rows);
  }

  // Second pass: merge all data using the header mapping
  const mergedRows: string[][] = [];

  for (let i = 0; i < allData.length; i++) {
    const rows = allData[i];
    const fileText = await files[i].text();
    const delimiter = detectDelimiter(fileText);
    const fileHeaders = files[i].name.endsWith('.xlsx')
      ? (await parseExcel(files[i]))[0]
      : parseCSVLine(fileText.split(/\r?\n/)[0], delimiter);

    for (const row of rows) {
      const newRow = new Array(finalHeaders.length).fill('');

      // Map each value to its correct position based on headers
      row.forEach((value, index) => {
        const header = fileHeaders[index];
        const finalIndex = headerMap.get(header);
        if (finalIndex !== undefined) {
          newRow[finalIndex] = value;
        }
      });

      mergedRows.push(newRow);
    }
  }

  return {
    headers: finalHeaders,
    rows: mergedRows,
  };
}

// Helper function to parse Excel files
async function parseExcel(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as string[][];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}
