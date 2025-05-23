'use client';

import * as React from 'react';
import { Grid } from '@/components/Grid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, projects, tables } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

interface Project {
  id: number;
  name: string;
}

export default function FullTableView() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  const [tableData, setTableData] = React.useState<{ columns: { id: number; heading: string }[]; rows: string[][] } | null>(null);
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

  // Fetch table data when project is selected
  React.useEffect(() => {
    const fetchTableData = async () => {
      if (!selectedProjectId) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/table/${selectedProjectId}`);
        if (!response.ok) throw new Error('Failed to fetch table data');
        const data = await response.json();
        setTableData(data);
      } catch (err) {
        setError('Failed to load table data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [selectedProjectId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-4">
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
        </div>

        <div className="w-full">
          {loading ? (
            <div className="text-blue-600 text-sm">Loading table data...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <Grid dbData={tableData} />
          )}
        </div>
      </div>
    </div>
  );
} 