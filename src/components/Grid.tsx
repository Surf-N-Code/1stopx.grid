'use client';

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddColumnModal } from "@/components/AddColumnModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Plus, Edit, Trash, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MultiSelect } from "@/components/ui/multi-select";
import { AiActionPopup } from "@/components/AiActionPopup";

interface Column {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
  aiPrompt?: string;
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

export function Grid({ dbData: initialDbData, tableId, onColumnsChange }: GridProps) {
  const [dbData, setDbData] = React.useState(initialDbData);
  const [addColumnOpen, setAddColumnOpen] = React.useState(false);
  const [editColumn, setEditColumn] = React.useState<Column | null>(null);
  const [deleteColumnId, setDeleteColumnId] = React.useState<number | null>(null);
  const [visibleColumns, setVisibleColumns] = React.useState<number[]>([]);
  const [selectedCell, setSelectedCell] = React.useState<SelectedCell | null>(null);
  const [selectedCells, setSelectedCells] = React.useState<SelectedCell[]>([]);
  const [loadingCells, setLoadingCells] = React.useState<LoadingCell[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showAiPopup, setShowAiPopup] = React.useState(true);
  const [columnAiConfirm, setColumnAiConfirm] = React.useState<{
    columnId: number;
    heading: string;
    rowCount: number;
  } | null>(null);

  // Update dbData when initialDbData changes
  React.useEffect(() => {
    setDbData(initialDbData);
  }, [initialDbData]);

  // Initialize visible columns when dbData changes
  React.useEffect(() => {
    if (dbData?.columns) {
      const defaultVisibleColumns = ['first name', 'last name', 'email', 'title', 'ismanager', 'website', 'company', 'person linkedin url'];
      const visibleColumnIds = dbData.columns
        .filter(col => defaultVisibleColumns.includes(col.heading.toLowerCase()))
        .map(col => col.id);
      setVisibleColumns(visibleColumnIds);
    }
  }, [dbData?.columns]);

  const handleAddColumn = async (data: {
    heading: string;
    dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
    aiPrompt?: string;
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

  const handleCellClick = (columnId: number, rowIndex: number, cellId: number, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const cell = {
      columnId,
      rowIndex,
      cellId,
      position: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      },
    };

    // Check if the cell is already selected
    const isAlreadySelected = selectedCells.some(
      selected => selected.columnId === columnId && selected.rowIndex === rowIndex
    );

    if (isAlreadySelected) {
      // If cell is already selected, remove it from selection
      setSelectedCells(prev => prev.filter(
        selected => !(selected.columnId === columnId && selected.rowIndex === rowIndex)
      ));
      // If we're removing the primary selected cell, update it to the last remaining selected cell
      if (selectedCell?.columnId === columnId && selectedCell?.rowIndex === rowIndex) {
        const remainingCells = selectedCells.filter(
          selected => !(selected.columnId === columnId && selected.rowIndex === rowIndex)
        );
        setSelectedCell(remainingCells.length > 0 ? remainingCells[remainingCells.length - 1] : null);
      }
    } else {
      // If cell is not selected, add it to selection and make it the primary cell
      setSelectedCell(cell);
      if (selectedCells.length === 0) {
        setSelectedCells([cell]);
      } else {
        setSelectedCells(prev => [...prev, cell]);
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

  const handleUpdateCell = async (value: string, columnId: number, rowIndex: number) => {
    // Update the cell in the UI immediately
    const newRows = [...dbData!.rows];
    const originalColIndex = dbData!.columns.findIndex(c => c.id === columnId);
    newRows[rowIndex][originalColIndex] = value;
    setDbData(prev => prev ? { ...prev, rows: newRows } : null);
  };

  const handleRunAiOnColumn = async (columnId: number) => {
    const column = dbData?.columns.find(col => col.id === columnId);
    if (!column?.aiPrompt) return;

    // Show confirmation dialog first
    setColumnAiConfirm({
      columnId,
      heading: column.heading,
      rowCount: dbData?.rows.length || 0
    });
  };

  const handleConfirmColumnAi = async () => {
    if (!columnAiConfirm || !dbData) return;

    const column = dbData.columns.find(col => col.id === columnAiConfirm.columnId);
    if (!column?.aiPrompt) return;

    const originalColIndex = dbData.columns.findIndex(c => c.id === columnAiConfirm.columnId);
    const cellsToProcess = dbData.rows.map((row, rowIndex) => {
      // Create a map of column headings to values for this row
      const rowData = Object.fromEntries(
        dbData.columns.map((col, index) => [
          col.heading.toLowerCase(),
          row[index]
        ])
      );

      // Replace placeholders in the prompt with actual values
      const processedPrompt = column.aiPrompt!.replace(/{{(\w+)}}/g, (match, placeholder) => {
        return rowData[placeholder.toLowerCase()] || match;
      });

      return {
        cellId: dbData.cellIds[rowIndex][originalColIndex],
        rowIndex,
        columnId: columnAiConfirm.columnId,
        prompt: processedPrompt,
      };
    });

    // Add all cells to loading state
    setLoadingCells(prev => [...prev, ...cellsToProcess.map(cell => ({
      columnId: cell.columnId,
      rowIndex: cell.rowIndex
    }))]);

    // Process all cells in parallel
    await Promise.all(
      cellsToProcess.map(async ({ cellId, rowIndex, prompt }) => {
        try {
          const response = await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cellId,
              prompt,
            }),
          });

          if (!response.ok) throw new Error("Failed to run AI");

          const job = await response.json();
          // Start polling for this job
          pollJobStatus(job.id, columnAiConfirm.columnId, rowIndex);
        } catch (error) {
          console.error("Failed to process cell:", error);
          // Remove from loading state on error
          setLoadingCells(prev => 
            prev.filter(cell => !(cell.columnId === columnAiConfirm.columnId && cell.rowIndex === rowIndex))
          );
        }
      })
    );

    // Close the confirmation dialog
    setColumnAiConfirm(null);
  };

  const pollJobStatus = async (jobId: number, columnId: number, rowIndex: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job status');
        
        const job = await response.json();
        if (job.status === 'completed') {
          clearInterval(pollInterval);
          handleUpdateCell(job.result, columnId, rowIndex);
          setLoadingCells(prev => 
            prev.filter(cell => !(cell.columnId === columnId && cell.rowIndex === rowIndex))
          );
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setLoadingCells(prev => 
            prev.filter(cell => !(cell.columnId === columnId && cell.rowIndex === rowIndex))
          );
          setError(`Failed to process cell at row ${rowIndex + 1}`);
        }
      } catch (err) {
        clearInterval(pollInterval);
        setLoadingCells(prev => 
          prev.filter(cell => !(cell.columnId === columnId && cell.rowIndex === rowIndex))
        );
      }
    }, 1000);
  };

  if (!dbData?.columns || !dbData.rows) {
    return null;
  }

  // Create a map of column headings to values for the selected row
  const selectedRowData = selectedCell
    ? Object.fromEntries(
        dbData.columns.map((col, index) => [
          col.heading.toLowerCase(),
          dbData.rows[selectedCell.rowIndex][index]
        ])
      )
    : {};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center relative z-50">
        <MultiSelect
          value={visibleColumns}
          onValueChange={setVisibleColumns}
          options={dbData.columns.map(col => ({
            value: col.id,
            label: col.heading
          }))}
          placeholder="Select visible columns"
          className="w-[300px]"
        />
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
                  .filter(col => visibleColumns.includes(col.id))
                  .map((column) => (
                  <TableHead key={column.id} className="min-w-[150px] relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{column.heading}</span>
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
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => setEditColumn(column)}>
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
              {dbData.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {dbData.columns
                    .filter(col => visibleColumns.includes(col.id))
                    .map((column, colIndex) => {
                      const originalColIndex = dbData.columns.findIndex(c => c.id === column.id);
                      const cell = row[originalColIndex];
                      const cellId = dbData.cellIds[rowIndex][originalColIndex];
                      const isLoading = loadingCells.some(
                        loadingCell => 
                          loadingCell.columnId === column.id && 
                          loadingCell.rowIndex === rowIndex
                      );
                      const isSelected = selectedCells.some(
                        selectedCell => 
                          selectedCell.columnId === column.id && 
                          selectedCell.rowIndex === rowIndex
                      );
                      
                      return (
                        <TableCell
                          key={colIndex}
                          className={`truncate whitespace-nowrap py-2 cursor-pointer relative ${
                            isSelected ? "bg-blue-50" : ""
                          }`}
                          onClick={(e) =>
                            handleCellClick(column.id, rowIndex, cellId, e)
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

      {selectedCell && showAiPopup && (
        <AiActionPopup
          columnId={selectedCell.columnId}
          rowIndex={selectedCell.rowIndex}
          cellId={selectedCell.cellId}
          selectedCells={selectedCells.map(cell => ({
            columnId: cell.columnId,
            rowIndex: cell.rowIndex,
            cellId: cell.cellId
          }))}
          aiPrompt={dbData?.columns.find(col => col.id === selectedCell.columnId)?.aiPrompt}
          columnHeading={dbData?.columns.find(col => col.id === selectedCell.columnId)?.heading || ""}
          rowData={selectedRowData}
          position={selectedCell.position}
          onClose={() => {
            setSelectedCell(null);
            setSelectedCells([]);
            setShowAiPopup(true);
          }}
          onUpdatePrompt={handleUpdatePrompt}
          onUpdateCell={(value: string) => {
            // Update all selected cells
            selectedCells.forEach(cell => {
              handleUpdateCell(value, cell.columnId, cell.rowIndex);
              setLoadingCells(prev => 
                prev.filter(loadingCell => 
                  !(loadingCell.columnId === cell.columnId && loadingCell.rowIndex === cell.rowIndex)
                )
              );
            });
          }}
          onStartLoading={(columnId, rowIndex) => {
            setLoadingCells(prev => [...prev, { columnId, rowIndex }]);
            setShowAiPopup(false); // Hide the popup when jobs start
          }}
          selectedCellsCount={selectedCells.length}
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

      <AlertDialog open={!!deleteColumnId} onOpenChange={(open) => !open && setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the column and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!columnAiConfirm} onOpenChange={(open) => !open && setColumnAiConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run AI on entire column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will run the AI prompt on all {columnAiConfirm?.rowCount} rows in the "{columnAiConfirm?.heading}" column. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmColumnAi}>Run AI</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 