/**
 * BulkUploadDialog - Full-featured bulk upload dialog with all enhancements
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  X,
  Upload,
  AlertTriangle,
  Sparkles,
  Info,
  History,
  Filter,
  FolderTree
} from 'lucide-react';
import { UploadSourceSelector, UploadSourceType, FolderEntry } from './UploadSourceSelector';
import { ContactLinkSelector } from './ContactLinkSelector';
import { BulkUploadProgress, UploadItem } from './BulkUploadProgress';
import { UploadHistoryPanel } from './UploadHistoryPanel';
import { AdvancedFileFilter } from './AdvancedFileFilter';
import { FolderStructurePreview } from './FolderStructurePreview';
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

interface PendingFile {
  file: File;
  path: string;
  selected: boolean;
}

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: string | null;
  defaultFileFilter?: 'all' | 'images' | 'documents' | 'audio' | 'video';
  onComplete?: (sessionId: string) => void;
}

const FILE_FILTER_ACCEPT: Record<string, string> = {
  all: '*/*',
  images: 'image/*',
  documents: '.pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx',
  audio: 'audio/*',
  video: 'video/*',
};

export function BulkUploadDialog({
  open,
  onOpenChange,
  defaultContactId,
  defaultFileFilter = 'all',
  onComplete
}: BulkUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [folderStructure, setFolderStructure] = useState<FolderEntry[] | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showFolderPreview, setShowFolderPreview] = useState(false);
  
  const {
    session,
    isProcessing,
    isPreparing,
    speedStats,
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
  const handleFilesSelected = useCallback(async (
    files: File[], 
    sourceType: UploadSourceType,
    structure?: FolderEntry[]
  ) => {
    try {
      let filesToUpload = files;
      let folderEntries: FolderEntry[] | null = structure || null;

      if (sourceType === 'zip' && files.length === 1) {
        setIsProcessingZip(true);
        try {
          const extracted = await extractZipFile(files[0], {}, (progress, currentFile) => {
            console.log(`ZIP extraction: ${progress}% - ${currentFile}`);
          });
          filesToUpload = extractedFilesToFiles(extracted.files);
          folderEntries = extracted.files.map(f => ({ file: f.file, path: f.path }));
          toast.success(`Extracted ${extracted.files.length} files from ZIP`);
        } catch (error) {
          console.error('ZIP extraction error:', error);
          toast.error('Failed to extract ZIP file');
          setIsProcessingZip(false);
          return;
        }
        setIsProcessingZip(false);
      }

      // Filter based on defaultFileFilter
      let supportedFiles = filesToUpload.filter(file => {
        if (file.name.startsWith('.') || file.name.startsWith('__MACOSX')) {
          return false;
        }
        
        if (defaultFileFilter === 'all') return true;
        
        const type = file.type.toLowerCase();
        switch (defaultFileFilter) {
          case 'images':
            return type.startsWith('image/');
          case 'documents':
            return type.startsWith('application/pdf') || 
                   type.includes('document') ||
                   type.includes('text') ||
                   type.includes('spreadsheet') ||
                   type.includes('presentation');
          case 'audio':
            return type.startsWith('audio/');
          case 'video':
            return type.startsWith('video/');
          default:
            return true;
        }
      });

      if (supportedFiles.length === 0) {
        toast.error('No supported files found');
        return;
      }

      // Create pending files with selection state
      const pending: PendingFile[] = supportedFiles.map((file, index) => ({
        file,
        path: folderEntries?.[index]?.path || file.name,
        selected: true,
      }));

      setPendingFiles(pending);
      setFolderStructure(folderEntries);
      
      // Show folder preview if there's folder structure
      if (folderEntries && folderEntries.length > 0) {
        const hasFolders = folderEntries.some(e => e.path.includes('/'));
        setShowFolderPreview(hasFolders);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    }
  }, [defaultFileFilter]);

  // Handle filter changes
  const handleFilterChange = useCallback((filteredFiles: PendingFile[]) => {
    setPendingFiles(filteredFiles);
  }, []);

  // Handle folder selection toggle
  const handleFolderToggle = useCallback((path: string, selected: boolean) => {
    setPendingFiles(prev => prev.map(f => {
      if (f.path.startsWith(path + '/') || f.path === path) {
        return { ...f, selected };
      }
      return f;
    }));
  }, []);

  const handleStartUpload = useCallback(async () => {
    try {
      const selectedFiles = pendingFiles.filter(f => f.selected);
      if (selectedFiles.length === 0) {
        toast.error('No files selected');
        return;
      }

      const files = selectedFiles.map(f => f.file);
      const structure = selectedFiles.map(f => ({ file: f.file, path: f.path }));

      const newSession = await createSession(files, {
        sourceType: folderStructure ? 'folder_drop' : 'file_selection',
        profileId: selectedContact?.id,
        profileName: selectedContact?.full_name,
        autoAnalyze,
        folderStructure: structure,
      });

      if (newSession) {
        await start();
      }
    } catch (error) {
      console.error('Error starting upload:', error);
      toast.error('Failed to start upload');
    }
  }, [createSession, start, pendingFiles, selectedContact, autoAnalyze, folderStructure]);

  const handleCancel = useCallback(() => {
    cancel();
    reset();
    setPendingFiles([]);
    setFolderStructure(null);
    setShowAdvancedFilter(false);
    setShowFolderPreview(false);
    onOpenChange(false);
  }, [cancel, reset, onOpenChange]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && session && (session.status === 'running' || session.status === 'paused')) {
      return;
    }
    
    if (!newOpen) {
      reset();
      setPendingFiles([]);
      setFolderStructure(null);
      setSelectedContact(null);
      setAutoAnalyze(false);
      setShowAdvancedFilter(false);
      setShowFolderPreview(false);
      setActiveTab('upload');
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

  const selectedPendingFiles = pendingFiles.filter(f => f.selected);
  const totalFiles = session?.totalFiles || selectedPendingFiles.length;
  const completedFiles = session?.completedFiles || 0;
  const failedFiles = session?.failedFiles || 0;
  const skippedFiles = session?.skippedFiles || 0;
  const totalBytes = session?.totalBytes || selectedPendingFiles.reduce((sum, f) => sum + f.file.size, 0);
  const uploadedBytes = session?.uploadedBytes || 0;

  const isIdle = !session || session.status === 'idle';
  const isUploading = session?.status === 'running';
  const isPaused = session?.status === 'paused';
  const isCompleted = session?.status === 'completed';
  const isFailed = session?.status === 'cancelled';

  const hasFiles = pendingFiles.length > 0 || (session?.items?.length || 0) > 0;
  const canStart = selectedPendingFiles.length > 0 && isIdle && !isPreparing && !isProcessing;
  const canPause = isUploading;
  const canResume = isPaused;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload
          </DialogTitle>
          <DialogDescription>
            Upload multiple files at once. Files will be automatically organized by type.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'history')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 overflow-y-auto space-y-4 py-4">
            {!hasFiles && !isUploading && (
              <>
                <UploadSourceSelector
                  onFilesSelected={handleFilesSelected}
                  disabled={!!isUploading}
                  isProcessing={isProcessingZip || isPreparing}
                  acceptFilter={FILE_FILTER_ACCEPT[defaultFileFilter]}
                />
                <Separator />
                <ContactLinkSelector
                  selectedContactId={selectedContact?.id}
                  onContactSelect={setSelectedContact}
                  disabled={!!isUploading}
                />
              </>
            )}

            {/* File selection info with filter/preview toggles */}
            {hasFiles && !isUploading && !isPaused && !isCompleted && (
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      <strong>{selectedPendingFiles.length}</strong> of {pendingFiles.length} files selected ({formatFileSize(totalBytes)})
                      {selectedContact && (
                        <span className="ml-1">
                          — linked to <strong>{selectedContact.full_name}</strong>
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {folderStructure && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFolderPreview(!showFolderPreview)}
                        >
                          <FolderTree className="h-4 w-4 mr-1" />
                          {showFolderPreview ? 'Hide' : 'Show'} Folders
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                      >
                        <Filter className="h-4 w-4 mr-1" />
                        {showAdvancedFilter ? 'Hide' : 'Show'} Filter
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Folder Structure Preview */}
                {showFolderPreview && folderStructure && (
                  <FolderStructurePreview
                    files={pendingFiles.map(f => ({ path: f.path, selected: f.selected }))}
                    onToggleFolder={handleFolderToggle}
                  />
                )}

                {/* Advanced Filter */}
                {showAdvancedFilter && (
                  <AdvancedFileFilter
                    files={pendingFiles}
                    onFilterChange={handleFilterChange}
                  />
                )}
              </div>
            )}

            {/* Auto-analyze toggle */}
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

            {/* Progress view */}
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
                speedStats={speedStats}
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
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto py-4">
            <UploadHistoryPanel />
          </TabsContent>
        </Tabs>

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

          {canStart && activeTab === 'upload' && (
            <Button onClick={handleStartUpload} disabled={isPreparing || isProcessing}>
              <Upload className="h-4 w-4 mr-2" />
              {isPreparing ? 'Preparing...' : `Upload ${selectedPendingFiles.length} Files`}
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