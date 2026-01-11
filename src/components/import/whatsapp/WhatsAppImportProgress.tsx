import { Pause, Play, X, CheckCircle, XCircle, RefreshCw, SkipForward, Loader2, Cloud, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ImportStage, MediaFileState, ServerSideProgress } from './types';
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
  isServerSide?: boolean;
  serverProgress?: ServerSideProgress | null;
}

const stageLabels: Record<ImportStage, string> = {
  idle: 'Ready',
  selecting_mode: 'Selecting processing mode...',
  extracting: 'Extracting ZIP...',
  parsing: 'Parsing messages...',
  reviewing: 'Review import',
  resolving_duplicates: 'Resolving duplicates...',
  uploading_zip: 'Uploading ZIP file...',
  server_processing: 'Server processing...',
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
  isServerSide = false,
  serverProgress,
}: WhatsAppImportProgressProps) {
  const isUploading = stage === 'uploading_media';
  const isImporting = stage === 'importing_messages';
  const isUploadingZip = stage === 'uploading_zip';
  const isServerProcessing = stage === 'server_processing';
  const isActive = isUploading || isImporting || isUploadingZip || isServerProcessing;

  // Calculate progress based on mode
  const mediaProgress = totalMedia > 0 ? (mediaUploaded / totalMedia) * 100 : 0;
  const messageProgress = totalMessages > 0 ? (messagesImported / totalMessages) * 100 : 0;
  
  let overallProgress: number;
  if (isServerSide && serverProgress) {
    if (serverProgress.stage === 'uploading_zip') {
      overallProgress = serverProgress.totalBytes > 0 
        ? (serverProgress.bytesProcessed / serverProgress.totalBytes) * 20 
        : 0;
    } else if (serverProgress.stage === 'extracting') {
      overallProgress = 20 + (serverProgress.totalFiles > 0 
        ? (serverProgress.filesProcessed / serverProgress.totalFiles) * 20 
        : 0);
    } else if (serverProgress.stage === 'uploading_media') {
      overallProgress = 40 + mediaProgress * 0.4;
    } else if (serverProgress.stage === 'importing_messages') {
      overallProgress = 80 + messageProgress * 0.2;
    } else if (serverProgress.stage === 'completed') {
      overallProgress = 100;
    } else {
      overallProgress = 0;
    }
  } else {
    overallProgress = isUploading ? mediaProgress * 0.6 : 60 + messageProgress * 0.4;
  }

  return (
    <div className="space-y-4">
      {/* Header with stage and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && !isPaused && (
            <>
              {isServerSide ? (
                <Cloud className="h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </>
          )}
          <span className="font-medium">{stageLabels[stage]}</span>
          {isServerSide && (
            <Badge variant="outline" className="text-xs">Server</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isActive && !isServerSide && (
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

      {/* Server-side progress details */}
      {isServerSide && serverProgress && (
        <div className="space-y-3">
          {/* ZIP upload progress */}
          {serverProgress.stage === 'uploading_zip' && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-sm">Uploading ZIP file...</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(serverProgress.bytesProcessed)} / {formatFileSize(serverProgress.totalBytes)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {serverProgress.totalBytes > 0 
                    ? Math.round((serverProgress.bytesProcessed / serverProgress.totalBytes) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={serverProgress.totalBytes > 0 
                  ? (serverProgress.bytesProcessed / serverProgress.totalBytes) * 100 
                  : 0} 
                className="h-1.5" 
              />
            </div>
          )}
          
          {/* Extraction progress */}
          {serverProgress.stage === 'extracting' && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Extracting files...</span>
                {serverProgress.currentFile && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {serverProgress.currentFile}
                  </span>
                )}
              </div>
              <Progress 
                value={serverProgress.totalFiles > 0 
                  ? (serverProgress.filesProcessed / serverProgress.totalFiles) * 100 
                  : 0} 
                className="h-1.5" 
              />
            </div>
          )}
          
          {/* Media upload progress (server-side) */}
          {serverProgress.stage === 'uploading_media' && serverProgress.totalFiles > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Uploading media...</span>
                <span className="text-sm text-muted-foreground">
                  {serverProgress.filesProcessed} / {serverProgress.totalFiles}
                </span>
              </div>
              <Progress value={mediaProgress} className="h-1.5" />
            </div>
          )}
          
          {/* Message import progress (server-side) */}
          {serverProgress.stage === 'importing_messages' && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Importing messages...</span>
                <span className="text-sm text-muted-foreground">
                  {serverProgress.messagesProcessed} / {serverProgress.totalMessages}
                </span>
              </div>
              <Progress value={messageProgress} className="h-1.5" />
            </div>
          )}
        </div>
      )}

      {/* Media files list (client-side only) */}
      {!isServerSide && totalMedia > 0 && (
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

      {/* Message progress (client-side only) */}
      {!isServerSide && isImporting && (
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
