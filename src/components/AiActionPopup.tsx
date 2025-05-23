import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Wand2 } from "lucide-react";

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
  onUpdateCell: (value: string) => void;
  onStartLoading: (columnId: number, rowIndex: number) => void;
  selectedCellsCount: number;
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
}: AiActionPopupProps) {
  const [showPromptDialog, setShowPromptDialog] = React.useState(!aiPrompt);
  const [newPrompt, setNewPrompt] = React.useState(aiPrompt || "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [jobIds, setJobIds] = React.useState<Map<string, number>>(new Map());
  const [loadingCells, setLoadingCells] = React.useState<SelectedCell[]>([]);

  // Poll for job status
  React.useEffect(() => {
    if (jobIds.size === 0) return;

    const pollInterval = setInterval(async () => {
      let allCompleted = true;
      const completedJobs = new Set<string>();

      for (const [key, jobId] of jobIds.entries()) {
        try {
          const response = await fetch(`/api/jobs/${jobId}`);
          if (!response.ok) throw new Error('Failed to fetch job status');
          
          const job = await response.json();
          const [columnId, rowIndex] = key.split('-').map(Number);

          if (job.status === 'completed') {
            onUpdateCell(job.result);
            completedJobs.add(key);
            // Remove loading state for this cell
            setLoadingCells(prev => 
              prev.filter(loadingCell => 
                !(loadingCell.columnId === columnId && loadingCell.rowIndex === rowIndex)
              )
            );
          } else if (job.status === 'failed') {
            setError(`Failed to process cell at row ${rowIndex + 1}`);
            completedJobs.add(key);
            // Remove loading state for this cell
            setLoadingCells(prev => 
              prev.filter(loadingCell => 
                !(loadingCell.columnId === columnId && loadingCell.rowIndex === rowIndex)
              )
            );
          } else {
            allCompleted = false;
          }
        } catch (err) {
          console.error(`Failed to poll job ${jobId}:`, err);
          completedJobs.add(key);
          const [columnId, rowIndex] = key.split('-').map(Number);
          // Remove loading state for this cell
          setLoadingCells(prev => 
            prev.filter(loadingCell => 
              !(loadingCell.columnId === columnId && loadingCell.rowIndex === rowIndex)
            )
          );
        }
      }

      // Remove completed jobs
      completedJobs.forEach(key => {
        setJobIds(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      });

      if (allCompleted && completedJobs.size > 0) {
        clearInterval(pollInterval);
        setIsLoading(false);
        if (jobIds.size === 0) {
          onClose();
        }
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [jobIds, onUpdateCell, onClose]);

  const handleRunAi = async () => {
    if (!aiPrompt && !newPrompt) {
      setShowPromptDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Start loading state for all selected cells
    selectedCells.forEach(cell => {
      onStartLoading(cell.columnId, cell.rowIndex);
    });

    // Replace placeholders in the prompt with actual values
    const promptToUse = aiPrompt || newPrompt;

    try {
      // Create jobs for all selected cells
      let successfulJobs = 0;
      console.log('selectedCells', selectedCells);
      const jobPromises = selectedCells.map(async (cell) => {
        // Process prompt with this cell's row data
        const processedPrompt = promptToUse.replace(/{{([^}]+)}}/g, (match, column) => {
          const columnLower = column.trim().toLowerCase().replace(/\\s+/g, ' ');
          return cell.rowData[columnLower] || match;
        });

        console.log('processedPrompt', processedPrompt);

        try {
          const response = await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cellId: cell.cellId,
              prompt: processedPrompt,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to run AI");
          }

          const job = await response.json();
          successfulJobs++;
          setJobIds(prev => {
            const next = new Map(prev);
            next.set(`${cell.columnId}-${cell.rowIndex}`, job.id);
            return next;
          });
        } catch (err) {
          console.error(`Failed to create job for cell ${cell.cellId}:`, err);
          // Remove loading state for this cell
          setLoadingCells(prev => 
            prev.filter(loadingCell => 
              !(loadingCell.columnId === cell.columnId && loadingCell.rowIndex === cell.rowIndex)
            )
          );
        }
      });

      // Wait for all jobs to be created
      await Promise.all(jobPromises);

      if (successfulJobs === 0) {
        setIsLoading(false);
        setError("Failed to create any jobs");
        // Clear all loading states
        selectedCells.forEach(cell => {
          setLoadingCells(prev => 
            prev.filter(loadingCell => 
              !(loadingCell.columnId === cell.columnId && loadingCell.rowIndex === cell.rowIndex)
            )
          );
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI");
      setIsLoading(false);
      // Clear all loading states
      selectedCells.forEach(cell => {
        setLoadingCells(prev => 
          prev.filter(loadingCell => 
            !(loadingCell.columnId === cell.columnId && loadingCell.rowIndex === cell.rowIndex)
          )
        );
      });
    }
  };

  const handleSavePrompt = async () => {
    try {
      await onUpdatePrompt(columnId, newPrompt);
      setShowPromptDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
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
              This prompt will be used for AI processing of cells in this column.
              Use {'{{'}<i>columnName</i>{'}}'}  to reference values from other columns.
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
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: 'translateY(-100%)',
        zIndex: 50,
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <Button
        size="sm"
        onClick={handleRunAi}
        disabled={isLoading || jobIds.size > 0}
        className="whitespace-nowrap"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        {isLoading || jobIds.size > 0 ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2" />
            Processing...
          </div>
        ) : (
          `Run AI ${selectedCellsCount > 1 ? `(${selectedCellsCount} cells)` : ''}`
        )}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
} 