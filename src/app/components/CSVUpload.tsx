'use client';

import * as React from 'react';
import { useState } from 'react';
// If not generated, run: npx shadcn-ui@latest add button
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

interface CSVUploadProps {
  onImport: (result: { tableId: number; projectId: number }) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function parseCSV(text: string): string[][] {
  // First detect the delimiter by analyzing the first few lines
  const firstFewLines = text.split(/\r?\n/).slice(0, 5);
  const commaCount = firstFewLines.reduce(
    (count, l) => count + (l.match(/,/g) || []).length,
    0
  );
  const semicolonCount = firstFewLines.reduce(
    (count, l) => count + (l.match(/;/g) || []).length,
    0
  );
  const delimiter = semicolonCount > commaCount ? ';' : ',';
  console.log('delimiter', delimiter);

  // Split by both \r\n and \n to handle different newline formats
  const rows = text.split(/\r?\n/).map((line) => {
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
  });

  // Filter out empty rows
  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

function parseExcel(file: File): Promise<string[][]> {
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

export const CSVUpload: React.FC<CSVUploadProps> = ({ onImport }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fullData, setFullData] = useState<string[][] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    setFileName(file.name);
    try {
      let data: string[][];

      if (file.name.endsWith('.xlsx')) {
        data = await parseExcel(file);
      } else {
        const text = await file.text();
        data = parseCSV(text);
      }

      if (!data || data.length === 0 || data[0].length < 2) {
        setError('Could not parse file or not enough columns.');
        setPreview(null);
        setFullData(null);
        setLoading(false);
        return;
      }
      setPreview(data.slice(0, 5));
      setFullData(data);
      setLoading(false);
    } catch (e) {
      setError('Failed to read file.');
      setPreview(null);
      setFullData(null);
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreview(null);
    setFullData(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Only .csv and .xlsx files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large (max 2MB).');
      return;
    }
    handleFile(file);
  };

  const handleImport = async () => {
    if (!fullData || !fileName) return;
    setImporting(true);
    setError(null);
    setImportSuccess(false);
    try {
      const tableName = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
      const res = await fetch('/api/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: fullData,
          tableName: tableName,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setImportSuccess(true);
        onImport({ tableId: result.tableId, projectId: result.projectId });
      } else {
        setError(result.error || 'Import failed.');
      }
    } catch (e) {
      setError('Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      <label className="block">
        <span className="font-medium">Upload CSV or Excel file</span>
        <input
          type="file"
          accept=".csv,.xlsx"
          className="block mt-2"
          onChange={onFileChange}
          disabled={loading || importing}
        />
      </label>
      {fileName && (
        <span className="text-xs text-gray-500">Selected: {fileName}</span>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && <div className="text-blue-600 text-sm">Parsing file...</div>}
      {importing && (
        <div className="text-blue-600 text-sm">Importing to database...</div>
      )}
      {importSuccess && (
        <div className="text-green-600 text-sm">Import successful!</div>
      )}
      {preview && (
        <div>
          <div className="font-semibold mb-2">Preview (first 5 rows):</div>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                {preview[0].map((cell, i) => (
                  <TableHead key={i}>{cell}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.slice(1).map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            className="mt-2"
            onClick={handleImport}
            disabled={loading || importing}
          >
            Import
          </Button>
        </div>
      )}
    </div>
  );
};
