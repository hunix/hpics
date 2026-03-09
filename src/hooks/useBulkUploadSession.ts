/**
 * Bulk Upload Session Hook
 * Manages upload session lifecycle with pause/resume/retry and realtime updates
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
  type QueueStatus,
  type SpeedStats
} from '@/lib/bulkUpload/uploadQueue';
import type { FolderEntry } from '@/components/uploads/UploadSourceSelector';

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
  speedStats?: SpeedStats;
}

export interface BulkUploadHistorySession {
  id: string;
  status: string;
  sourceType: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  profileId?: string;
  profileName?: string;
  resumableUntil?: Date;
}

export function useBulkUploadSession() {
  const { toast } = useToast();
  const [session, setSession] = useState<BulkUploadSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [speedStats, setSpeedStats] = useState<SpeedStats | null>(null);
  const queueRef = useRef<BulkUploadQueue | null>(null);
  const userIdRef = useRef<string | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id || null;
    });
  }, []);

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // Subscribe to realtime updates for session
  const subscribeToSession = useCallback((sessionId: string) => {
    // Unsubscribe from previous channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    realtimeChannelRef.current = supabase
      .channel(`bulk_upload_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bulk_upload_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          // Update session from external changes (e.g., edge function)
          const data = payload.new as any;
          setSession(prev => prev ? {
            ...prev,
            status: data.status as QueueStatus,
            completedFiles: data.completed_files,
            failedFiles: data.failed_files,
            skippedFiles: data.skipped_files,
            uploadedBytes: data.uploaded_bytes,
          } : null);
        }
      )
      .subscribe();
  }, []);

  const createSession = useCallback(async (
    files: File[],
    options: {
      sourceType?: 'file_selection' | 'zip_extraction' | 'folder_drop';
      profileId?: string;
      profileName?: string;
      autoAnalyze?: boolean;
      folderStructure?: FolderEntry[];
    } = {}
  ) => {
    if (!userIdRef.current) {
      toast({ title: 'Error', description: 'Please sign in to upload files', variant: 'destructive' });
      return null;
    }

    setIsPreparing(true);

    try {
      // Build original paths map from folder structure
      const originalPaths = new Map<string, string>();
      if (options.folderStructure) {
        for (const entry of options.folderStructure) {
          originalPaths.set(entry.file.name, entry.path);
        }
      }

      // Process files with original paths
      const processed = await processFiles(files, {
        userId: userIdRef.current,
        profileId: options.profileId,
        generateHashes: true,
        preserveFolderStructure: !!options.folderStructure,
      }, (processed, total) => {
        // Progress callback - could add progress state here
      });

      // Attach original paths to processed files
      for (const p of processed) {
        const originalPath = originalPaths.get(p.filename);
        if (originalPath) {
          (p as any).originalPath = originalPath;
        }
      }

      const stats = getBatchStats(processed);

      // Create database session with resumability window (24 hours)
      const resumableUntil = new Date();
      resumableUntil.setHours(resumableUntil.getHours() + 24);

      const { data: dbSession, error } = await supabase
        .from('bulk_upload_sessions')
        .insert({
          user_id: userIdRef.current,
          profile_id: options.profileId,
          source_type: options.sourceType || 'file_selection',
          status: 'preparing',
          total_files: stats.totalFiles,
          total_bytes: stats.totalBytes,
          auto_analyze: options.autoAnalyze || false,
          resumable_until: resumableUntil.toISOString(),
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
        content_hash: p.contentHash,
        status: p.isValid ? 'pending' : 'skipped',
        error_message: p.validationError,
        sort_order: i,
      }));

      const { data: dbItems } = await supabase
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

      // Create queue with speed tracking
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
        onSpeedUpdate: (stats) => {
          setSpeedStats(stats);
          setSession(prev => prev ? { ...prev, speedStats: stats } : null);
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

      // Subscribe to realtime updates
      subscribeToSession(dbSession.id);

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
  }, [toast, subscribeToSession]);

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
      uploadedBytes: status.uploadedBytes,
      speedStats: status.speedStats,
    } : null);
  }, []);

  const start = useCallback(async () => {
    if (!queueRef.current || !session) return;
    setIsProcessing(true);
    setSession(prev => prev ? { ...prev, startedAt: new Date() } : null);
    await supabase
      .from('bulk_upload_sessions')
      .update({ 
        status: 'uploading', 
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', session.id);
    await queueRef.current.start();
    setIsProcessing(false);
  }, [session]);

  const pause = useCallback(() => {
    queueRef.current?.pause();
    if (session?.id) {
      supabase
        .from('bulk_upload_sessions')
        .update({ 
          status: 'paused',
          paused_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }
  }, [session]);

  const resume = useCallback(async () => {
    if (session?.id) {
      await (supabase as any)
        .from('bulk_upload_sessions')
        .update({ 
          status: 'uploading',
          paused_at: null,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }
    await queueRef.current?.resume();
  }, [session]);

  const cancel = useCallback(() => {
    queueRef.current?.cancel();
    if (session?.id) {
      (supabase as any)
        .from('bulk_upload_sessions')
        .update({ 
          status: 'cancelled',
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }
  }, [session]);

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
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    queueRef.current = null;
    setSession(null);
    setIsProcessing(false);
    setSpeedStats(null);
  }, []);

  // Fetch upload history
  const fetchHistory = useCallback(async (options?: {
    status?: string;
    limit?: number;
  }): Promise<BulkUploadHistorySession[]> => {
    if (!userIdRef.current) return [];

    let query = (supabase as any)
      .from('bulk_upload_sessions')
      .select(`
        id,
        status,
        source_type,
        total_files,
        completed_files,
        failed_files,
        skipped_files,
        total_bytes,
        uploaded_bytes,
        created_at,
        started_at,
        completed_at,
        profile_id,
        resumable_until,
        profiles(first_name, last_name)
      `)
      .eq('user_id', userIdRef.current)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      status: s.status,
      sourceType: s.source_type,
      totalFiles: s.total_files,
      completedFiles: s.completed_files,
      failedFiles: s.failed_files,
      skippedFiles: s.skipped_files,
      totalBytes: s.total_bytes,
      uploadedBytes: s.uploaded_bytes,
      createdAt: new Date(s.created_at),
      startedAt: s.started_at ? new Date(s.started_at) : undefined,
      completedAt: s.completed_at ? new Date(s.completed_at) : undefined,
      profileId: s.profile_id,
      profileName: s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name || ''}`.trim() : undefined,
      resumableUntil: s.resumable_until ? new Date(s.resumable_until) : undefined,
    }));
  }, []);

  // Resume an existing session
  const resumeExistingSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!userIdRef.current) {
      toast({ title: 'Error', description: 'Please sign in to resume upload', variant: 'destructive' });
      return false;
    }

    try {
      // Fetch session and items
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from('bulk_upload_sessions')
        .select('*, profiles(first_name, last_name)')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Session not found');
      }

      // Check if resumable
      if (sessionData.resumable_until && new Date(sessionData.resumable_until) < new Date()) {
        throw new Error('Session has expired and cannot be resumed');
      }

      const { data: items, error: itemsError } = await (supabase as any)
        .from('bulk_upload_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      // Filter for items that need to be retried
      const pendingItems = (items || []).filter(
        (i: any) => i.status === 'pending' || i.status === 'failed'
      );

      if (pendingItems.length === 0) {
        toast({ title: 'Info', description: 'No pending files to resume' });
        return false;
      }

      // Note: For a full resume, you'd need to restore the File objects
      // This is a limitation - files need to be re-selected
      toast({ 
        title: 'Cannot Resume', 
        description: 'Please re-select the files to resume this upload session',
        variant: 'destructive'
      });

      return false;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  }, [toast]);

  return {
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
    reset,
    fetchHistory,
    resumeExistingSession,
    formatFileSize,
  };
}