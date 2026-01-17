import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { prioritizeItems, estimateBulkCost, type CostEstimate } from "@/lib/bulkAnalysisPrioritization";
import { generateMetadataMosaic, getMosaicPreviewInfo, type MediaItem as MosaicMediaItem } from "@/lib/metadataMosaic";

export type BulkSessionStatus = "idle" | "pending" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type BulkItemStatus = "pending" | "queued" | "running" | "completed" | "failed" | "skipped";
export type ProcessingStrategy = "individual" | "mosaic" | "hybrid";

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
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const profileIds = propProfileIds || (profileId ? [profileId] : []);

  // Subscribe to realtime updates
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
          setSession((prev) => prev ? { ...prev, ...mapDbSession(payload.new) } : null);
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
          setSession((prev) => {
            if (!prev) return null;
            const updatedItem = mapDbItem(payload.new);
            const items = prev.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            );
            return { ...prev, items };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

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
        
        // Fetch items
        const { data: items } = await supabase
          .from("bulk_analysis_items")
          .select("*")
          .eq("session_id", dbSession.id)
          .order("queue_position", { ascending: true });

        const mappedSession = mapDbSession(dbSession);
        mappedSession.items = (items || []).map(mapDbItem);
        
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

  // Process a batch of images using mosaic approach with timeout
  const processBatchWithMosaic = useCallback(async (
    items: Array<{ id: string; media_url?: string; media_id?: string; profile_id: string; file_name?: string }>,
    activeSession: BulkSession
  ) => {
    console.log('[BulkSession] Processing batch with mosaic:', items.length, 'images');
    setProcessingStatus(`Generating mosaic for ${items.length} images...`);

    const MOSAIC_TIMEOUT_MS = 120000; // 2 minutes timeout
    const itemIds = items.map(i => i.id);

    try {
      // Mark all items as running
      await supabase
        .from("bulk_analysis_items")
        .update({ status: "running", started_at: new Date().toISOString() })
        .in("id", itemIds);

      // Get signed URLs for all items
      const mediaItems: MosaicMediaItem[] = [];
      for (const item of items) {
        let url = item.media_url;
        if (!url && item.media_id) {
          // Try to get from media table
          const { data: mediaData } = await supabase
            .from("media")
            .select("storage_path")
            .eq("id", item.media_id)
            .single();
          
          if (mediaData?.storage_path) {
            const { data: signedData } = await supabase.storage
              .from("media")
              .createSignedUrl(mediaData.storage_path, 3600);
            url = signedData?.signedUrl;
          }
        }
        
        if (url) {
          mediaItems.push({
            id: item.media_id || item.id,
            url,
            profileId: item.profile_id,
          });
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

      // Upload mosaic to storage temporarily
      setProcessingStatus("Uploading mosaic for analysis...");
      const mosaicPath = `temp-mosaics/${activeSession.id}/${mosaic.mosaicId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(mosaicPath, mosaic.imageBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL for mosaic
      const { data: mosaicSignedData } = await supabase.storage
        .from("media")
        .createSignedUrl(mosaicPath, 3600);

      if (!mosaicSignedData?.signedUrl) throw new Error("Failed to get mosaic URL");

      // Call the mosaic analysis edge function
      setProcessingStatus(`Analyzing ${mediaItems.length} images via mosaic...`);
      const startTime = Date.now();

      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        "generate-media-metadata-mosaic",
        {
          body: {
            mosaicUrl: mosaicSignedData.signedUrl,
            mosaicId: mosaic.mosaicId,
            cells: mosaic.cells,
            model: 'google/gemini-2.5-flash',
            analysisModes: activeSession.analysisModes,
            context: activeSession.analysisContext,
          },
        }
      );

      const processingTimeMs = Date.now() - startTime;

      if (analysisError) throw analysisError;

      console.log('[BulkSession] Mosaic analysis completed:', analysisResult);
      const costCents = analysisResult?.costCents || Math.ceil(items.length * 0.15); // Estimate ~$0.0015/image via mosaic

      // Mark all items as completed
      await supabase
        .from("bulk_analysis_items")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          processing_time_ms: Math.round(processingTimeMs / items.length),
          actual_cost_cents: Math.ceil(costCents / items.length),
          result: { mosaicProcessed: true, mosaicId: mosaic.mosaicId },
        })
        .in("id", itemIds);

      // Update session progress for all items at once
      for (let i = 0; i < items.length; i++) {
        await supabase.rpc("increment_bulk_session_progress", {
          p_session_id: activeSession.id,
          p_cost_cents: i === 0 ? costCents : 0, // Only add cost once
          p_is_completed: true,
          p_is_failed: false,
        });
      }

      // Clean up temp mosaic
      await supabase.storage.from("media").remove([mosaicPath]);

      return { processed: items.length, cost: costCents };
    } catch (error) {
      console.error('[BulkSession] Mosaic processing error:', error);
      setProcessingStatus("Mosaic failed, resetting items for retry...");
      
      // Reset items back to pending on failure so they can be retried
      await supabase
        .from("bulk_analysis_items")
        .update({ status: "pending", started_at: null, error_message: error instanceof Error ? error.message : "Mosaic failed" })
        .in("id", itemIds);
      
      throw error;
    }
  }, []);

  // Start processing - accepts optional session override to avoid React state timing issues
  const start = useCallback(async (sessionOverride?: BulkSession, strategyOverride?: ProcessingStrategy) => {
    const activeSession = sessionOverride || session;
    const strategy = strategyOverride || processingStrategy;
    
    if (!activeSession) {
      console.warn('[BulkSession] start() called but no session available');
      return;
    }
    if (isRunningRef.current) {
      console.log('[BulkSession] Already running, skipping start');
      return;
    }

    console.log('[BulkSession] Starting processing for session:', activeSession.id, 'strategy:', strategy);
    isRunningRef.current = true;
    abortControllerRef.current = new AbortController();
    setProcessingStatus("Initializing...");
    
    // If we got sessionOverride, also update the React state
    if (sessionOverride && (!session || session.id !== sessionOverride.id)) {
      setSession(sessionOverride);
    }

    try {
      // Update session status
      await supabase
        .from("bulk_analysis_sessions")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", activeSession.id);

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
        console.log('[BulkSession] Reset', stuckItems.length, 'stuck items to pending');
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
        console.log('[BulkSession] No pending items, completing session');
        await completeSession(activeSession);
        return;
      }

      console.log('[BulkSession] Total pending items:', allPendingItems.length);

      // Separate images from other media types
      const imageItems = allPendingItems.filter(i => i.media_type === 'image');
      const otherItems = allPendingItems.filter(i => i.media_type !== 'image');

      // Determine if we should use mosaic
      const shouldUseMosaic = (strategy === 'mosaic' || strategy === 'hybrid') && imageItems.length >= 4;

      if (shouldUseMosaic) {
        // Process images in batches using mosaic
        const BATCH_SIZE = 64; // Max images per mosaic
        setProcessingStatus(`Processing ${imageItems.length} images with mosaic optimization...`);

        for (let i = 0; i < imageItems.length; i += BATCH_SIZE) {
          if (!isRunningRef.current) break;

          const batch = imageItems.slice(i, i + BATCH_SIZE);
          console.log('[BulkSession] Processing mosaic batch:', i / BATCH_SIZE + 1, 'of', Math.ceil(imageItems.length / BATCH_SIZE));
          
          try {
            await processBatchWithMosaic(batch, activeSession);
          } catch (mosaicError) {
            console.error('[BulkSession] Mosaic batch failed, processing individually:', mosaicError);
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

          console.log('[BulkSession] Processing item individually:', item.id, item.file_name);
          setProcessingStatus(`Processing: ${item.file_name || item.id}`);

          await processItem(item.id, activeSession);

          // Check if we should continue
          const { data: currentSession } = await supabase
            .from("bulk_analysis_sessions")
            .select("status, current_cost_cents, max_cost_cents, stop_on_budget_exceeded")
            .eq("id", activeSession.id)
            .single();

          if (currentSession?.status === "paused" || currentSession?.status === "cancelled") {
            console.log('[BulkSession] Session paused or cancelled, stopping');
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
      console.log('[BulkSession] Processing loop ended');
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
      console.log('[BulkSession] Calling analyze-media-deep for:', item.file_name);
      
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

      console.log('[BulkSession] Analysis completed for:', item.file_name, analysisResult);
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

  // Resume processing
  const resume = useCallback(async () => {
    if (!session) return;

    await supabase
      .from("bulk_analysis_sessions")
      .update({ status: "running", paused_at: null })
      .eq("id", session.id);

    setSession((prev) => prev ? { ...prev, status: "running" } : null);
    await start();
  }, [session, start]);

  // Complete session
  const completeSession = useCallback(async (sessionOverride?: BulkSession) => {
    const activeSession = sessionOverride || session;
    if (!activeSession) return;

    await supabase
      .from("bulk_analysis_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", activeSession.id);

    setSession((prev) => prev ? { ...prev, status: "completed" } : null);

    // Trigger aggregation if enabled
    if (activeSession.autoAggregate) {
      supabase.functions
        .invoke("aggregate-bulk-results", { body: { sessionId: activeSession.id } })
        .catch((err) => console.error("Aggregation failed:", err));
    }

    toast({
      title: "Analysis complete",
      description: `Analyzed ${activeSession.completedItems} items`,
    });
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

  // Retry all failed items
  const retryAllFailed = useCallback(async () => {
    if (!session) return;

    await supabase
      .from("bulk_analysis_items")
      .update({
        status: "pending",
        error_message: null,
        started_at: null,
        completed_at: null,
        retry_count: 0,
      })
      .eq("session_id", session.id)
      .eq("status", "failed");

    await resume();
  }, [session, resume]);

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
    checkExistingSession,
    initSession,
    start,
    pause,
    resume,
    cancel,
    skipItem,
    retryItem,
    retryAllFailed,
    restoreSession,
    clearSession,
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
