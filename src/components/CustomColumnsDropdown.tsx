'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Plus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CustomColumn {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
  aiPrompt?: string;
  useWebSearch: boolean;
  createdAt: string;
  tableId: number;
  projectId: number;
  projectName: string;
}

interface CustomColumnsDropdownProps {
  customColumns: CustomColumn[];
  onSelectColumn?: (column: CustomColumn) => void;
  currentProjectId?: number;
  onColumnAdded?: () => void;
  targetTableId?: number;
}

export function CustomColumnsDropdown({
  customColumns,
  onSelectColumn,
  currentProjectId,
  onColumnAdded,
  targetTableId,
}: CustomColumnsDropdownProps) {
  const [selectedColumn, setSelectedColumn] =
    React.useState<CustomColumn | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  const handleColumnSelect = (columnId: string) => {
    const column = customColumns.find((col) => col.id.toString() === columnId);
    if (column) {
      setSelectedColumn(column);
      onSelectColumn?.(column);
    }
  };

  const handleAddColumn = async (column: CustomColumn) => {
    try {
      const response = await fetch('/api/columns/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId: column.id,
          targetProjectId: currentProjectId,
          targetTableId: targetTableId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add column');
      }

      toast.success('Column added successfully');
      onColumnAdded?.();
    } catch (error) {
      console.error('Error adding column:', error);
      toast.error('Failed to add column');
    }
  };

  // Group columns by project
  const columnsByProject = customColumns.reduce(
    (acc, column) => {
      if (!acc[column.projectId]) {
        acc[column.projectId] = {
          name: column.projectName,
          columns: [],
        };
      }
      acc[column.projectId].columns.push(column);
      return acc;
    },
    {} as Record<number, { name: string; columns: CustomColumn[] }>
  );

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleColumnSelect}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select custom column" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(columnsByProject).map(
            ([projectId, { name, columns }]) => (
              <React.Fragment key={projectId}>
                <SelectItem
                  value={`project-${projectId}`}
                  disabled
                  className="font-semibold text-sm text-gray-500"
                >
                  {name}{' '}
                  {Number(projectId) === currentProjectId ? '(Current)' : ''}
                </SelectItem>
                {columns.map((column) => (
                  <SelectItem
                    key={column.id}
                    value={column.id.toString()}
                    className="pl-4"
                  >
                    {column.heading}
                  </SelectItem>
                ))}
              </React.Fragment>
            )
          )}
        </SelectContent>
      </Select>

      {selectedColumn && (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Column Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Project</h3>
                  <p className="text-sm text-gray-500">
                    {selectedColumn.projectName}
                    {selectedColumn.projectId === currentProjectId &&
                      ' (Current)'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Heading</h3>
                  <p className="text-sm text-gray-500">
                    {selectedColumn.heading}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Data Type</h3>
                  <p className="text-sm text-gray-500">
                    {selectedColumn.dataType}
                  </p>
                </div>
                {selectedColumn.aiPrompt && (
                  <div>
                    <h3 className="font-medium">AI Prompt</h3>
                    <p className="text-sm text-gray-500">
                      {selectedColumn.aiPrompt}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">Web Search</h3>
                  <p className="text-sm text-gray-500">
                    {selectedColumn.useWebSearch ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Created At</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedColumn.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {selectedColumn.projectId !== currentProjectId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAddColumn(selectedColumn)}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
