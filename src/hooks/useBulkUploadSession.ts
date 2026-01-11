/**
 * Bulk Upload Session Hook
 * Manages upload session lifecycle with pause/resume/retry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  processFiles, 
  type ProcessedFile, 
  getBatchStats,
  formatFileSize 
} from '@/lib/bulkUpload/bulkFileProcessor';
import { 
  BulkUploadQueue, 
  createUploadQueue,
  type UploadItem,
  type QueueStatus 
} from '@/lib/bulkUpload/uploadQueue';
import { extractZipFile, previewZipContents, extractedFilesToFiles } from '@/lib/bulkUpload/zipExtractor';

export interface BulkUploadSession {
  id: string;
  status: QueueStatus;
  sourceType: 'file_selection' | 'zip_extraction' | 'folder_drop';
  profileId?: string;
  profileName?: string;
  autoAnalyze: boolean;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  progress: number;
  items: UploadItem[];
  createdAt: Date;
  startedAt?: Date;
}

export function useBulkUploadSession() {
  const { toast } = useToast();
  const [session, setSession] = useState<BulkUploadSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const queueRef = useRef<BulkUploadQueue | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id || null;
    });
  }, []);

  const createSession = useCallback(async (
    files: File[],
    options: {
      sourceType?: 'file_selection' | 'zip_extraction' | 'folder_drop';
      profileId?: string;
      profileName?: string;
      autoAnalyze?: boolean;
    } = {}
  ) => {
    if (!userIdRef.current) {
      toast({ title: 'Error', description: 'Please sign in to upload files', variant: 'destructive' });
      return null;
    }

    setIsPreparing(true);

    try {
      // Process files
      const processed = await processFiles(files, {
        userId: userIdRef.current,
        profileId: options.profileId,
        generateHashes: true,
      });

      const stats = getBatchStats(processed);

      // Create database session
      const { data: dbSession, error } = await (supabase as any)
        .from('bulk_upload_sessions')
        .insert({
          user_id: userIdRef.current,
          profile_id: options.profileId,
          source_type: options.sourceType || 'file_selection',
          status: 'preparing',
          total_files: stats.totalFiles,
          total_bytes: stats.totalBytes,
          auto_analyze: options.autoAnalyze || false,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create database items
      const itemInserts = processed.map((p, i) => ({
        session_id: dbSession.id,
        user_id: userIdRef.current,
        filename: p.filename,
        original_path: p.originalPath,
        file_size: p.fileSize,
        mime_type: p.mimeType,
        file_type: p.category,
        status: p.isValid ? 'pending' : 'skipped',
        error_message: p.validationError,
        sort_order: i,
      }));

      const { data: dbItems } = await (supabase as any)
        .from('bulk_upload_items')
        .insert(itemInserts)
        .select('id, sort_order');

      // Map db IDs to processed files
      if (dbItems) {
        for (const dbItem of dbItems) {
          const p = processed[dbItem.sort_order];
          if (p) (p as any).dbItemId = dbItem.id;
        }
      }

      // Create queue
      const queue = createUploadQueue({
        maxConcurrent: 3,
        minDelayMs: 200,
        maxRetries: 3,
        onProgress: (item) => updateSessionFromQueue(),
        onItemComplete: (item) => updateSessionFromQueue(),
        onItemFailed: (item) => updateSessionFromQueue(),
        onQueueComplete: () => {
          toast({ title: 'Upload Complete', description: `${stats.validFiles} files uploaded successfully` });
        },
        onStatusChange: (status) => {
          setSession(prev => prev ? { ...prev, status } : null);
        },
      });

      queue.initialize(
        processed,
        dbSession.id,
        userIdRef.current,
        options.profileId,
        options.autoAnalyze
      );

      queueRef.current = queue;

      const newSession: BulkUploadSession = {
        id: dbSession.id,
        status: 'idle',
        sourceType: options.sourceType || 'file_selection',
        profileId: options.profileId,
        profileName: options.profileName,
        autoAnalyze: options.autoAnalyze || false,
        totalFiles: stats.totalFiles,
        completedFiles: 0,
        failedFiles: 0,
        skippedFiles: stats.invalidFiles,
        totalBytes: stats.totalBytes,
        uploadedBytes: 0,
        progress: 0,
        items: queue.getStatus().items,
        createdAt: new Date(),
      };

      setSession(newSession);
      return newSession;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setIsPreparing(false);
    }
  }, [toast]);

  const updateSessionFromQueue = useCallback(() => {
    if (!queueRef.current) return;
    const status = queueRef.current.getStatus();
    setSession(prev => prev ? {
      ...prev,
      status: status.status,
      completedFiles: status.completed,
      failedFiles: status.failed,
      skippedFiles: status.skipped,
      progress: status.progress,
      items: status.items,
    } : null);
  }, []);

  const start = useCallback(async () => {
    if (!queueRef.current || !session) return;
    setIsProcessing(true);
    await (supabase as any)
      .from('bulk_upload_sessions')
      .update({ status: 'uploading', started_at: new Date().toISOString() })
      .eq('id', session.id);
    await queueRef.current.start();
    setIsProcessing(false);
  }, [session]);

  const pause = useCallback(() => {
    queueRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await queueRef.current?.resume();
  }, []);

  const cancel = useCallback(() => {
    queueRef.current?.cancel();
  }, []);

  const retryItem = useCallback(async (itemId: string) => {
    await queueRef.current?.retryItem(itemId);
  }, []);

  const skipItem = useCallback((itemId: string) => {
    queueRef.current?.skipItem(itemId);
    updateSessionFromQueue();
  }, [updateSessionFromQueue]);

  const retryAllFailed = useCallback(async () => {
    await queueRef.current?.retryAllFailed();
  }, []);

  const reset = useCallback(() => {
    queueRef.current = null;
    setSession(null);
    setIsProcessing(false);
  }, []);

  return {
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
    reset,
    formatFileSize,
  };
}
