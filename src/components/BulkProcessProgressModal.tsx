import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface BulkProcessProgressModalProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface BulkJobStatus {
  status: 'pending' | 'completed' | 'failed';
  totalCells: number;
  processedCells: number;
  successfulCells: number;
  failedCells: number;
  error?: string;
}

export function BulkProcessProgressModal({
  jobId,
  isOpen,
  onClose,
  onComplete,
}: BulkProcessProgressModalProps) {
  const [jobStatus, setJobStatus] = useState<BulkJobStatus | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/bulk/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job status');

        const status = await response.json();
        setJobStatus(status);

        // If job is completed or failed, stop polling
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
          // Call onComplete callback if job completed successfully
          if (status.status === 'completed' && onComplete) {
            onComplete();
          }
          // Auto close after 5 seconds
          setTimeout(onClose, 5000);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [jobId, isOpen, onClose, onComplete]);

  if (!jobStatus) return null;

  const progress = (jobStatus.processedCells / jobStatus.totalCells) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-4 right-4 w-[400px] m-0 translate-x-0 translate-y-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Bulk Processing Progress</h3>
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {jobStatus.processedCells} of {jobStatus.totalCells} cells
                processed
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="text-sm space-y-1">
            <p>Successfully processed: {jobStatus.successfulCells} cells</p>
            <p>Failed: {jobStatus.failedCells} cells</p>
            {jobStatus.error && (
              <p className="text-red-500">Error: {jobStatus.error}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
