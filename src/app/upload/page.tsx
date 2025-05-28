'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';
import { MergeFilesUpload } from '@/components/MergeFilesUpload';
import { useSearchParams } from 'next/navigation';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function UploadPage() {
  const searchParams = useSearchParams();
  const isMergeMode = searchParams.get('mode') === 'merge';
  const [preview, setPreview] = React.useState<string[][]>([]);
  const [fullData, setFullData] = React.useState<string[][]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const parseExcel = async (file: File): Promise<string[][]> => {
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
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Please upload a CSV or Excel file');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large (max 2MB)');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError(null);
    try {
      let rows: string[][];

      if (file.name.endsWith('.xlsx')) {
        rows = await parseExcel(file);
      } else {
        const text = await file.text();
        // Handle both comma and semicolon separators
        const separator = text.includes(';') ? ';' : ',';
        rows = text
          .split(/\r?\n/)
          .map((line) =>
            line
              .split(separator)
              .map((cell) => cell.trim().replace(/^"|"$/g, ''))
          );
      }

      // Filter out empty rows
      rows = rows.filter((row) => row.some((cell) => cell.length > 0));

      setFullData(rows);
      setPreview(rows.slice(0, 6)); // First 6 rows (header + 5 data rows)
    } catch (err) {
      setError('Error reading file');
      console.error('Error reading file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fullData.length || !fileName) return;

    setImporting(true);
    setError(null);
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Import failed');
      }

      // Clear the form
      setPreview([]);
      setFullData([]);
      setFileName(null);
      setError('Import successful!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (isMergeMode) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <h1 className="text-2xl font-bold mb-8">Merge CSV/Excel Files</h1>
        <MergeFilesUpload onImport={handleImport} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">
                CSV or Excel files only (max 2MB)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {fileName && (
          <p className="text-sm text-gray-500">Selected: {fileName}</p>
        )}
        {loading && <p className="text-blue-500 text-sm">Reading file...</p>}
        {importing && (
          <p className="text-blue-500 text-sm">Importing data...</p>
        )}
        {error && (
          <p
            className={`text-sm ${error.includes('successful') ? 'text-green-500' : 'text-red-500'}`}
          >
            {error}
          </p>
        )}
      </div>

      {preview.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Preview (First 5 rows)</h2>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview[0].map((header, index) => (
                    <TableHead
                      key={index}
                      className="whitespace-nowrap truncate py-2"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(1).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className="whitespace-nowrap truncate py-2"
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={importing || loading}>
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
