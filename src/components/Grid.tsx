'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AddColumnModal } from '@/components/AddColumnModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  Wand2,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MultiSelect } from '@/components/ui/multi-select';
import { AiActionPopup } from '@/components/AiActionPopup';
import { convertToCSV } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { isManagementDetectionPrompt } from '@/lib/utils/management-detection';
import { toast } from 'react-hot-toast';
import { BulkProcessProgressModal } from './BulkProcessProgressModal';

interface Column {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
  aiPrompt?: string;
  isManagement?: boolean;
  useWebSearch?: boolean;
}

interface GridProps {
  dbData?: {
    columns: Column[];
    rows: string[][];
    cellIds: number[][];
  } | null;
  tableId?: number;
  onColumnsChange?: () => void;
}

interface SelectedCell {
  columnId: number;
  rowIndex: number;
  cellId: number;
  position: { x: number; y: number };
}

interface LoadingCell {
  columnId: number;
  rowIndex: number;
}

export function Grid({
  dbData: initialDbData,
  tableId,
  onColumnsChange,
}: GridProps) {
  const [dbData, setDbData] = React.useState(initialDbData);
  const [addColumnOpen, setAddColumnOpen] = React.useState(false);
  const [editColumn, setEditColumn] = React.useState<Column | null>(null);
  const [deleteColumnId, setDeleteColumnId] = React.useState<number | null>(
    null
  );
  const [visibleColumns, setVisibleColumns] = React.useState<number[]>([]);
  const [selectedCell, setSelectedCell] = React.useState<SelectedCell | null>(
    null
  );
  const [selectedCells, setSelectedCells] = React.useState<SelectedCell[]>([]);
  const [loadingCells, setLoadingCells] = React.useState<LoadingCell[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showAiPopup, setShowAiPopup] = React.useState(true);
  const [columnAiConfirm, setColumnAiConfirm] = React.useState<{
    columnId: number;
    heading: string;
    rowCount: number;
    runOnAllPages?: boolean;
  } | null>(null);
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [exportOption, setExportOption] = React.useState<'visible' | 'all'>(
    'visible'
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(100);
  const [bulkJobId, setBulkJobId] = React.useState<number | null>(null);
  const [showBulkModal, setShowBulkModal] = React.useState(false);

  // Update dbData when initialDbData changes
  React.useEffect(() => {
    setDbData(initialDbData);
  }, [initialDbData]);

  // Initialize visible columns when dbData changes
  // React.useEffect(() => {
  //   if (dbData?.columns) {
  //     const defaultVisibleColumns = [
  //       'first name',
  //       'last name',
  //       'email',
  //       'title',
  //       'ismanager',
  //       'website',
  //       'company',
  //       'person linkedin url',
  //     ];
  //     const visibleColumnIds = dbData.columns
  //       .filter((col) =>
  //         defaultVisibleColumns.includes(col.heading.toLowerCase())
  //       )
  //       .map((col) => col.id);
  //     setVisibleColumns(visibleColumnIds);
  //   }
  // }, [dbData?.columns]);

  React.useEffect(() => {
    const useWebSearch = selectedCell
      ? dbData?.columns.find((col) => col.id === selectedCell.columnId)
      : false;
  }, [selectedCell]);

  const handleAddColumn = async (data: {
    heading: string;
    dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
    aiPrompt?: string;
    useWebSearch?: boolean;
  }) => {
    if (!tableId) return;

    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tableId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add column');
      }

      onColumnsChange?.();
      setAddColumnOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
      throw err;
    }
  };

  const handleEditColumn = async (data: {
    heading: string;
    dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
    aiPrompt?: string;
    useWebSearch?: boolean;
  }) => {
    if (!editColumn) return;

    try {
      const res = await fetch(`/api/columns/${editColumn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update column');
      }

      onColumnsChange?.();
      setEditColumn(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column');
      throw err;
    }
  };

  const handleDeleteColumn = async () => {
    if (!deleteColumnId) return;

    try {
      const res = await fetch(`/api/columns/${deleteColumnId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete column');
      onColumnsChange?.();
      setDeleteColumnId(null);
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const handleCellClick = (
    columnId: number,
    rowIndex: number,
    cellId: number,
    event: React.MouseEvent
  ) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    const cell = {
      columnId,
      rowIndex,
      cellId,
      position: {
        x: rect.left,
        y: rect.top,
      },
    };

    // Check if the cell is already selected
    const isAlreadySelected = selectedCells.some(
      (selected) =>
        selected.columnId === columnId && selected.rowIndex === rowIndex
    );

    if (isAlreadySelected) {
      // If cell is already selected, remove it from selection
      setSelectedCells((prev) =>
        prev.filter(
          (selected) =>
            !(selected.columnId === columnId && selected.rowIndex === rowIndex)
        )
      );
      // If we're removing the primary selected cell, update it to the last remaining selected cell
      if (
        selectedCell?.columnId === columnId &&
        selectedCell?.rowIndex === rowIndex
      ) {
        const remainingCells = selectedCells.filter(
          (selected) =>
            !(selected.columnId === columnId && selected.rowIndex === rowIndex)
        );
        setSelectedCell(
          remainingCells.length > 0
            ? remainingCells[remainingCells.length - 1]
            : null
        );
      }
    } else {
      // If cell is not selected, add it to selection and make it the primary cell
      setSelectedCell(cell);
      if (selectedCells.length === 0) {
        setSelectedCells([cell]);
      } else {
        setSelectedCells((prev) => [...prev, cell]);
      }
      // Show the AI popup for new selections
      setShowAiPopup(true);
    }
  };

  const handleUpdatePrompt = async (columnId: number, prompt: string) => {
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPrompt: prompt }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update prompt');
      }

      onColumnsChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
      throw err;
    }
  };

  const handleUpdateCell = async (
    value: string,
    columnId: number,
    rowIndex: number
  ) => {
    // Only update the UI if this is not part of a bulk process
    if (!bulkJobId) {
      // Update the cell in the UI immediately
      setDbData((prev) => {
        if (!prev) return prev;

        const newRows = [...prev.rows];
        const originalColIndex = prev.columns.findIndex(
          (c) => c.id === columnId
        );
        if (originalColIndex === -1) return prev;

        // Create a new row array to ensure React detects the change
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][originalColIndex] = value;

        return {
          ...prev,
          rows: newRows,
        };
      });
    }

    // Remove the loading state for this cell
    setLoadingCells((prev) =>
      prev.filter(
        (cell) => !(cell.columnId === columnId && cell.rowIndex === rowIndex)
      )
    );
  };

  const handleRunAiOnColumn = async (columnId: number) => {
    const column = dbData?.columns.find((col) => col.id === columnId);
    if (!column?.aiPrompt) return;

    // Show confirmation dialog first
    setColumnAiConfirm({
      columnId,
      heading: column.heading,
      rowCount: dbData?.rows.length || 0,
      runOnAllPages: undefined, // Will be set by user in dialog
    });
  };

  const handleConfirmColumnAi = async () => {
    if (!columnAiConfirm || !dbData) return;

    // Create a local copy of the data to prevent re-renders
    const localData = {
      columns: [...dbData.columns],
      rows: dbData.rows.map((row) => [...row]),
      cellIds: dbData.cellIds.map((row) => [...row]),
    };

    const column = localData.columns.find(
      (col) => col.id === columnAiConfirm.columnId
    );
    if (!column?.aiPrompt) return;

    const originalColIndex = localData.columns.findIndex(
      (c) => c.id === columnAiConfirm.columnId
    );
    const isManagementPrompt = await isManagementDetectionPrompt(
      column.aiPrompt
    );

    // Calculate pagination values
    const totalRows = localData.rows.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRows);

    const cellsToProcess = (
      columnAiConfirm.runOnAllPages
        ? localData.rows
        : localData.rows.slice(startIndex, endIndex)
    ).map((row, rowIndex) => {
      // Create a map of column headings to values for this row
      const rowData = Object.fromEntries(
        localData.columns.map((col, index) => [
          col.heading.toLowerCase(),
          row[index],
        ])
      );

      // Replace placeholders in the prompt with actual values
      const columnDataForPlaceholders: string[] = [];
      const processedPrompt = column.aiPrompt!.replace(
        /{{([^}]+)}}/g,
        (match, column) => {
          // Store the placeholder text
          const placeholderText = match;
          // Clean up the column name: trim whitespace and convert to lowercase
          const columnLower = column.trim().toLowerCase();
          // Get the value from rowData, or keep the original placeholder if not found
          const value = rowData[columnLower];
          columnDataForPlaceholders.push(value);
          return value !== undefined ? value : placeholderText;
        }
      );

      const rowDataForIsManagementCheck = columnDataForPlaceholders.join('\n');

      // Calculate the actual row index in the full dataset
      const actualRowIndex = columnAiConfirm.runOnAllPages
        ? rowIndex
        : startIndex + rowIndex;

      return {
        cellId: localData.cellIds[actualRowIndex][originalColIndex],
        rowIndex: actualRowIndex,
        columnId: columnAiConfirm.columnId,
        prompt: processedPrompt,
        rowDataForIsManagementCheck,
      };
    });

    try {
      // Batch state updates to minimize re-renders
      const updates = () => {
        setShowBulkModal(true);
        setColumnAiConfirm(null);
      };
      updates();

      // Show toast notification
      toast.loading('Starting bulk AI processing...', {
        id: 'bulk-processing',
      });

      const response = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cellsToProcess,
          columnId: columnAiConfirm.columnId,
          isManagementPrompt,
          useWebSearch: column.useWebSearch,
          userEmail: 'grid@1stopx.com',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start bulk processing');
      }

      const data = await response.json();
      // Set the job ID for the progress modal
      setBulkJobId(data.jobId);

      // Update toast with success message
      toast.success(
        `Bulk processing started for ${data.totalCells} cells. You will receive an email when complete.`,
        { id: 'bulk-processing' }
      );
    } catch (error) {
      console.error('Failed to start bulk processing:', error);
      // Update toast with error message
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start bulk processing',
        { id: 'bulk-processing' }
      );
      // Close the progress modal if there's an error
      setShowBulkModal(false);
    }
  };

  const pollJobStatus = async (
    jobId: number,
    columnId: number,
    rowIndex: number
  ) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job status');

        const job = await response.json();
        // If this is a completed job, update the cell with its result
        if (job.status === 'completed') {
          clearInterval(pollInterval);
          handleUpdateCell(job.result, columnId, rowIndex);
          setLoadingCells((prev) =>
            prev.filter(
              (cell) =>
                !(cell.columnId === columnId && cell.rowIndex === rowIndex)
            )
          );
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setLoadingCells((prev) =>
            prev.filter(
              (cell) =>
                !(cell.columnId === columnId && cell.rowIndex === rowIndex)
            )
          );
          setError(`Failed to process cell at row ${rowIndex + 1}`);
        }
        // If the job is still pending, continue polling
      } catch (err) {
        clearInterval(pollInterval);
        setLoadingCells((prev) =>
          prev.filter(
            (cell) =>
              !(cell.columnId === columnId && cell.rowIndex === rowIndex)
          )
        );
        console.error('Error polling job status:', err);
      }
    }, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(pollInterval);
  };

  const handleExportCSV = () => {
    setShowExportDialog(true);
  };

  const handleExportConfirm = () => {
    if (!dbData?.columns || !dbData.rows) return;

    let columnsToExport;
    let rowsToExport;

    if (exportOption === 'visible') {
      // Get only visible columns and their data
      const visibleColumnIndices = dbData.columns
        .map((col, index) => ({ col, index }))
        .filter(({ col }) => visibleColumns.includes(col.id));

      columnsToExport = visibleColumnIndices.map(({ col }) => col);
      rowsToExport = dbData.rows.map((row) =>
        visibleColumnIndices.map(({ index }) => row[index])
      );
    } else {
      // Export all columns
      columnsToExport = dbData.columns;
      rowsToExport = dbData.rows;
    }

    // Convert to CSV
    const csvContent = convertToCSV(columnsToExport, rowsToExport);

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
  };

  if (!dbData?.columns || !dbData.rows) {
    return null;
  }

  // Calculate pagination values
  const totalRows = dbData.rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const currentRows = dbData.rows.slice(startIndex, endIndex);
  const currentCellIds = dbData.cellIds.slice(startIndex, endIndex);

  // Create a map of column headings to values for the selected row
  const selectedRowData = selectedCell
    ? Object.fromEntries(
        dbData.columns.map((col, index) => [
          col.heading.toLowerCase(),
          dbData.rows[selectedCell.rowIndex][index],
        ])
      )
    : {};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-4">
          <MultiSelect
            value={visibleColumns}
            onValueChange={setVisibleColumns}
            options={dbData.columns.map((col) => ({
              value: col.id,
              label: col.heading,
            }))}
            placeholder="Select visible columns"
            className="w-[300px]"
          />
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <Button onClick={() => setAddColumnOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Column
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {dbData.columns
                  .filter((col) => visibleColumns.includes(col.id))
                  .map((column) => (
                    <TableHead
                      key={column.id}
                      className="min-w-[150px] relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {column.heading}
                          {column.isManagement && (
                            <span className="ml-2 text-xs text-blue-600">
                              (Management)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          {column.aiPrompt && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRunAiOnColumn(column.id)}
                            >
                              <Wand2 className="h-3 w-3" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 flex-shrink-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem
                                onClick={() => setEditColumn(column)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteColumnId(column.id)}
                                className="text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {dbData.columns
                    .filter((col) => visibleColumns.includes(col.id))
                    .map((column, colIndex) => {
                      const originalColIndex = dbData.columns.findIndex(
                        (c) => c.id === column.id
                      );
                      const cell = row[originalColIndex];
                      const cellId = currentCellIds[rowIndex][originalColIndex];
                      const isLoading = loadingCells.some(
                        (loadingCell) =>
                          loadingCell.columnId === column.id &&
                          loadingCell.rowIndex === startIndex + rowIndex
                      );
                      const isSelected = selectedCells.some(
                        (selectedCell) =>
                          selectedCell.columnId === column.id &&
                          selectedCell.rowIndex === startIndex + rowIndex
                      );

                      return (
                        <TableCell
                          key={colIndex}
                          className={`truncate whitespace-nowrap py-2 cursor-pointer relative ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={(e) =>
                            handleCellClick(
                              column.id,
                              startIndex + rowIndex,
                              cellId,
                              e
                            )
                          }
                        >
                          {isLoading ? (
                            <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                            </div>
                          ) : null}
                          {cell}
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add pagination controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalRows} rows
          </p>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing page size
            }}
            className="h-8 rounded-md border border-gray-300 px-2 text-sm"
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
            <option value={500}>500 rows</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>

      {selectedCell && showAiPopup && (
        <AiActionPopup
          columnId={selectedCell.columnId}
          rowIndex={selectedCell.rowIndex}
          cellId={selectedCell.cellId}
          selectedCells={selectedCells.map((cell) => {
            // Get row data for this specific cell
            const cellRowData = Object.fromEntries(
              dbData.columns.map((col, index) => [
                col.heading.toLowerCase(),
                dbData.rows[cell.rowIndex][index],
              ])
            );
            return {
              columnId: cell.columnId,
              rowIndex: cell.rowIndex,
              cellId: cell.cellId,
              rowData: cellRowData,
            };
          })}
          aiPrompt={
            dbData?.columns.find((col) => col.id === selectedCell.columnId)
              ?.aiPrompt
          }
          columnHeading={
            dbData?.columns.find((col) => col.id === selectedCell.columnId)
              ?.heading || ''
          }
          position={selectedCell.position}
          onClose={() => {
            setSelectedCell(null);
            setSelectedCells([]);
            setShowAiPopup(false);
          }}
          onUpdatePrompt={handleUpdatePrompt}
          onUpdateCell={handleUpdateCell}
          onStartLoading={(columnId, rowIndex) => {
            setLoadingCells((prev) => [...prev, { columnId, rowIndex }]);
          }}
          selectedCellsCount={selectedCells.length}
          onPollJobStatus={pollJobStatus}
          useWebSearch={
            dbData?.columns.find((col) => col.id === selectedCell.columnId)
              ?.useWebSearch
          }
        />
      )}

      <AddColumnModal
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        onSubmit={handleAddColumn}
        existingColumns={dbData.columns}
      />

      <AddColumnModal
        open={!!editColumn}
        onOpenChange={(open) => !open && setEditColumn(null)}
        onSubmit={handleEditColumn}
        editColumn={editColumn || undefined}
        existingColumns={dbData.columns}
      />

      <AlertDialog
        open={!!deleteColumnId}
        onOpenChange={(open) => !open && setDeleteColumnId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the column and all its data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!columnAiConfirm}
        onOpenChange={(open) => !open && setColumnAiConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run AI on column?</AlertDialogTitle>
            <AlertDialogDescription>
              {columnAiConfirm?.runOnAllPages === undefined ? (
                <div className="space-y-4">
                  <p>Choose whether to run the AI prompt on:</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setColumnAiConfirm((prev) =>
                          prev ? { ...prev, runOnAllPages: true } : null
                        )
                      }
                    >
                      All {columnAiConfirm?.rowCount} rows
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setColumnAiConfirm((prev) =>
                          prev ? { ...prev, runOnAllPages: false } : null
                        )
                      }
                    >
                      Current page only ({endIndex - startIndex} rows)
                    </Button>
                  </div>
                </div>
              ) : (
                <p>
                  This will run the AI prompt on{' '}
                  {columnAiConfirm.runOnAllPages ? 'all' : "the current page's"}{' '}
                  rows in the "{columnAiConfirm?.heading}" column. This action
                  cannot be undone.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {columnAiConfirm?.runOnAllPages !== undefined && (
              <AlertDialogAction onClick={handleConfirmColumnAi}>
                Run AI
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to CSV</DialogTitle>
            <DialogDescription>
              Choose which columns to include in the export
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={exportOption}
              onValueChange={(value: 'visible' | 'all') =>
                setExportOption(value)
              }
              className="flex flex-col gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visible" id="visible" />
                <Label htmlFor="visible">
                  Export visible columns only ({visibleColumns.length} columns)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">
                  Export all columns ({dbData?.columns.length} columns)
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExportConfirm}>Export CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk process progress modal */}
      {bulkJobId && (
        <BulkProcessProgressModal
          jobId={bulkJobId}
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onComplete={() => {
            // Only refresh if there were structural changes to the columns
            if (columnAiConfirm?.runOnAllPages) {
              onColumnsChange?.();
            }
          }}
        />
      )}
    </div>
  );
}
