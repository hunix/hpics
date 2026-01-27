import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { prioritizeItems, estimateBulkCost, type CostEstimate } from "@/lib/bulkAnalysisPrioritization";
import { generateMetadataMosaic, getMosaicPreviewInfo, type MediaItem as MosaicMediaItem } from "@/lib/metadataMosaic";
import { deduplicateImages } from "@/lib/imageHashingService";
import type { MosaicFailureState } from "@/components/analysis/MosaicFailureDialog";
import { createModuleLogger } from "@/lib/logger";

const logger = createModuleLogger('BulkSession');

export type BulkSessionStatus = "idle" | "pending" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type BulkItemStatus = "pending" | "queued" | "running" | "completed" | "failed" | "skipped";
export type ProcessingStrategy = "individual" | "mosaic" | "hybrid" | "deduplicated";

export interface BulkAnalysisItem {
  id: string;
  sessionId: string;
  mediaId?: string;
  documentId?: string;
  profileId: string;
  mediaType: string;
  mediaUrl?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  status: BulkItemStatus;
  queuePosition: number;
  priorityScore: number;
  analysisId?: string;
  result?: Record<string, unknown>;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  startedAt?: string;
  completedAt?: string;
  processingTimeMs?: number;
  estimatedCostCents?: number;
  actualCostCents?: number;
}

export interface BulkSession {
  id: string;
  userId: string;
  name?: string;
  status: BulkSessionStatus;
  scopeType: "single_contact" | "multiple_contacts" | "all_contacts" | "unanalyzed_only";
  profileIds: string[];
  mediaTypes: string[];
  analysisModes: string[];
  analysisContext?: Record<string, unknown>;
  analysisDepth: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  currentItemIndex: number;
  scheduledFor?: string;
  priority: number;
  maxCostCents?: number;
  currentCostCents: number;
  stopOnBudgetExceeded: boolean;
  autoAggregate: boolean;
  triggerDeepAnalysis: boolean;
  aggregationResult?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  lastError?: string;
  errorCount: number;
  items: BulkAnalysisItem[];
}

interface UsePersistentBulkSessionProps {
  profileId?: string;
  profileIds?: string[];
  analysisModes: string[];
  analysisContext?: Record<string, unknown>;
  analysisDepth: string;
}

export function usePersistentBulkSession({
  profileId,
  profileIds: propProfileIds,
  analysisModes,
  analysisContext,
  analysisDepth,
}: UsePersistentBulkSessionProps) {
  const { toast } = useToast();
  const [session, setSession] = useState<BulkSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [processingStrategy, setProcessingStrategy] = useState<ProcessingStrategy>("hybrid");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [mosaicFailure, setMosaicFailure] = useState<MosaicFailureState | null>(null);
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingMosaicBatchRef = useRef<Array<{ id: string; media_url?: string; media_id?: string; profile_id: string; file_name?: string }> | null>(null);

  const profileIds = propProfileIds || (profileId ? [profileId] : []);

  // Subscribe to realtime updates
  // CRITICAL FIX: Preserve items array during session updates, upsert items in item updates
  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel(`bulk-session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bulk_analysis_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          logger.debug('Realtime session update', { session: payload.new });
          setSession((prev) => {
            if (!prev) return null;
            // CRITICAL: Preserve the items array - mapDbSession sets items:[] by default
            const mappedUpdates = mapDbSession(payload.new);
            return { ...prev, ...mappedUpdates, items: prev.items };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bulk_analysis_items",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          logger.debug('Realtime item update', { id: payload.new.id, status: payload.new.status });
          setSession((prev) => {
            if (!prev) return null;
            const updatedItem = mapDbItem(payload.new);

            // UPSERT: Check if item exists, if not append it
            const existingIndex = prev.items.findIndex((item) => item.id === updatedItem.id);
            let newItems: BulkAnalysisItem[];

            if (existingIndex >= 0) {
              // Replace existing item
              newItems = [...prev.items];
              newItems[existingIndex] = updatedItem;
            } else {
              // Append new item (upsert behavior)
              newItems = [...prev.items, updatedItem].sort((a, b) => a.queuePosition - b.queuePosition);
            }

            return { ...prev, items: newItems };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Fallback polling: if session is running/pending but items array is empty, fetch items from DB
  useEffect(() => {
    if (!session?.id || session.items.length > 0) return;
    if (session.status !== 'running' && session.status !== 'pending') return;

    logger.debug('Items array empty, starting poll to fetch items');

    const pollInterval = setInterval(async () => {
      const { data: items, error } = await supabase
        .from('bulk_analysis_items')
        .select('*')
        .eq('session_id', session.id)
        .order('queue_position', { ascending: true });

      if (error) {
        console.error('[BulkSession] Failed to poll items:', error);
        return;
      }

      if (items && items.length > 0) {
        logger.debug('Polled items from DB', { count: items.length });
        setSession(prev => prev ? { ...prev, items: items.map(mapDbItem) } : null);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    let mounted = true;

    // Also do an immediate fetch
    (async () => {
      const { data: items } = await supabase
        .from('bulk_analysis_items')
        .select('*')
        .eq('session_id', session.id)
        .order('queue_position', { ascending: true });

      if (mounted && items && items.length > 0) {
        logger.debug('Immediate fetch completed', { count: items.length });
        setSession(prev => prev ? { ...prev, items: items.map(mapDbItem) } : null);
        clearInterval(pollInterval);
      }
    })();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [session?.id, session?.items?.length, session?.status]);

  // Check for existing active sessions on mount
  const checkExistingSession = useCallback(async () => {
    try {
      const { data: sessions } = await supabase
        .from("bulk_analysis_sessions")
        .select("*")
        .in("status", ["running", "paused", "pending"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const dbSession = sessions[0];

        // Auto-cancel stale pending sessions (pending for > 5 minutes without starting)
        if (dbSession.status === 'pending' && dbSession.started_at === null) {
          const createdAt = new Date(dbSession.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

          if (createdAt < fiveMinutesAgo) {
            logger.info('Found stale pending session, auto-cancelling', { sessionId: dbSession.id });
            await supabase
              .from('bulk_analysis_sessions')
              .update({ status: 'cancelled', completed_at: new Date().toISOString() })
              .eq('id', dbSession.id);
            return null; // Don't return the stale session
          }
        }

        // Fetch items
        const { data: items } = await supabase
          .from("bulk_analysis_items")
          .select("*")
          .eq("session_id", dbSession.id)
          .order("queue_position", { ascending: true });

        const mappedSession = mapDbSession(dbSession);
        mappedSession.items = (items || []).map(mapDbItem);

        // Reconcile session counters from actual item statuses
        const actualCompleted = mappedSession.items.filter(i => i.status === 'completed').length;
        const actualFailed = mappedSession.items.filter(i => i.status === 'failed').length;
        const actualSkipped = mappedSession.items.filter(i => i.status === 'skipped').length;

        if (actualCompleted !== mappedSession.completedItems ||
          actualFailed !== mappedSession.failedItems ||
          actualSkipped !== mappedSession.skippedItems) {
          logger.debug('Reconciling session counters on restore', {
            sessionCounters: { completed: mappedSession.completedItems, failed: mappedSession.failedItems, skipped: mappedSession.skippedItems },
            actualCounts: { completed: actualCompleted, failed: actualFailed, skipped: actualSkipped }
          });

          // Update session counters in database to match actual item statuses
          await supabase
            .from("bulk_analysis_sessions")
            .update({
              completed_items: actualCompleted,
              failed_items: actualFailed,
              skipped_items: actualSkipped,
            })
            .eq("id", dbSession.id);

          // Update local state
          mappedSession.completedItems = actualCompleted;
          mappedSession.failedItems = actualFailed;
          mappedSession.skippedItems = actualSkipped;
        }

        return mappedSession;
      }
      return null;
    } catch (error) {
      console.error("Error checking existing session:", error);
      return null;
    }
  }, []);

  // Initialize a new session with media items
  const initSession = useCallback(
    async (
      mediaItems: {
        id: string;
        mediaId?: string;
        documentId?: string;
        profileId: string;
        mediaType: string;
        url?: string;
        storagePath?: string;
        name?: string;
        size?: number;
        createdAt?: string;
        hasBeenAnalyzed?: boolean;
        contactScore?: number;
      }[],
      options?: {
        name?: string;
        maxCostCents?: number;
        autoAggregate?: boolean;
        triggerDeepAnalysis?: boolean;
        scheduledFor?: Date;
      }
    ) => {
      if (mediaItems.length === 0) {
        toast({
          title: "No items selected",
          description: "Please select at least one item to analyze",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);

      try {
        // Calculate priorities
        const prioritizedItems = prioritizeItems(
          mediaItems.map((item) => ({
            id: item.id,
            mediaId: item.mediaId,
            documentId: item.documentId,
            profileId: item.profileId,
            createdAt: item.createdAt || new Date().toISOString(),
            fileSize: item.size,
            hasBeenAnalyzed: item.hasBeenAnalyzed || false,
            contactScore: item.contactScore,
            mediaType: item.mediaType,
          }))
        );

        // Estimate cost
        const estimate = estimateBulkCost(
          mediaItems.map((item) => ({ mediaType: item.mediaType, fileSize: item.size })),
          analysisModes,
          analysisDepth
        );
        setCostEstimate(estimate);

        // Create session in database
        // Get current user for user_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionData: any = {
          user_id: user.id, // Explicitly set user_id to fix RLS
          name: options?.name || `Bulk Analysis - ${new Date().toLocaleDateString()}`,
          status: "pending",
          scope_type: profileIds.length > 1 ? "multiple_contacts" : "single_contact",
          profile_ids: profileIds,
          media_types: [...new Set(mediaItems.map((item) => item.mediaType))],
          analysis_modes: analysisModes,
          analysis_context: analysisContext,
          analysis_depth: analysisDepth,
          total_items: mediaItems.length,
          max_cost_cents: options?.maxCostCents,
          auto_aggregate: options?.autoAggregate ?? true,
          trigger_deep_analysis: options?.triggerDeepAnalysis ?? false,
          scheduled_for: options?.scheduledFor?.toISOString(),
        };

        const { data: newSession, error: sessionError } = await supabase
          .from("bulk_analysis_sessions")
          .insert(sessionData)
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Create items in database
        const itemsToInsert = prioritizedItems.map((item, index) => {
          const original = mediaItems.find((m) => m.id === item.id)!;
          return {
            session_id: newSession.id,
            media_id: original.mediaId,
            document_id: original.documentId,
            profile_id: original.profileId,
            media_type: original.mediaType,
            media_url: original.url,
            storage_path: original.storagePath,
            file_name: original.name,
            file_size: original.size,
            status: "pending",
            queue_position: index,
            priority_score: item.priorityScore,
            estimated_cost_cents: Math.ceil(estimate.totalCents / mediaItems.length),
          };
        });

        const { data: insertedItems, error: itemsError } = await supabase
          .from("bulk_analysis_items")
          .insert(itemsToInsert)
          .select();

        if (itemsError) throw itemsError;

        const mappedSession = mapDbSession(newSession);
        mappedSession.items = (insertedItems || []).map(mapDbItem);

        setSession(mappedSession);

        toast({
          title: "Session created",
          description: `Ready to analyze ${mediaItems.length} items`,
        });

        return mappedSession;
      } catch (error) {
        console.error("Error creating session:", error);
        toast({
          title: "Failed to create session",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [profileIds, analysisModes, analysisContext, analysisDepth, toast]
  );

  // Mosaic retry configuration
  const MOSAIC_MAX_RETRIES = 3;
  const MOSAIC_RETRY_DELAY_MS = 2000;
  const MOSAIC_TIMEOUT_MS = 120000; // 2 minutes
  const DEFAULT_MOSAIC_BATCH_SIZE = 16; // Reduced from 32 for reliability
  const RETRY_BATCH_SIZES = [16, 8, 4, 1]; // Progressive reduction on failures
  const MAX_PAYLOAD_SIZE_KB = 200; // Conservative limit to prevent timeouts

  // Get appropriate batch size based on retry attempt
  const getRetryBatchSize = (attempt: number): number => {
    return RETRY_BATCH_SIZES[Math.min(attempt, RETRY_BATCH_SIZES.length - 1)];
  };

  // Process a batch of images using mosaic approach with smart retry
  const processBatchWithMosaic = useCallback(async (
    items: Array<{ id: string; media_url?: string; media_id?: string; profile_id: string; file_name?: string }>,
    activeSession: BulkSession,
    retryAttempt = 0,
    reducedBatchSize?: number
  ): Promise<{ processed: number; cost: number }> => {
    const batchToProcess = reducedBatchSize ? items.slice(0, reducedBatchSize) : items;
    logger.info('Processing batch with mosaic', { imageCount: batchToProcess.length, attempt: retryAttempt + 1 });
    setProcessingStatus(`Generating mosaic for ${batchToProcess.length} images... (attempt ${retryAttempt + 1}/${MOSAIC_MAX_RETRIES})`);

    const itemIds = batchToProcess.map(i => i.id);

    try {
      // Mark all items as running
      await supabase
        .from("bulk_analysis_items")
        .update({ status: "running", started_at: new Date().toISOString() })
        .in("id", itemIds);

      // Get FRESH signed URLs for all items - never reuse stored URLs which may be expired
      const mediaItems: MosaicMediaItem[] = [];
      for (const item of batchToProcess) {
        let url: string | undefined;
        
        // Always get storage_path and generate fresh signed URL
        if (item.media_id) {
          const { data: mediaData } = await supabase
            .from("media")
            .select("storage_path, file_url")
            .eq("id", item.media_id)
            .single();

          if (mediaData?.storage_path) {
            // Generate FRESH signed URL (never reuse item.media_url which may be expired)
            const { data: signedData } = await supabase.storage
              .from("media")
              .createSignedUrl(mediaData.storage_path, 3600);
            url = signedData?.signedUrl;
          } else if (mediaData?.file_url) {
            // Fall back to public URL if available
            url = mediaData.file_url;
          }
        }
        
        // Only fall back to stored URL if we couldn't get anything fresh
        if (!url && item.media_url) {
          console.warn(`[Mosaic] Using potentially expired stored URL for item ${item.id}`);
          url = item.media_url;
        }

        if (url) {
          mediaItems.push({
            id: item.media_id || item.id,
            url,
            profileId: item.profile_id,
            bulkItemId: item.id, // Pass bulk_analysis_items.id for direct updates
          });
        } else {
          console.error(`[Mosaic] No valid URL found for item ${item.id}`);
        }
      }

      if (mediaItems.length === 0) {
        throw new Error("No valid media URLs found");
      }

      // Generate mosaic client-side with timeout
      setProcessingStatus(`Creating mosaic grid (${mediaItems.length} images)...`);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Mosaic generation timed out after 2 minutes')), MOSAIC_TIMEOUT_MS);
      });

      const mosaic = await Promise.race([
        generateMetadataMosaic(mediaItems, 'google/gemini-2.5-flash', (progress, current) => {
          setProcessingStatus(current);
        }),
        timeoutPromise
      ]);

      // Call the mosaic analysis edge function with base64 data URL directly
      // This bypasses storage RLS issues by not uploading to temp storage
      setProcessingStatus(`Analyzing ${mediaItems.length} images via mosaic...`);
      const startTime = Date.now();

      logger.debug('Sending mosaic to edge function', {
        mosaicId: mosaic.mosaicId,
        cellCount: mosaic.cells.length,
        gridCols: mosaic.gridCols,
        gridRows: mosaic.gridRows,
        imageDataUrlLength: mosaic.imageDataUrl?.length || 0,
      });

      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        "generate-media-metadata-mosaic",
        {
          body: {
            mosaicImageUrl: mosaic.imageDataUrl, // Send base64 data URL directly
            mosaicId: mosaic.mosaicId,
            cells: mosaic.cells,
            gridCols: mosaic.gridCols,
            gridRows: mosaic.gridRows,
            model: 'google/gemini-2.5-flash',
            sessionId: activeSession.id, // Include session ID for logging/diagnostics
            bulkSessionId: activeSession.id, // For counter updates in background processing
            analysisModes: activeSession.analysisModes || ['mosaic_metadata'], // Pass actual modes for tracking
          },
        }
      );

      if (analysisError) throw analysisError;

      const processingTimeMs = Date.now() - startTime;
      logger.info('Mosaic submitted for background processing', {
        processingTimeMs,
        status: analysisResult?.status,
        mosaicId: analysisResult?.mosaicId,
        cellCount: analysisResult?.cellCount
      });

      // With background processing, the edge function returns immediately with status: 'processing'
      // Poll for completion before moving to next batch
      if (analysisResult?.status === 'processing') {
        logger.info('Mosaic submitted for background processing, polling for completion...');

        const POLL_INTERVAL = 3000; // 3 seconds
        const POLL_TIMEOUT = 180000; // 3 minutes max
        const pollStart = Date.now();

        while (Date.now() - pollStart < POLL_TIMEOUT) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL));

          // Check if all items in this batch are completed or failed
          const { data: itemStatuses } = await supabase
            .from('bulk_analysis_items')
            .select('status')
            .in('id', itemIds);

          const allDone = itemStatuses?.every(i =>
            i.status === 'completed' || i.status === 'failed'
          );

          if (allDone) {
            logger.info('Background mosaic processing completed');
            const completedCount = itemStatuses?.filter(i => i.status === 'completed').length || 0;
            const failedCount = itemStatuses?.filter(i => i.status === 'failed').length || 0;

            // Backend already updates session counters, just refresh from DB
            logger.debug('Background processing completed, refreshing session from DB');
            const { data: refreshedSession } = await supabase
              .from('bulk_analysis_sessions')
              .select('completed_items, failed_items, current_cost_cents')
              .eq('id', activeSession.id)
              .single();

            if (refreshedSession) {
              setSession(prev => prev ? {
                ...prev,
                completedItems: refreshedSession.completed_items || prev.completedItems,
                failedItems: refreshedSession.failed_items || prev.failedItems,
                currentCostCents: refreshedSession.current_cost_cents || prev.currentCostCents,
              } : null);
            }

            return { processed: completedCount, cost: 0 };
          }

          const elapsed = Math.round((Date.now() - pollStart) / 1000);
          setProcessingStatus(`Waiting for mosaic processing... ${elapsed}s`);
        }

        // Timeout reached - check final status
        console.warn('[BulkSession] Mosaic polling timed out after 3 minutes');
        const { data: finalStatuses } = await supabase
          .from('bulk_analysis_items')
          .select('status')
          .in('id', itemIds);

        // Backend already updates session counters, just refresh from DB
        const completedCount = finalStatuses?.filter(i => i.status === 'completed').length || 0;
        const failedCount = finalStatuses?.filter(i => i.status === 'failed').length || 0;
        logger.warn('Polling timed out, refreshing session from DB', { completedCount, failedCount });

        const { data: refreshedSession } = await supabase
          .from('bulk_analysis_sessions')
          .select('completed_items, failed_items, current_cost_cents')
          .eq('id', activeSession.id)
          .single();

        if (refreshedSession) {
          setSession(prev => prev ? {
            ...prev,
            completedItems: refreshedSession.completed_items || prev.completedItems,
            failedItems: refreshedSession.failed_items || prev.failedItems,
            currentCostCents: refreshedSession.current_cost_cents || prev.currentCostCents,
          } : null);
        }

        return { processed: completedCount, cost: 0 };
      }

      // Fallback for legacy synchronous response
      logger.info('Mosaic completed synchronously', { result: analysisResult });
      const costCents = analysisResult?.costCents || Math.ceil(batchToProcess.length * 0.15);

      // Mark all items as completed
      await supabase
        .from("bulk_analysis_items")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          processing_time_ms: Math.round(processingTimeMs / batchToProcess.length),
          actual_cost_cents: Math.ceil(costCents / batchToProcess.length),
          result: { mosaicProcessed: true, mosaicId: mosaic.mosaicId },
        })
        .in("id", itemIds);

      // Update session progress for all items at once
      for (let i = 0; i < batchToProcess.length; i++) {
        await supabase.rpc("increment_bulk_session_progress", {
          p_session_id: activeSession.id,
          p_cost_cents: i === 0 ? costCents : 0,
          p_is_completed: true,
          p_is_failed: false,
        });
      }

      return { processed: batchToProcess.length, cost: costCents };
    } catch (error) {
      console.error('[BulkSession] Mosaic processing error (attempt', retryAttempt + 1, '):', error);

      // Reset items back to pending
      await supabase
        .from("bulk_analysis_items")
        .update({
          status: "pending",
          started_at: null,
          error_message: error instanceof Error ? error.message : "Mosaic failed"
        })
        .in("id", itemIds);

      // Check if we should retry
      if (retryAttempt < MOSAIC_MAX_RETRIES - 1) {
        // Progressive batch size reduction based on retry attempt
        const nextBatchSize = getRetryBatchSize(retryAttempt + 1);
        logger.info('Mosaic failed, retrying with smaller batch', { 
          attempt: retryAttempt + 1,
          previousBatchSize: batchToProcess.length,
          nextBatchSize,
          error: error instanceof Error ? error.message : 'Unknown'
        });
        
        setProcessingStatus(`Mosaic failed, retrying with ${nextBatchSize} images in ${MOSAIC_RETRY_DELAY_MS / 1000}s...`);
        await new Promise(r => setTimeout(r, MOSAIC_RETRY_DELAY_MS * (retryAttempt + 1)));

        return processBatchWithMosaic(items, activeSession, retryAttempt + 1, nextBatchSize);
      }

      // All retries exhausted - trigger user intervention
      logger.warn('All retries exhausted, requesting user intervention');
      pendingMosaicBatchRef.current = items;

      // Pause processing and show dialog
      isRunningRef.current = false;

      setMosaicFailure({
        isOpen: true,
        error: error instanceof Error ? error.message : "Unknown mosaic error",
        failedBatchSize: batchToProcess.length,
        remainingImages: items.length,
        retryCount: MOSAIC_MAX_RETRIES,
        maxRetries: MOSAIC_MAX_RETRIES,
      });

      throw new Error("MOSAIC_INTERVENTION_REQUIRED");
    }
  }, []);

  // Handle user choosing to retry mosaic
  const handleMosaicRetry = useCallback(async () => {
    if (!pendingMosaicBatchRef.current || !session) return;

    setMosaicFailure(null);
    isRunningRef.current = true;

    try {
      await processBatchWithMosaic(pendingMosaicBatchRef.current, session, 0);
      pendingMosaicBatchRef.current = null;
      // Continue processing
      await start(session, processingStrategy);
    } catch (error) {
      // If it's another intervention request, the dialog will show again
      if (error instanceof Error && error.message !== "MOSAIC_INTERVENTION_REQUIRED") {
        console.error("Retry failed:", error);
      }
    }
  }, [session, processingStrategy]);

  // Handle user choosing smaller batches
  const handleMosaicRetrySmaller = useCallback(async () => {
    if (!pendingMosaicBatchRef.current || !session) return;

    setMosaicFailure(null);
    isRunningRef.current = true;

    try {
      // Process in smaller batches of 16
      await processBatchWithMosaic(pendingMosaicBatchRef.current.slice(0, 16), session, 0);
      pendingMosaicBatchRef.current = null;
      // Continue processing
      await start(session, processingStrategy);
    } catch (error) {
      if (error instanceof Error && error.message !== "MOSAIC_INTERVENTION_REQUIRED") {
        console.error("Smaller batch retry failed:", error);
      }
    }
  }, [session, processingStrategy]);

  // Handle user choosing to switch to individual processing
  const handleMosaicSwitchIndividual = useCallback(async () => {
    if (!session) return;

    setMosaicFailure(null);
    pendingMosaicBatchRef.current = null;
    setProcessingStrategy("individual");
    isRunningRef.current = true;

    toast({
      title: "Switched to individual processing",
      description: "Processing will continue with one image at a time",
    });

    await start(session, "individual");
  }, [session, toast]);

  // Handle user choosing to abort
  const handleMosaicAbort = useCallback(async () => {
    setMosaicFailure(null);
    pendingMosaicBatchRef.current = null;
    await cancel();
  }, []);

  // Start processing - accepts optional session override to avoid React state timing issues
  const start = useCallback(async (sessionOverride?: BulkSession, strategyOverride?: ProcessingStrategy) => {
    const activeSession = sessionOverride || session;
    const strategy = strategyOverride || processingStrategy;

    if (!activeSession) {
      console.warn('[BulkSession] start() called but no session available');
      toast({
        title: "Cannot start analysis",
        description: "No session available. Please try again.",
        variant: "destructive",
      });
      return;
    }
    if (isRunningRef.current) {
      logger.debug('Already running, skipping start');
      return;
    }

    logger.info('Starting processing for session', { sessionId: activeSession.id, strategy });
    isRunningRef.current = true;
    abortControllerRef.current = new AbortController();
    setProcessingStatus("Initializing...");

    // If we got sessionOverride, also update the React state
    if (sessionOverride && (!session || session.id !== sessionOverride.id)) {
      setSession(sessionOverride);
    }

    try {
      // Update session status to running
      logger.debug('Updating session status to running...');
      const { error: updateError } = await supabase
        .from("bulk_analysis_sessions")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", activeSession.id);

      if (updateError) {
        console.error('[BulkSession] Failed to update session status:', updateError);
        toast({
          title: "Failed to start session",
          description: updateError.message,
          variant: "destructive",
        });
        isRunningRef.current = false;
        return;
      }

      logger.debug('Session status updated to running');

      setSession((prev) => prev ? { ...prev, status: "running" } : null);

      // Reset any items stuck at "running" for too long (> 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: stuckItems } = await supabase
        .from("bulk_analysis_items")
        .update({ status: "pending", started_at: null, error_message: "Reset: was stuck in running state" })
        .eq("session_id", activeSession.id)
        .eq("status", "running")
        .lt("started_at", fiveMinutesAgo)
        .select("id");

      if (stuckItems && stuckItems.length > 0) {
        logger.info('Reset stuck items to pending', { count: stuckItems.length });
      }

      // Reset pending items that have error messages (failed but not retried)
      const { data: failedPendingItems } = await supabase
        .from("bulk_analysis_items")
        .update({ status: "pending", error_message: null })
        .eq("session_id", activeSession.id)
        .eq("status", "pending")
        .not("error_message", "is", null)
        .select("id");

      if (failedPendingItems && failedPendingItems.length > 0) {
        logger.info('Reset failed pending items for retry', { count: failedPendingItems.length });
      }

      // Get all pending items
      const { data: allPendingItems } = await supabase
        .from("bulk_analysis_items")
        .select("*")
        .eq("session_id", activeSession.id)
        .eq("status", "pending")
        .order("priority_score", { ascending: false })
        .order("queue_position", { ascending: true });

      if (!allPendingItems || allPendingItems.length === 0) {
        logger.info('No pending items, completing session');
        await completeSession(activeSession);
        return;
      }

      logger.debug('Total pending items', { count: allPendingItems.length });

      // Separate images from other media types
      const imageItems = allPendingItems.filter(i => i.media_type === 'image');
      const otherItems = allPendingItems.filter(i => i.media_type !== 'image');

      // Determine if we should use mosaic
      const shouldUseMosaic = (strategy === 'mosaic' || strategy === 'hybrid') && imageItems.length >= 4;

      if (shouldUseMosaic) {
        // Process images in batches using mosaic - use reduced batch size for reliability
        const BATCH_SIZE = DEFAULT_MOSAIC_BATCH_SIZE;
        setProcessingStatus(`Processing ${imageItems.length} images with mosaic optimization (batch size: ${BATCH_SIZE})...`);

        for (let i = 0; i < imageItems.length; i += BATCH_SIZE) {
          if (!isRunningRef.current) break;

          const batch = imageItems.slice(i, i + BATCH_SIZE);
          logger.info('Processing mosaic batch', { batchNum: i / BATCH_SIZE + 1, totalBatches: Math.ceil(imageItems.length / BATCH_SIZE), batchSize: batch.length });

          try {
            await processBatchWithMosaic(batch, activeSession);
          } catch (mosaicError) {
            // Check if user intervention is required
            if (mosaicError instanceof Error && mosaicError.message === "MOSAIC_INTERVENTION_REQUIRED") {
              logger.warn('Waiting for user intervention');
              return; // Exit the processing loop, user will decide
            }
            console.error('[BulkSession] Mosaic batch failed unexpectedly:', mosaicError);
            // Fall back to individual processing for this batch
            for (const item of batch) {
              if (!isRunningRef.current) break;
              await processItem(item.id, activeSession);
            }
          }

          // Check session status
          const { data: currentSession } = await supabase
            .from("bulk_analysis_sessions")
            .select("status")
            .eq("id", activeSession.id)
            .single();

          if (currentSession?.status === "paused" || currentSession?.status === "cancelled") {
            break;
          }
        }
      }

      // Process non-image items (or all items if not using mosaic) individually
      const itemsToProcessIndividually = shouldUseMosaic ? otherItems : allPendingItems;

      if (itemsToProcessIndividually.length > 0 && isRunningRef.current) {
        setProcessingStatus(`Processing ${itemsToProcessIndividually.length} items individually...`);

        for (const item of itemsToProcessIndividually) {
          if (!isRunningRef.current) break;

          logger.debug('Processing item individually', { id: item.id, fileName: item.file_name });
          setProcessingStatus(`Processing: ${item.file_name || item.id}`);

          await processItem(item.id, activeSession);

          // Check if we should continue
          const { data: currentSession } = await supabase
            .from("bulk_analysis_sessions")
            .select("status, current_cost_cents, max_cost_cents, stop_on_budget_exceeded")
            .eq("id", activeSession.id)
            .single();

          if (currentSession?.status === "paused" || currentSession?.status === "cancelled") {
            logger.info('Session paused or cancelled, stopping');
            break;
          }

          // Check budget
          if (
            currentSession?.max_cost_cents &&
            currentSession.stop_on_budget_exceeded &&
            currentSession.current_cost_cents >= currentSession.max_cost_cents
          ) {
            await pause();
            toast({
              title: "Budget limit reached",
              description: "Session paused due to budget constraints",
              variant: "destructive",
            });
            break;
          }
        }
      }

      // Check if all items are done
      const { data: remainingItems } = await supabase
        .from("bulk_analysis_items")
        .select("id")
        .eq("session_id", activeSession.id)
        .eq("status", "pending")
        .limit(1);

      if (!remainingItems || remainingItems.length === 0) {
        await completeSession(activeSession);
      }

    } catch (error) {
      console.error('[BulkSession] Error during processing:', error);
      setProcessingStatus("Error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      isRunningRef.current = false;
      setProcessingStatus("");
      logger.debug('Processing loop ended');
    }
  }, [session, processingStrategy, toast, processBatchWithMosaic]);

  // Process a single item
  const processItem = useCallback(async (itemId: string, sessionOverride?: BulkSession) => {
    const activeSession = sessionOverride || session;
    if (!activeSession) return;

    try {
      // Mark as running
      await supabase
        .from("bulk_analysis_items")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", itemId);

      // Get the item
      const { data: item } = await supabase
        .from("bulk_analysis_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (!item) throw new Error("Item not found");

      // Get signed URL if needed
      let mediaUrl = item.media_url;
      if (item.storage_path && !mediaUrl) {
        const bucket = item.media_type === "document" ? "documents" : "media";
        const { data: signedUrlData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(item.storage_path, 3600);
        mediaUrl = signedUrlData?.signedUrl;
      }

      if (!mediaUrl) throw new Error("Could not get media URL");

      const startTime = Date.now();

      // Call analysis function
      logger.debug('Calling analyze-media-deep for', { fileName: item.file_name });

      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        "analyze-media-deep",
        {
          body: {
            mediaUrl,
            mediaType: item.media_type,
            profileId: item.profile_id,
            modes: activeSession.analysisModes,
            context: activeSession.analysisContext,
            depth: activeSession.analysisDepth,
            mediaId: item.media_id,
            documentId: item.document_id,
          },
        }
      );

      const processingTimeMs = Date.now() - startTime;

      if (analysisError) {
        console.error('[BulkSession] Analysis error:', analysisError);
        throw analysisError;
      }

      logger.debug('Analysis completed for', { fileName: item.file_name, result: analysisResult });
      const costCents = analysisResult?.costCents || 1;

      // Update item as completed
      await supabase
        .from("bulk_analysis_items")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTimeMs,
          actual_cost_cents: costCents,
          result: analysisResult,
          analysis_id: analysisResult?.analysisId,
        })
        .eq("id", itemId);

      // Update session progress
      await supabase.rpc("increment_bulk_session_progress", {
        p_session_id: activeSession.id,
        p_cost_cents: costCents,
        p_is_completed: true,
        p_is_failed: false,
      });
    } catch (error) {
      console.error("Error processing item:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Get current retry count
      const { data: item } = await supabase
        .from("bulk_analysis_items")
        .select("retry_count, max_retries")
        .eq("id", itemId)
        .single();

      const shouldRetry = item && item.retry_count < item.max_retries;

      await supabase
        .from("bulk_analysis_items")
        .update({
          status: shouldRetry ? "pending" : "failed",
          error_message: errorMessage,
          retry_count: (item?.retry_count || 0) + 1,
          completed_at: shouldRetry ? null : new Date().toISOString(),
        })
        .eq("id", itemId);

      if (!shouldRetry) {
        await supabase.rpc("increment_bulk_session_progress", {
          p_session_id: activeSession.id,
          p_cost_cents: 0,
          p_is_completed: false,
          p_is_failed: true,
        });
      }
    }
  }, [session]);

  // Pause processing
  const pause = useCallback(async () => {
    if (!session) return;
    isRunningRef.current = false;
    abortControllerRef.current?.abort();

    await supabase
      .from("bulk_analysis_sessions")
      .update({ status: "paused", paused_at: new Date().toISOString() })
      .eq("id", session.id);

    setSession((prev) => prev ? { ...prev, status: "paused" } : null);
  }, [session]);

  // Resume processing - accepts optional session override to avoid React state timing issues
  const resume = useCallback(async (sessionOverride?: BulkSession) => {
    const activeSession = sessionOverride || session;
    if (!activeSession) {
      console.warn('[BulkSession] resume() called but no session available');
      return;
    }

    logger.info('Resuming session', { sessionId: activeSession.id });

    await supabase
      .from("bulk_analysis_sessions")
      .update({ status: "running", paused_at: null })
      .eq("id", activeSession.id);

    // If we got sessionOverride, also update the React state
    if (sessionOverride && (!session || session.id !== sessionOverride.id)) {
      setSession(sessionOverride);
    } else {
      setSession((prev) => prev ? { ...prev, status: "running" } : activeSession);
    }

    await start(activeSession, processingStrategy);
  }, [session, start, processingStrategy]);

  // Continue processing in background via backend runner (browser-independent)
  const continueInBackground = useCallback(async (sessionOverride?: BulkSession) => {
    const activeSession = sessionOverride || session;
    if (!activeSession) {
      console.warn('[BulkSession] continueInBackground() called but no session available');
      return;
    }

    logger.info('Triggering backend runner for session', { sessionId: activeSession.id });
    setProcessingStatus("Continuing in background...");

    try {
      const { data, error } = await supabase.functions.invoke('process-bulk-session-runner', {
        body: {
          sessionId: activeSession.id,
          action: 'continue'
        }
      });

      if (error) throw error;

      toast({
        title: "Background Processing Started",
        description: `Processing ${data?.pendingCount || 'remaining'} items in the background. You can close this page.`,
      });

      // Update local state to indicate running
      setSession((prev) => prev ? { ...prev, status: "running" } : activeSession);

      return data;
    } catch (error) {
      console.error('[BulkSession] Failed to start background processing:', error);
      toast({
        title: "Failed to start background processing",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  }, [session, toast]);

  // Complete session
  const completeSession = useCallback(async (sessionOverride?: BulkSession) => {
    const activeSession = sessionOverride || session;
    if (!activeSession) return;

    // Fetch accurate counts from database for honest messaging
    const { data: itemCounts } = await supabase
      .from("bulk_analysis_items")
      .select("status")
      .eq("session_id", activeSession.id);

    const completed = itemCounts?.filter(i => i.status === 'completed').length || 0;
    const failed = itemCounts?.filter(i => i.status === 'failed').length || 0;
    const skipped = itemCounts?.filter(i => i.status === 'skipped').length || 0;

    await supabase
      .from("bulk_analysis_sessions")
      .update({ 
        status: "completed", 
        completed_at: new Date().toISOString(),
        completed_items: completed,
        failed_items: failed,
        skipped_items: skipped
      })
      .eq("id", activeSession.id);

    setSession((prev) => prev ? { 
      ...prev, 
      status: "completed",
      completedItems: completed,
      failedItems: failed,
      skippedItems: skipped
    } : null);

    // Trigger aggregation if enabled
    if (activeSession.autoAggregate) {
      supabase.functions
        .invoke("aggregate-bulk-results", { body: { sessionId: activeSession.id } })
        .catch((err) => console.error("Aggregation failed:", err));
    }

    // Different toast based on outcome - HONEST messaging
    if (failed > 0) {
      toast({
        title: "Analysis complete with failures",
        description: `${completed} analyzed successfully, ${failed} failed${skipped > 0 ? `, ${skipped} skipped` : ''}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Analysis complete",
        description: `All ${completed} items analyzed successfully${skipped > 0 ? ` (${skipped} skipped)` : ''}`,
      });
    }
  }, [session, toast]);

  // Cancel session
  const cancel = useCallback(async () => {
    if (!session) return;
    isRunningRef.current = false;
    abortControllerRef.current?.abort();

    await supabase
      .from("bulk_analysis_sessions")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", session.id);

    setSession((prev) => prev ? { ...prev, status: "cancelled" } : null);
  }, [session]);

  // Skip an item
  const skipItem = useCallback(async (itemId: string) => {
    await supabase
      .from("bulk_analysis_items")
      .update({ status: "skipped", completed_at: new Date().toISOString() })
      .eq("id", itemId);

    await supabase
      .from("bulk_analysis_sessions")
      .update({ skipped_items: session?.skippedItems ? session.skippedItems + 1 : 1 })
      .eq("id", session?.id);
  }, [session]);

  // Retry a failed item
  const retryItem = useCallback(async (itemId: string) => {
    await supabase
      .from("bulk_analysis_items")
      .update({
        status: "pending",
        error_message: null,
        started_at: null,
        completed_at: null,
      })
      .eq("id", itemId);
  }, []);

  // Retry all failed items with smaller batch sizes
  const retryAllFailed = useCallback(async (batchSizeOverride?: number) => {
    if (!session) return;

    // Get count of failed items before retry
    const { data: failedBefore } = await supabase
      .from("bulk_analysis_items")
      .select("id, result")
      .eq("session_id", session.id)
      .eq("status", "failed");

    const failedCountBefore = failedBefore?.length || 0;
    
    // Check if failures were due to timeout (0 tokens) - use even smaller batch
    const hasTimeoutFailures = failedBefore?.some(item => {
      const result = item.result as Record<string, unknown> | null;
      return result?.type === 'timeout_zero_tokens' || result?.type === 'empty_ai_response';
    });
    
    const recommendedBatchSize = batchSizeOverride || (hasTimeoutFailures ? 8 : 16);

    toast({
      title: "Retrying failed items",
      description: `Retrying ${failedCountBefore} items with batch size ${recommendedBatchSize}...`,
    });

    // Clear expired URLs and reset status to force fresh URL generation on retry
    // Also decrement session counters to account for items being retried
    await supabase
      .from("bulk_analysis_items")
      .update({
        status: "pending",
        error_message: null,
        started_at: null,
        completed_at: null,
        retry_count: 0,
        media_url: null, // Force fresh URL generation - old URLs may be expired
        result: null, // Clear previous error details
      })
      .eq("session_id", session.id)
      .eq("status", "failed");

    // Reset session failed counter since we're retrying
    await supabase
      .from("bulk_analysis_sessions")
      .update({
        failed_items: 0,
        status: "running"
      })
      .eq("id", session.id);

    // Update local session state
    setSession(prev => prev ? {
      ...prev,
      failedItems: 0,
      status: "running"
    } : null);

    await resume();
  }, [session, resume, toast]);

  // Restore a session
  const restoreSession = useCallback((restoredSession: BulkSession) => {
    setSession(restoredSession);
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    setSession(null);
    setCostEstimate(null);
    isRunningRef.current = false;
  }, []);

  return {
    session,
    isLoading,
    costEstimate,
    isRunning: isRunningRef.current,
    processingStrategy,
    setProcessingStrategy,
    processingStatus,
    mosaicFailure,
    checkExistingSession,
    initSession,
    start,
    pause,
    resume,
    continueInBackground,
    cancel,
    skipItem,
    retryItem,
    retryAllFailed,
    restoreSession,
    clearSession,
    handleMosaicRetry,
    handleMosaicRetrySmaller,
    handleMosaicSwitchIndividual,
    handleMosaicAbort,
  };
}

// Helper to map DB row to session type
function mapDbSession(row: Record<string, unknown>): BulkSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string | undefined,
    status: row.status as BulkSessionStatus,
    scopeType: row.scope_type as BulkSession["scopeType"],
    profileIds: (row.profile_ids as string[]) || [],
    mediaTypes: (row.media_types as string[]) || [],
    analysisModes: (row.analysis_modes as string[]) || [],
    analysisContext: row.analysis_context as Record<string, unknown> | undefined,
    analysisDepth: (row.analysis_depth as string) || "standard",
    totalItems: (row.total_items as number) || 0,
    completedItems: (row.completed_items as number) || 0,
    failedItems: (row.failed_items as number) || 0,
    skippedItems: (row.skipped_items as number) || 0,
    currentItemIndex: (row.current_item_index as number) || 0,
    scheduledFor: row.scheduled_for as string | undefined,
    priority: (row.priority as number) || 5,
    maxCostCents: row.max_cost_cents as number | undefined,
    currentCostCents: (row.current_cost_cents as number) || 0,
    stopOnBudgetExceeded: (row.stop_on_budget_exceeded as boolean) ?? true,
    autoAggregate: (row.auto_aggregate as boolean) ?? true,
    triggerDeepAnalysis: (row.trigger_deep_analysis as boolean) ?? false,
    aggregationResult: row.aggregation_result as Record<string, unknown> | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    startedAt: row.started_at as string | undefined,
    pausedAt: row.paused_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    estimatedCompletion: row.estimated_completion as string | undefined,
    lastError: row.last_error as string | undefined,
    errorCount: (row.error_count as number) || 0,
    items: [],
  };
}

// Helper to map DB row to item type
function mapDbItem(row: Record<string, unknown>): BulkAnalysisItem {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    mediaId: row.media_id as string | undefined,
    documentId: row.document_id as string | undefined,
    profileId: row.profile_id as string,
    mediaType: row.media_type as string,
    mediaUrl: row.media_url as string | undefined,
    storagePath: row.storage_path as string | undefined,
    fileName: row.file_name as string | undefined,
    fileSize: row.file_size as number | undefined,
    status: row.status as BulkItemStatus,
    queuePosition: (row.queue_position as number) || 0,
    priorityScore: (row.priority_score as number) || 0,
    analysisId: row.analysis_id as string | undefined,
    result: row.result as Record<string, unknown> | undefined,
    errorMessage: row.error_message as string | undefined,
    retryCount: (row.retry_count as number) || 0,
    maxRetries: (row.max_retries as number) || 3,
    startedAt: row.started_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    processingTimeMs: row.processing_time_ms as number | undefined,
    estimatedCostCents: row.estimated_cost_cents as number | undefined,
    actualCostCents: row.actual_cost_cents as number | undefined,
  };
}
