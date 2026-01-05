import { Pause, Play, X, CheckCircle, XCircle, RefreshCw, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ImportStage, MediaFileState } from './types';
import { formatFileSize } from './whatsappZipProcessor';

interface WhatsAppImportProgressProps {
  stage: ImportStage;
  messagesImported: number;
  totalMessages: number;
  mediaUploaded: number;
  totalMedia: number;
  mediaFiles: MediaFileState[];
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryFile: (filename: string) => void;
  onSkipFile: (filename: string) => void;
}

const stageLabels: Record<ImportStage, string> = {
  idle: 'Ready',
  extracting: 'Extracting ZIP...',
  parsing: 'Parsing messages...',
  reviewing: 'Review import',
  resolving_duplicates: 'Resolving duplicates...',
  uploading_media: 'Uploading media...',
  importing_messages: 'Importing messages...',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
};

export function WhatsAppImportProgress({
  stage,
  messagesImported,
  totalMessages,
  mediaUploaded,
  totalMedia,
  mediaFiles,
  isPaused,
  onPause,
  onResume,
  onCancel,
  onRetryFile,
  onSkipFile,
}: WhatsAppImportProgressProps) {
  const isUploading = stage === 'uploading_media';
  const isImporting = stage === 'importing_messages';
  const isActive = isUploading || isImporting;

  const mediaProgress = totalMedia > 0 ? (mediaUploaded / totalMedia) * 100 : 0;
  const messageProgress = totalMessages > 0 ? (messagesImported / totalMessages) * 100 : 0;
  const overallProgress = isUploading ? mediaProgress * 0.6 : 60 + messageProgress * 0.4;

  return (
    <div className="space-y-4">
      {/* Header with stage and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && !isPaused && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <span className="font-medium">{stageLabels[stage]}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isActive && (
            <>
              {isPaused ? (
                <Button size="sm" variant="outline" onClick={onResume}>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
            </>
          )}
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <Progress value={overallProgress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(overallProgress)}%
        </p>
      </div>

      {/* Media files list */}
      {totalMedia > 0 && (
        <div className="border rounded-lg">
          <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
            <h4 className="text-sm font-medium">Media Files</h4>
            <span className="text-xs text-muted-foreground">
              {mediaUploaded} / {totalMedia}
            </span>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-2 space-y-1">
              {mediaFiles.map((file) => (
                <MediaFileItem
                  key={file.filename}
                  file={file}
                  onRetry={() => onRetryFile(file.filename)}
                  onSkip={() => onSkipFile(file.filename)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Message progress */}
      {isImporting && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Messages</span>
            <span className="text-sm text-muted-foreground">
              {messagesImported} / {totalMessages}
            </span>
          </div>
          <Progress value={messageProgress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

function MediaFileItem({
  file,
  onRetry,
  onSkip,
}: {
  file: MediaFileState;
  onRetry: () => void;
  onSkip: () => void;
}) {
  const statusIcons = {
    pending: <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />,
    uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    uploaded: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-destructive" />,
    skipped: <SkipForward className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
      {statusIcons[file.status]}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{file.filename}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
          {file.type && (
            <Badge variant="outline" className="text-xs">
              {file.type}
            </Badge>
          )}
          {file.error && (
            <span className="text-xs text-destructive truncate">
              {file.error}
            </span>
          )}
        </div>
      </div>

      {file.status === 'failed' && (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSkip}>
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>
      )}

      {file.status === 'uploading' && file.progress !== undefined && (
        <span className="text-xs text-muted-foreground">
          {file.progress}%
        </span>
      )}
    </div>
  );
}
