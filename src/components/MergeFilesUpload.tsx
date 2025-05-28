'use client';

import * as React from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mergeFiles } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface MergeFilesUploadProps {
  onImport: (result: { tableId: number; projectId: number }) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function MergeFilesUpload({ onImport }: MergeFilesUploadProps) {
  const [preview, setPreview] = React.useState<string[][]>([]);
  const [fullData, setFullData] = React.useState<string[][]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [fileNames, setFileNames] = React.useState<string[]>([]);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleFilesUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        setError('Please upload only CSV or Excel files');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('One or more files are too large (max 2MB each)');
        return;
      }
    }

    setFileNames(files.map((f) => f.name));
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const mergedData = await mergeFiles(files);
      setFullData([mergedData.headers, ...mergedData.rows]);
      setPreview([mergedData.headers, ...mergedData.rows.slice(0, 5)]); // First 6 rows (header + 5 data rows)
    } catch (err) {
      setError('Error reading files');
      console.error('Error reading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fullData.length || fileNames.length === 0) return;

    setImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const tableName = `Merged_${fileNames.join('_')}`.replace(
        /\.[^/.]+$/,
        ''
      ); // Remove file extensions
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

      const result = await res.json();
      onImport({ tableId: result.tableId, projectId: result.projectId });

      // Clear the form
      setPreview([]);
      setFullData([]);
      setFileNames([]);
      setSuccess('Import successful!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleDownload = (format: 'csv' | 'xlsx') => {
    if (!fullData.length) return;

    const headers = fullData[0];
    const rows = fullData.slice(1);

    if (format === 'csv') {
      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `merged_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Convert to Excel
      const worksheet = XLSX.utils.aoa_to_sheet(fullData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged Data');

      // Generate and download file
      XLSX.writeFile(workbook, 'merged_data.xlsx');
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      <label className="block">
        <span className="font-medium">
          Upload multiple CSV or Excel files to merge
        </span>
        <input
          type="file"
          accept=".csv,.xlsx"
          multiple
          className="block mt-2"
          onChange={handleFilesUpload}
          disabled={loading || importing}
        />
      </label>

      {fileNames.length > 0 && (
        <div className="text-xs text-gray-500">
          Selected files: {fileNames.join(', ')}
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      {loading && <div className="text-blue-600 text-sm">Reading files...</div>}
      {importing && (
        <div className="text-blue-600 text-sm">Importing to database...</div>
      )}

      {preview.length > 0 && (
        <div>
          <div className="font-semibold mb-2">Preview (first 5 rows):</div>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                {preview[0].map((header, i) => (
                  <TableHead key={i}>{header}</TableHead>
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
          <div className="flex gap-2 mt-4">
            <Button onClick={handleImport} disabled={loading || importing}>
              Import Merged Data
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('csv')}
              disabled={loading || importing}
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('xlsx')}
              disabled={loading || importing}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
