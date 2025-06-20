import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Wand2 } from 'lucide-react';
import { isManagementDetectionPrompt } from '@/columnScripts/management-detection';
import { getColumnScriptById } from '@/lib/utils/column-scripts';

interface SelectedCell {
  columnId: number;
  rowIndex: number;
  cellId: number;
  rowData: Record<string, string>;
}

interface AiActionPopupProps {
  columnId: number;
  rowIndex: number;
  cellId: number;
  selectedCells: SelectedCell[];
  aiPrompt?: string;
  columnHeading: string;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUpdatePrompt: (columnId: number, prompt: string) => Promise<void>;
  onUpdateCell: (value: string, columnId: number, rowIndex: number) => void;
  onStartLoading: (columnId: number, rowIndex: number) => void;
  selectedCellsCount: number;
  onPollJobStatus: (jobId: number, columnId: number, rowIndex: number) => void;
  useWebSearch?: boolean;
  scriptToPopulate?: string;
}

export function AiActionPopup({
  columnId,
  rowIndex,
  cellId,
  selectedCells,
  aiPrompt,
  columnHeading,
  position,
  onClose,
  onUpdatePrompt,
  onUpdateCell,
  onStartLoading,
  selectedCellsCount,
  onPollJobStatus,
  useWebSearch = false,
  scriptToPopulate,
}: AiActionPopupProps) {
  const [showPromptDialog, setShowPromptDialog] = React.useState(!aiPrompt);
  const [newPrompt, setNewPrompt] = React.useState(aiPrompt || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [jobIds, setJobIds] = React.useState<Map<string, number>>(new Map());

  const handleRunAi = async () => {
    if (!aiPrompt && !newPrompt && !scriptToPopulate) {
      setShowPromptDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Start loading state for all selected cells
    selectedCells.forEach((cell) => {
      onStartLoading(cell.columnId, cell.rowIndex);
    });

    try {
      // If there's a script to run, execute it directly
      if (scriptToPopulate) {
        const script = getColumnScriptById(scriptToPopulate);
        if (!script) {
          throw new Error(`Script ${scriptToPopulate} not found`);
        }

        // Execute the script for each selected cell
        for (const cell of selectedCells) {
          try {
            const result = await script.execute(
              cell.rowData[columnHeading.toLowerCase()],
              cell.rowData
            );
            onUpdateCell(result, cell.columnId, cell.rowIndex);
          } catch (err) {
            console.error(
              `Failed to execute script for cell ${cell.cellId}:`,
              err
            );
            setError(
              err instanceof Error ? err.message : 'Failed to execute script'
            );
          }
        }
        onClose();
        return;
      }

      // Otherwise, proceed with AI processing
      const promptToUse = aiPrompt || newPrompt;
      const isManagementPrompt = await isManagementDetectionPrompt(promptToUse);

      // Create jobs for all selected cells
      let successfulJobs = 0;
      const jobPromises = selectedCells.map(async (cell) => {
        // Process prompt with this cell's row data
        const columnDataForPlaceholders: string[] = [];
        const processedPrompt = promptToUse.replace(
          /{{([^}]+)}}/g,
          (match, column) => {
            const placeholderText = match;
            const columnLower = column.trim().toLowerCase();
            const value = cell.rowData[columnLower];
            columnDataForPlaceholders.push(value);
            return value !== undefined ? value : placeholderText;
          }
        );

        const rowDataForIsManagementCheck =
          columnDataForPlaceholders.join('\n');

        try {
          const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cellId: cell.cellId,
              prompt: processedPrompt,
              isManagementDetection: isManagementPrompt,
              rowDataForIsManagementCheck,
              useWebSearch,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to run AI');
          }

          const job = await response.json();
          successfulJobs++;
          onPollJobStatus(job.id, cell.columnId, cell.rowIndex);
        } catch (err) {
          console.error(`Failed to create job for cell ${cell.cellId}:`, err);
          setError(err instanceof Error ? err.message : 'Failed to run AI');
        }
      });

      await Promise.all(jobPromises);

      if (successfulJobs === 0) {
        setIsLoading(false);
        setError('Failed to create any jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run AI');
      setIsLoading(false);
    }
    onClose();
  };

  const handleSavePrompt = async () => {
    try {
      await onUpdatePrompt(columnId, newPrompt);
      setShowPromptDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    }
  };

  if (!position) return null;

  if (showPromptDialog) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add AI Prompt for {columnHeading}</DialogTitle>
            <DialogDescription>
              This prompt will be used for AI processing of cells in this
              column. Use {'{{'}
              <i>columnName</i>
              {'}}'} to reference values from other columns.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter AI prompt..."
              className="w-full"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSavePrompt}>Save & Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '200px',
      }}
    >
      <Button
        size="lg"
        onClick={handleRunAi}
        disabled={isLoading || jobIds.size > 0}
        className="whitespace-nowrap w-full"
      >
        <Wand2 className="w-5 h-5 mr-2" />
        {isLoading || jobIds.size > 0 ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2" />
            Processing...
          </div>
        ) : (
          `Run ${scriptToPopulate ? 'Script' : 'AI'} ${selectedCellsCount > 1 ? `(${selectedCellsCount} cells)` : ''}`
        )}
      </Button>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}
