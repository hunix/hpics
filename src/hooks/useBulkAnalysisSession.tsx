import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { MediaType, AnalysisContext } from '@/lib/analysisTypes';
import { invokeFunction } from '@/lib/api';

export type BulkItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type BulkSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface BulkAnalysisItem {
  id: string;
  mediaId: string;
  documentId?: string;
  name: string;
  url: string;
  mediaType: MediaType;
  status: BulkItemStatus;
  progress: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs: number;
  retryCount: number;
  analysisId?: string; // DB record ID once completed
}

export interface BulkAnalysisSession {
  id: string;
  status: BulkSessionStatus;
  items: BulkAnalysisItem[];
  completedCount: number;
  failedCount: number;
  totalCount: number;
  startedAt?: Date;
  pausedAt?: Date;
}

interface UseBulkAnalysisSessionProps {
  profileId: string;
  analysisModes: string[];
  context: Partial<AnalysisContext>;
  depth: 'quick' | 'standard' | 'deep';
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  mediaType: MediaType;
  isDocument?: boolean;
}

export function useBulkAnalysisSession({
  profileId,
  analysisModes,
  context,
  depth,
}: UseBulkAnalysisSessionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [session, setSession] = useState<BulkAnalysisSession | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  const isPausedRef = useRef(false);
  const isRunningRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist session to localStorage for recovery
  useEffect(() => {
    if (session && session.status !== 'idle') {
      localStorage.setItem(`bulk_analysis_session_${profileId}`, JSON.stringify({
        ...session,
        lastUpdated: new Date().toISOString(),
      }));
    }
  }, [session, profileId]);

  // Check for existing session on mount
  const checkExistingSession = useCallback((): BulkAnalysisSession | null => {
    try {
      const saved = localStorage.getItem(`bulk_analysis_session_${profileId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if session is less than 24 hours old
        const lastUpdated = new Date(parsed.lastUpdated);
        const hoursSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24 && parsed.status !== 'completed') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    }
    return null;
  }, [profileId]);

  // Initialize session with items
  const initSession = useCallback((items: MediaItem[]): string => {
    const sessionId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const bulkItems: BulkAnalysisItem[] = items.map((item, index) => ({
      id: `${sessionId}_${index}`,
      mediaId: item.isDocument ? '' : item.id,
      documentId: item.isDocument ? item.id : undefined,
      name: item.name,
      url: item.url,
      mediaType: item.mediaType,
      status: 'pending' as BulkItemStatus,
      progress: 0,
      durationMs: 0,
      retryCount: 0,
    }));

    const newSession: BulkAnalysisSession = {
      id: sessionId,
      status: 'idle',
      items: bulkItems,
      completedCount: 0,
      failedCount: 0,
      totalCount: items.length,
      startedAt: undefined,
    };

    setSession(newSession);
    sessionIdRef.current = sessionId;
    setCurrentItemIndex(0);
    
    return sessionId;
  }, []);

  // Restore a previous session
  const restoreSession = useCallback((savedSession: BulkAnalysisSession) => {
    setSession(savedSession);
    sessionIdRef.current = savedSession.id;
    // Find first non-completed item
    const nextIndex = savedSession.items.findIndex(
      i => i.status === 'pending' || i.status === 'failed'
    );
    setCurrentItemIndex(nextIndex >= 0 ? nextIndex : 0);
  }, []);

  // Process a single item
  const processItem = useCallback(async (item: BulkAnalysisItem): Promise<boolean> => {
    if (!user) return false;

    const startTime = Date.now();

    // Update item status to running
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(i => 
          i.id === item.id 
            ? { ...i, status: 'running' as BulkItemStatus, startedAt: new Date(), progress: 10 }
            : i
        ),
      };
    });

    try {
      // Check if paused
      if (isPausedRef.current) {
        setSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map(i => 
              i.id === item.id ? { ...i, status: 'pending' as BulkItemStatus, progress: 0 } : i
            ),
          };
        });
        return false;
      }

      // Update progress to 30%
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i => 
            i.id === item.id ? { ...i, progress: 30 } : i
          ),
        };
      });

      // Call the analysis edge function
      const response = await invokeFunction('analyze-media-deep', {
          media_id: item.documentId ? null : item.mediaId,
          document_id: item.documentId || null,
          profile_id: profileId,
          media_type: item.mediaType,
          media_url: item.url,
          analysis_modes: analysisModes,
          analysis_context: context,
          analysis_depth: depth,
        },);

      if (response.error) throw response.error;

      const duration = Date.now() - startTime;

      // Update item as completed - immediately persisted to DB by the edge function
      setSession(prev => {
        if (!prev) return prev;
        const newCompletedCount = prev.completedCount + 1;
        return {
          ...prev,
          completedCount: newCompletedCount,
          items: prev.items.map(i => 
            i.id === item.id 
              ? { 
                  ...i, 
                  status: 'completed' as BulkItemStatus, 
                  progress: 100,
                  completedAt: new Date(),
                  durationMs: duration,
                  analysisId: response.data?.analysis_id,
                }
              : i
          ),
        };
      });

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update item as failed
      setSession(prev => {
        if (!prev) return prev;
        const newFailedCount = prev.failedCount + 1;
        return {
          ...prev,
          failedCount: newFailedCount,
          items: prev.items.map(i => 
            i.id === item.id 
              ? { 
                  ...i, 
                  status: 'failed' as BulkItemStatus,
                  progress: 0,
                  errorMessage: errorMessage || 'Analysis failed',
                  durationMs: duration,
                  retryCount: i.retryCount + 1,
                }
              : i
          ),
        };
      });

      return false;
    }
  }, [user, profileId, analysisModes, context, depth]);

  // Run the bulk analysis
  const start = useCallback(async () => {
    if (!session || session.items.length === 0) {
      toast.error('No items to analyze');
      return;
    }

    isPausedRef.current = false;
    isRunningRef.current = true;
    abortControllerRef.current = new AbortController();

    setSession(prev => prev ? { 
      ...prev, 
      status: 'running',
      startedAt: prev.startedAt || new Date(),
    } : prev);

    // Process items sequentially
    const pendingItems = session.items.filter(
      i => i.status === 'pending' || i.status === 'failed'
    );

    for (let i = 0; i < pendingItems.length; i++) {
      if (isPausedRef.current || !isRunningRef.current) break;

      const item = pendingItems[i];
      setCurrentItemIndex(session.items.findIndex(si => si.id === item.id));
      
      await processItem(item);

      // Small delay between items to avoid rate limiting
      if (i < pendingItems.length - 1 && !isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Finalize session
    setSession(prev => {
      if (!prev) return prev;
      const allDone = prev.items.every(i => i.status === 'completed' || i.status === 'skipped');
      const hasFailed = prev.items.some(i => i.status === 'failed');
      
      let finalStatus: BulkSessionStatus;
      if (isPausedRef.current) {
        finalStatus = 'paused';
      } else if (allDone) {
        finalStatus = 'completed';
        localStorage.removeItem(`bulk_analysis_session_${profileId}`);
        toast.success(`Bulk analysis completed! ${prev.completedCount} items processed.`);
      } else if (hasFailed) {
        finalStatus = 'failed';
      } else {
        finalStatus = 'paused';
      }

      return { ...prev, status: finalStatus };
    });

    isRunningRef.current = false;
    queryClient.invalidateQueries({ queryKey: ['recent-media-analyses'] });
  }, [session, processItem, profileId, queryClient]);

  // Pause the session
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setSession(prev => prev ? { 
      ...prev, 
      status: 'paused',
      pausedAt: new Date(),
    } : prev);
    toast.info('Analysis paused');
  }, []);

  // Resume the session
  const resume = useCallback(() => {
    if (session?.status === 'paused') {
      start();
    }
  }, [session, start]);

  // Skip a failed item
  const skipItem = useCallback((itemId: string) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(i => 
          i.id === itemId ? { ...i, status: 'skipped' as BulkItemStatus } : i
        ),
      };
    });
  }, []);

  // Retry a failed item
  const retryItem = useCallback(async (itemId: string) => {
    const item = session?.items.find(i => i.id === itemId);
    if (!item) return;

    // Reset the item status
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        failedCount: Math.max(0, prev.failedCount - 1),
        items: prev.items.map(i => 
          i.id === itemId 
            ? { ...i, status: 'pending' as BulkItemStatus, errorMessage: undefined, progress: 0 }
            : i
        ),
      };
    });

    // If session is paused, start processing just this item
    if (session?.status === 'paused' || session?.status === 'failed') {
      isRunningRef.current = true;
      isPausedRef.current = false;
      
      setSession(prev => prev ? { ...prev, status: 'running' } : prev);
      
      await processItem(item);
      
      setSession(prev => {
        if (!prev) return prev;
        const hasPending = prev.items.some(i => i.status === 'pending');
        const hasFailed = prev.items.some(i => i.status === 'failed');
        
        return { 
          ...prev, 
          status: hasPending || hasFailed ? 'paused' : 'completed',
        };
      });
      
      isRunningRef.current = false;
    }
  }, [session, processItem]);

  // Retry all failed items
  const retryAllFailed = useCallback(async () => {
    if (!session) return;

    // Reset all failed items to pending
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        failedCount: 0,
        items: prev.items.map(i => 
          i.status === 'failed' 
            ? { ...i, status: 'pending' as BulkItemStatus, errorMessage: undefined, progress: 0 }
            : i
        ),
      };
    });

    // Start processing
    await start();
  }, [session, start]);

  // Cancel and clear the session
  const cancel = useCallback(() => {
    isPausedRef.current = true;
    isRunningRef.current = false;
    abortControllerRef.current?.abort();
    
    localStorage.removeItem(`bulk_analysis_session_${profileId}`);
    setSession(null);
    sessionIdRef.current = null;
    setCurrentItemIndex(0);
    
    toast.info('Analysis cancelled');
  }, [profileId]);

  // Clear completed session
  const clearSession = useCallback(() => {
    localStorage.removeItem(`bulk_analysis_session_${profileId}`);
    setSession(null);
    sessionIdRef.current = null;
    setCurrentItemIndex(0);
  }, [profileId]);

  return {
    session,
    currentItemIndex,
    initSession,
    restoreSession,
    checkExistingSession,
    start,
    pause,
    resume,
    skipItem,
    retryItem,
    retryAllFailed,
    cancel,
    clearSession,
    isRunning: session?.status === 'running',
    isPaused: session?.status === 'paused',
    isCompleted: session?.status === 'completed',
    hasFailed: (session?.failedCount || 0) > 0,
  };
}
