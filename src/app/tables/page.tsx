'use client';

import * as React from 'react';
import { Grid } from '@/components/Grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomColumnsDropdown } from '@/components/CustomColumnsDropdown';
import { db, projects, tables } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

interface Project {
  id: number;
  name: string;
}

interface Column {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
  aiPrompt?: string;
}

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

export default function FullTableView() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  const [tableData, setTableData] = React.useState<{
    tableId: number;
    columns: Column[];
    rows: string[][];
    cellIds: number[][];
  } | null>(null);
  const [customColumns, setCustomColumns] = React.useState<CustomColumn[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch projects on component mount
  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects');
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  const fetchTableData = async (isBulkProcess: boolean = false) => {
    if (!selectedProjectId) return;

    // Skip loading state for bulk process updates
    if (!isBulkProcess) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch(
        `/api/table/${selectedProjectId}?isProjectId=true`
      );
      if (!response.ok) throw new Error('Failed to fetch table data');
      const data = await response.json();
      setTableData({
        tableId: data.id,
        columns: data.columns,
        rows: data.rows,
        cellIds: data.cellIds,
      });
      setCustomColumns(data.customColumns);
    } catch (err) {
      setError('Failed to load table data');
      console.error(err);
    } finally {
      if (!isBulkProcess) {
        setLoading(false);
      }
    }
  };

  // Fetch table data when project is selected
  React.useEffect(() => {
    fetchTableData();
  }, [selectedProjectId]);

  const handleCustomColumnSelect = (column: CustomColumn) => {
    // You can implement additional functionality here when a custom column is selected
    console.log('Selected custom column:', column);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center gap-4">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {customColumns.length > 0 && (
            <CustomColumnsDropdown
              customColumns={customColumns}
              onSelectColumn={handleCustomColumnSelect}
              currentProjectId={Number(selectedProjectId)}
              onColumnAdded={fetchTableData}
              targetTableId={tableData?.tableId || 0}
            />
          )}
        </div>

        <div className="w-full">
          {loading ? (
            <div className="text-blue-600 text-sm">Loading table data...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <Grid
              dbData={tableData}
              tableId={Number(selectedProjectId)}
              onColumnsChange={fetchTableData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
