/**
 * BulkUploadProgress - Detailed progress view for bulk uploads
 */

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  SkipForward, 
  Clock,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { BulkUploadFileItem, FileItemStatus } from './BulkUploadFileItem';
import { formatFileSize } from '@/lib/bulkUpload';

export interface UploadItem {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: FileItemStatus;
  progress: number;
  errorMessage?: string;
}

interface BulkUploadProgressProps {
  items: UploadItem[];
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  isUploading: boolean;
  isPaused: boolean;
  startedAt?: Date | null;
  onRetryFile: (id: string) => void;
  onSkipFile: (id: string) => void;
  onRetryAllFailed: () => void;
}

export function BulkUploadProgress({
  items,
  totalFiles,
  completedFiles,
  failedFiles,
  skippedFiles,
  totalBytes,
  uploadedBytes,
  isUploading,
  isPaused,
  startedAt,
  onRetryFile,
  onSkipFile,
  onRetryAllFailed
}: BulkUploadProgressProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const pending = items.filter(i => i.status === 'pending').length;
    const uploading = items.filter(i => i.status === 'uploading').length;
    const uploaded = items.filter(i => i.status === 'uploaded').length;
    const failed = items.filter(i => i.status === 'failed').length;
    const skipped = items.filter(i => i.status === 'skipped').length;
    const duplicate = items.filter(i => i.status === 'duplicate').length;

    const overallProgress = totalFiles > 0 
      ? Math.round(((uploaded + skipped + duplicate) / totalFiles) * 100)
      : 0;

    const bytesProgress = totalBytes > 0
      ? Math.round((uploadedBytes / totalBytes) * 100)
      : 0;

    return {
      pending,
      uploading,
      uploaded,
      failed,
      skipped,
      duplicate,
      overallProgress,
      bytesProgress
    };
  }, [items, totalFiles, totalBytes, uploadedBytes]);

  // Elapsed time
  const elapsedTime = useMemo(() => {
    if (!startedAt) return null;
    const elapsed = Date.now() - startedAt.getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }, [startedAt]);

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground">
            {stats.uploaded + stats.skipped + stats.duplicate} / {totalFiles} files
          </span>
        </div>
        <Progress value={stats.overallProgress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}</span>
          <span>{stats.bytesProgress}%</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{stats.uploaded}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-destructive" />
            <span>{stats.failed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SkipForward className="h-4 w-4 text-muted-foreground" />
            <span>{stats.skipped + stats.duplicate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{stats.pending}</span>
          </div>
        </div>
        
        {elapsedTime && (
          <div className="text-xs text-muted-foreground">
            Elapsed: {elapsedTime}
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm">
          {isPaused ? (
            <>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-yellow-600">Paused</span>
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-muted-foreground">
                Uploading {stats.uploading} file{stats.uploading !== 1 ? 's' : ''}...
              </span>
            </>
          )}
        </div>
      )}

      {/* Retry All Failed Button */}
      {stats.failed > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetryAllFailed}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry All Failed ({stats.failed})
        </Button>
      )}

      <Separator />

      {/* File List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {items.map((item) => (
            <BulkUploadFileItem
              key={item.id}
              {...item}
              onRetry={onRetryFile}
              onSkip={onSkipFile}
              disabled={!isUploading || isPaused}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
