'use client';

import * as React from 'react';
import { useState } from 'react';
// If not generated, run: npx shadcn-ui@latest add button
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface CSVUploadProps {
  onImport: (result: { tableId: number; projectId: number }) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function parseCSV(text: string): string[][] {
  // Split by both \r\n and \n to handle different newline formats
  const rows = text.split(/\r?\n/).map(line => {
    // Split by semicolon and trim each cell
    return line.split(';').map(cell => cell.trim());
  });
  
  // Heuristic: all rows have same length and at least 2 columns
  const colCount = rows[0]?.length || 0;
  console.log("Number of columns:", colCount);
  console.log("Number of rows:", rows.length);
  console.log("First row:", rows[0]);
  
  return rows;
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
      const text = await file.text();
      const data = parseCSV(text);
      console.log('Parsed data:', data);
      if (!data || data.length === 0 || data[0].length < 2) {
        setError('Could not parse CSV or not enough columns.');
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
    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large (max 2MB).');
      return;
    }
    handleFile(file);
  };

  const handleImport = async () => {
    if (!fullData) return;
    setImporting(true);
    setError(null);
    setImportSuccess(false);
    try {
      const res = await fetch('/api/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: fullData }),
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
        <span className="font-medium">Upload CSV file</span>
        <input
          type="file"
          accept=".csv"
          className="block mt-2"
          onChange={onFileChange}
          disabled={loading || importing}
        />
      </label>
      {fileName && <span className="text-xs text-gray-500">Selected: {fileName}</span>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && <div className="text-blue-600 text-sm">Parsing CSV...</div>}
      {importing && <div className="text-blue-600 text-sm">Importing to database...</div>}
      {importSuccess && <div className="text-green-600 text-sm">Import successful!</div>}
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