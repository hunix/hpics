/**
 * BulkUploadDialog - Full-featured bulk upload dialog
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  X,
  Upload,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { UploadSourceSelector, UploadSourceType } from './UploadSourceSelector';
import { ContactLinkSelector } from './ContactLinkSelector';
import { BulkUploadProgress, UploadItem } from './BulkUploadProgress';
import { useBulkUploadSession } from '@/hooks/useBulkUploadSession';
import { extractZipFile, extractedFilesToFiles } from '@/lib/bulkUpload/zipExtractor';
import { formatFileSize } from '@/lib/bulkUpload';
import { toast } from 'sonner';

interface Contact {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  company?: string | null;
  title?: string | null;
}

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: string | null;
  onComplete?: (sessionId: string) => void;
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  defaultContactId,
  onComplete
}: BulkUploadDialogProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const {
    session,
    isProcessing,
    isPreparing,
    createSession,
    start,
    pause,
    resume,
    cancel,
    retryItem,
    skipItem,
    retryAllFailed,
    reset
  } = useBulkUploadSession();

  // Set default contact if provided
  useEffect(() => {
    if (defaultContactId && open) {
      setSelectedContact({ id: defaultContactId } as Contact);
    }
  }, [defaultContactId, open]);

  // Handle file selection
  const handleFilesSelected = useCallback(async (files: File[], sourceType: UploadSourceType) => {
    try {
      let filesToUpload = files;

      if (sourceType === 'zip' && files.length === 1) {
        setIsProcessingZip(true);
        try {
          const extracted = await extractZipFile(files[0], {}, (progress, currentFile) => {
            console.log(`ZIP extraction: ${progress}% - ${currentFile}`);
          });
          filesToUpload = extractedFilesToFiles(extracted.files);
          toast.success(`Extracted ${extracted.files.length} files from ZIP`);
        } catch (error) {
          console.error('ZIP extraction error:', error);
          toast.error('Failed to extract ZIP file');
          setIsProcessingZip(false);
          return;
        }
        setIsProcessingZip(false);
      }

      const supportedFiles = filesToUpload.filter(file => {
        if (file.name.startsWith('.') || file.name.startsWith('__MACOSX')) {
          return false;
        }
        return true;
      });

      if (supportedFiles.length === 0) {
        toast.error('No supported files found');
        return;
      }

      setPendingFiles(supportedFiles);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    }
  }, []);

  const handleStartUpload = useCallback(async () => {
    try {
      const newSession = await createSession(pendingFiles, {
        sourceType: 'file_selection',
        profileId: selectedContact?.id,
        profileName: selectedContact?.full_name,
        autoAnalyze
      });

      if (newSession) {
        await start();
      }
    } catch (error) {
      console.error('Error starting upload:', error);
      toast.error('Failed to start upload');
    }
  }, [createSession, start, pendingFiles, selectedContact, autoAnalyze]);

  const handleCancel = useCallback(() => {
    cancel();
    reset();
    setPendingFiles([]);
    onOpenChange(false);
  }, [cancel, reset, onOpenChange]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && session && (session.status === 'running' || session.status === 'paused')) {
      return;
    }
    
    if (!newOpen) {
      reset();
      setPendingFiles([]);
      setSelectedContact(null);
      setAutoAnalyze(false);
    }
    
    onOpenChange(newOpen);
  }, [session, onOpenChange, reset]);

  useEffect(() => {
    if (session?.status === 'completed' && session?.id) {
      toast.success('Bulk upload completed!');
      onComplete?.(session.id);
    }
  }, [session?.status, session?.id, onComplete]);

  const displayItems: UploadItem[] = session?.items?.map(item => ({
    id: item.id,
    filename: item.filename,
    fileSize: item.fileSize,
    mimeType: item.mimeType || 'application/octet-stream',
    status: item.status as UploadItem['status'],
    progress: item.progress,
    errorMessage: item.error || undefined
  })) || [];

  const totalFiles = session?.totalFiles || pendingFiles.length;
  const completedFiles = session?.completedFiles || 0;
  const failedFiles = session?.failedFiles || 0;
  const skippedFiles = session?.skippedFiles || 0;
  const totalBytes = session?.totalBytes || pendingFiles.reduce((sum, f) => sum + f.size, 0);
  const uploadedBytes = session?.uploadedBytes || 0;

  const isIdle = !session || session.status === 'idle';
  const isUploading = session?.status === 'running';
  const isPaused = session?.status === 'paused';
  const isCompleted = session?.status === 'completed';
  const isFailed = session?.status === 'cancelled';

  const hasFiles = pendingFiles.length > 0 || (session?.items?.length || 0) > 0;
  const canStart = hasFiles && isIdle && !isPreparing && !isProcessing;
  const canPause = isUploading;
  const canResume = isPaused;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload
          </DialogTitle>
          <DialogDescription>
            Upload multiple files at once. Files will be automatically organized by type.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {!hasFiles && !isUploading && (
            <>
              <UploadSourceSelector
                onFilesSelected={handleFilesSelected}
                disabled={!!isUploading}
                isProcessing={isProcessingZip || isPreparing}
              />
              <Separator />
              <ContactLinkSelector
                selectedContactId={selectedContact?.id}
                onContactSelect={setSelectedContact}
                disabled={!!isUploading}
              />
            </>
          )}

          {hasFiles && !isUploading && !isPaused && !isCompleted && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{totalFiles}</strong> files selected ({formatFileSize(totalBytes)})
                {selectedContact && (
                  <span className="ml-1">
                    — will be linked to <strong>{selectedContact.full_name}</strong>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {hasFiles && !isUploading && !isPaused && !isCompleted && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <Label htmlFor="auto-analyze" className="font-medium cursor-pointer">
                    Analyze with AI after upload
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Queue files for automatic AI analysis
                  </p>
                </div>
              </div>
              <Switch id="auto-analyze" checked={autoAnalyze} onCheckedChange={setAutoAnalyze} />
            </div>
          )}

          {(isUploading || isPaused || isCompleted || isFailed) && (
            <BulkUploadProgress
              items={displayItems}
              totalFiles={totalFiles}
              completedFiles={completedFiles}
              failedFiles={failedFiles}
              skippedFiles={skippedFiles}
              totalBytes={totalBytes}
              uploadedBytes={uploadedBytes}
              isUploading={isUploading || isPaused}
              isPaused={!!isPaused}
              startedAt={session?.startedAt || null}
              onRetryFile={retryItem}
              onSkipFile={skipItem}
              onRetryAllFailed={retryAllFailed}
            />
          )}

          {isFailed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Upload session failed. You can retry failed files or cancel.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            {isUploading || isPaused ? 'Cancel' : 'Close'}
          </Button>

          {canPause && (
            <Button variant="secondary" onClick={pause}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {canResume && (
            <Button variant="secondary" onClick={resume}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}

          {canStart && (
            <Button onClick={handleStartUpload} disabled={isPreparing || isProcessing}>
              <Upload className="h-4 w-4 mr-2" />
              {isPreparing ? 'Preparing...' : 'Start Upload'}
            </Button>
          )}

          {isCompleted && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
