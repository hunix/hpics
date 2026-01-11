/**
 * BulkUploadFileItem - Individual file row in bulk upload list
 */

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  FileAudio, 
  FileText, 
  File,
  RotateCcw,
  SkipForward,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileCategory, formatFileSize } from '@/lib/bulkUpload';

export type FileItemStatus = 
  | 'pending' 
  | 'uploading' 
  | 'uploaded' 
  | 'failed' 
  | 'skipped' 
  | 'duplicate';

export interface BulkUploadFileItemProps {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: FileItemStatus;
  progress: number;
  errorMessage?: string;
  onRetry?: (id: string) => void;
  onSkip?: (id: string) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

const getFileIcon = (mimeType: string) => {
  const category = getFileCategory(mimeType);
  switch (category) {
    case 'image':
      return <Image className="h-4 w-4 text-blue-500" />;
    case 'video':
      return <Video className="h-4 w-4 text-purple-500" />;
    case 'audio':
      return <FileAudio className="h-4 w-4 text-green-500" />;
    case 'document':
      return <FileText className="h-4 w-4 text-orange-500" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: FileItemStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="text-xs">Pending</Badge>;
    case 'uploading':
      return <Badge variant="secondary" className="text-xs">Uploading</Badge>;
    case 'uploaded':
      return (
        <Badge variant="default" className="text-xs bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Done
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'skipped':
      return <Badge variant="outline" className="text-xs text-muted-foreground">Skipped</Badge>;
    case 'duplicate':
      return (
        <Badge variant="outline" className="text-xs text-yellow-600">
          <Copy className="h-3 w-3 mr-1" />
          Duplicate
        </Badge>
      );
    default:
      return null;
  }
};

export function BulkUploadFileItem({
  id,
  filename,
  fileSize,
  mimeType,
  status,
  progress,
  errorMessage,
  onRetry,
  onSkip,
  onRemove,
  disabled = false
}: BulkUploadFileItemProps) {
  const isUploading = status === 'uploading';
  const canRetry = status === 'failed';
  const canSkip = status === 'failed' || status === 'pending';
  const canRemove = status === 'pending';

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card",
        status === 'failed' && "border-destructive/50 bg-destructive/5",
        status === 'uploaded' && "border-green-500/30 bg-green-500/5",
        status === 'skipped' && "opacity-50",
        status === 'duplicate' && "border-yellow-500/30 bg-yellow-500/5"
      )}
    >
      {/* File Icon */}
      <div className="flex-shrink-0">
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          getFileIcon(mimeType)
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium truncate" 
            title={filename}
          >
            {filename}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatFileSize(fileSize)}
          </span>
        </div>

        {/* Progress Bar for uploading */}
        {isUploading && (
          <div className="mt-1">
            <Progress value={progress} className="h-1" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        )}

        {/* Error Message */}
        {status === 'failed' && errorMessage && (
          <p className="text-xs text-destructive mt-1 truncate" title={errorMessage}>
            {errorMessage}
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        {getStatusBadge(status)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {canRetry && onRetry && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRetry(id)}
            disabled={disabled}
            title="Retry upload"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {canSkip && onSkip && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onSkip(id)}
            disabled={disabled}
            title="Skip file"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        )}
        {canRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(id)}
            disabled={disabled}
            title="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
