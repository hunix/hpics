import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkAnalysisItem {
  id: string;
  session_id: string;
  media_id: string | null;
  document_id: string | null;
  profile_id: string;
  media_type: string;
  media_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  status: string;
  queue_position: number;
  priority_score: number;
  priority_boost: number | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

// Rate limiting configuration
const RATE_LIMITS = {
  perMinute: 30,
  perHour: 500,
  concurrentLimit: 5,
  cooldownAfterErrorMs: 5000,
};

// In-memory rate tracking (resets on function cold start)
const rateTracker = {
  minuteCount: 0,
  hourCount: 0,
  lastMinuteReset: Date.now(),
  lastHourReset: Date.now(),
  concurrent: 0,
};

// Priority scoring function
function calculateItemPriority(item: BulkAnalysisItem, isFavorite: boolean = false): number {
  let score = item.priority_score || 0;
  
  // Apply priority boost if set
  score += item.priority_boost || 0;
  
  // Boost favorites (+20)
  if (isFavorite) score += 20;
  
  // Boost by media type (images are faster to process)
  if (item.media_type === 'image') score += 10;
  else if (item.media_type === 'audio') score += 5;
  else if (item.media_type === 'document') score += 3;
  // video gets no boost as it's slowest
  
  // Penalize retries (-5 per retry)
  score -= (item.retry_count || 0) * 5;
  
  // Time-based boost for older items (max 10 points)
  if (item.created_at) {
    const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
    score += Math.min(Math.floor(ageHours), 10);
  }
  
  // Smaller files get slight boost
  if (item.file_size) {
    if (item.file_size < 1024 * 1024) score += 5; // < 1MB
    else if (item.file_size < 5 * 1024 * 1024) score += 2; // < 5MB
  }
  
  return score;
}

// Check if we can process more items
function checkRateLimits(): { allowed: boolean; reason?: string } {
  const now = Date.now();
  
  // Reset minute counter
  if (now - rateTracker.lastMinuteReset > 60000) {
    rateTracker.minuteCount = 0;
    rateTracker.lastMinuteReset = now;
  }
  
  // Reset hour counter
  if (now - rateTracker.lastHourReset > 3600000) {
    rateTracker.hourCount = 0;
    rateTracker.lastHourReset = now;
  }
  
  if (rateTracker.concurrent >= RATE_LIMITS.concurrentLimit) {
    return { allowed: false, reason: 'concurrent_limit' };
  }
  if (rateTracker.minuteCount >= RATE_LIMITS.perMinute) {
    return { allowed: false, reason: 'minute_limit' };
  }
  if (rateTracker.hourCount >= RATE_LIMITS.perHour) {
    return { allowed: false, reason: 'hour_limit' };
  }
  
  return { allowed: true };
}

// Get adaptive batch size based on current conditions
function getAdaptiveBatchSize(
  currentCostCents: number,
  maxCostCents: number | null,
  hourlyUsage: number
): number {
  // Start with default batch size
  let batchSize = 5;
  
  // Reduce batch size as we approach hourly limit
  if (hourlyUsage > RATE_LIMITS.perHour * 0.8) {
    batchSize = 1;
  } else if (hourlyUsage > RATE_LIMITS.perHour * 0.5) {
    batchSize = 2;
  }
  
  // Reduce batch size as we approach budget limit
  if (maxCostCents) {
    const remainingBudget = maxCostCents - currentCostCents;
    if (remainingBudget < 50) batchSize = Math.min(batchSize, 1);
    else if (remainingBudget < 200) batchSize = Math.min(batchSize, 2);
    else if (remainingBudget < 500) batchSize = Math.min(batchSize, 3);
  }
  
  return batchSize;
}

// Estimate remaining processing time
function estimateRemainingTime(
  remainingItems: number,
  avgProcessingTimeMs: number,
  batchSize: number
): { estimatedMs: number; estimatedCompletion: string } {
  const batches = Math.ceil(remainingItems / batchSize);
  const estimatedMs = batches * avgProcessingTimeMs * batchSize;
  const estimatedCompletion = new Date(Date.now() + estimatedMs).toISOString();
  return { estimatedMs, estimatedCompletion };
}

interface ProcessingResult {
  itemId: string;
  success: boolean;
  analysisId?: string;
  error?: string;
  processingTimeMs: number;
  costCents: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub as string;
    } catch (authError) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId, action, itemId, modes, context, depth } = await req.json();

    if (action === "start" || action === "resume") {
      // Check rate limits first
      const rateLimitCheck = checkRateLimits();
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            rateLimited: true, 
            reason: rateLimitCheck.reason,
            retryAfterMs: rateLimitCheck.reason === 'minute_limit' ? 60000 : 
                          rateLimitCheck.reason === 'hour_limit' ? 3600000 : 1000 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update session status
      await supabase
        .from("bulk_analysis_sessions")
        .update({ 
          status: "running", 
          started_at: action === "start" ? new Date().toISOString() : undefined,
          paused_at: null 
        })
        .eq("id", sessionId)
        .eq("user_id", userId);

      // Get session info for batch sizing
      const { data: sessionInfo } = await supabase
        .from("bulk_analysis_sessions")
        .select("current_cost_cents, max_cost_cents, total_items, completed_items, failed_items, skipped_items")
        .eq("id", sessionId)
        .single();

      const batchSize = getAdaptiveBatchSize(
        sessionInfo?.current_cost_cents || 0,
        sessionInfo?.max_cost_cents || null,
        rateTracker.hourCount
      );

      // Get next pending items (batch)
      const { data: pendingItems, error: itemError } = await supabase
        .from("bulk_analysis_items")
        .select("*")
        .eq("session_id", sessionId)
        .eq("status", "pending")
        .order("priority_score", { ascending: false })
        .order("queue_position", { ascending: true })
        .limit(batchSize);

      // Re-score items with enhanced priority
      const scoredItems = pendingItems?.map(item => ({
        ...item,
        calculatedPriority: calculateItemPriority(item as BulkAnalysisItem, false)
      })).sort((a, b) => b.calculatedPriority - a.calculatedPriority) || [];

      const nextItem = scoredItems[0] || null;

      if (!nextItem) {
        // No more items, check if session is complete
        if (sessionInfo) {
          const processed = (sessionInfo.completed_items || 0) + 
                           (sessionInfo.failed_items || 0) + 
                           (sessionInfo.skipped_items || 0);
          if (processed >= (sessionInfo.total_items || 0)) {
            await supabase
              .from("bulk_analysis_sessions")
              .update({ status: "completed", completed_at: new Date().toISOString() })
              .eq("id", sessionId);
          }
        }

        return new Response(
          JSON.stringify({ done: true, message: "No more items to process" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate estimated completion time
      const remainingItems = (sessionInfo?.total_items || 0) - 
                            ((sessionInfo?.completed_items || 0) + 
                             (sessionInfo?.failed_items || 0) + 
                             (sessionInfo?.skipped_items || 0));
      const avgProcessingTime = 5000; // Default 5s per item estimate
      const estimate = estimateRemainingTime(remainingItems, avgProcessingTime, batchSize);

      // Update session with estimate
      await supabase
        .from("bulk_analysis_sessions")
        .update({ estimated_completion: estimate.estimatedCompletion })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ 
          nextItem, 
          done: false,
          batchSize,
          remainingItems,
          estimatedCompletionMs: estimate.estimatedMs,
          rateLimits: {
            minuteRemaining: RATE_LIMITS.perMinute - rateTracker.minuteCount,
            hourRemaining: RATE_LIMITS.perHour - rateTracker.hourCount,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "process-item") {
      // Check rate limits
      const rateLimitCheck = checkRateLimits();
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            rateLimited: true, 
            reason: rateLimitCheck.reason,
            retryAfterMs: RATE_LIMITS.cooldownAfterErrorMs 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Increment counters
      rateTracker.minuteCount++;
      rateTracker.hourCount++;
      rateTracker.concurrent++;

      const startTime = Date.now();

      // Mark item as running
      await supabase
        .from("bulk_analysis_items")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", itemId);

      // Get item details
      const { data: item } = await supabase
        .from("bulk_analysis_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (!item) {
        rateTracker.concurrent--;
        throw new Error("Item not found");
      }

      // Get session for context
      const { data: session } = await supabase
        .from("bulk_analysis_sessions")
        .select("analysis_modes, analysis_context, analysis_depth, max_cost_cents, current_cost_cents, stop_on_budget_exceeded")
        .eq("id", item.session_id)
        .single();

      // Check budget
      if (session?.max_cost_cents && session.stop_on_budget_exceeded) {
        if (session.current_cost_cents >= session.max_cost_cents) {
          rateTracker.concurrent--;
          await supabase
            .from("bulk_analysis_sessions")
            .update({ status: "paused", paused_at: new Date().toISOString(), last_error: "Budget exceeded" })
            .eq("id", item.session_id);

          return new Response(
            JSON.stringify({ budgetExceeded: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      try {
        // Get signed URL for the media
        let mediaUrl = item.media_url;
        if (item.storage_path && !mediaUrl) {
          const bucket = item.media_type === "document" ? "documents" : "media";
          const { data: signedUrlData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(item.storage_path, 3600);
          mediaUrl = signedUrlData?.signedUrl;
        }

        if (!mediaUrl) {
          throw new Error("Could not get media URL");
        }

        // Call the analyze-media-deep function
        const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-media-deep`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            mediaUrl,
            mediaType: item.media_type,
            profileId: item.profile_id,
            modes: modes || session?.analysis_modes || ["visual_analysis"],
            context: context || session?.analysis_context || {},
            depth: depth || session?.analysis_depth || "standard",
            mediaId: item.media_id,
            documentId: item.document_id,
          }),
        });

        const analysisResult = await analysisResponse.json();

        if (!analysisResponse.ok) {
          throw new Error(analysisResult.error || "Analysis failed");
        }

        const processingTimeMs = Date.now() - startTime;
        const costCents = analysisResult.costCents || 1;

        // Update item as completed
        await supabase
          .from("bulk_analysis_items")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            processing_time_ms: processingTimeMs,
            actual_cost_cents: costCents,
            result: analysisResult,
            analysis_id: analysisResult.analysisId,
          })
          .eq("id", itemId);

        // Update session progress
        await supabase.rpc("increment_bulk_session_progress", {
          p_session_id: item.session_id,
          p_cost_cents: costCents,
          p_is_completed: true,
          p_is_failed: false,
        });

        rateTracker.concurrent--;

        return new Response(
          JSON.stringify({
            success: true,
            itemId,
            analysisId: analysisResult.analysisId,
            processingTimeMs,
            costCents,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (processError) {
        rateTracker.concurrent--;
        const errorMessage = processError instanceof Error ? processError.message : "Unknown error";
        const processingTimeMs = Date.now() - startTime;

        // Check if should retry
        const shouldRetry = item.retry_count < item.max_retries;

        await supabase
          .from("bulk_analysis_items")
          .update({
            status: shouldRetry ? "pending" : "failed",
            error_message: errorMessage,
            retry_count: item.retry_count + 1,
            completed_at: shouldRetry ? null : new Date().toISOString(),
            processing_time_ms: processingTimeMs,
          })
          .eq("id", itemId);

        if (!shouldRetry) {
          // Update session failed count
          await supabase.rpc("increment_bulk_session_progress", {
            p_session_id: item.session_id,
            p_cost_cents: 0,
            p_is_completed: false,
            p_is_failed: true,
          });
        }

        return new Response(
          JSON.stringify({
            success: false,
            itemId,
            error: errorMessage,
            willRetry: shouldRetry,
            retryCount: item.retry_count + 1,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "pause") {
      await supabase
        .from("bulk_analysis_sessions")
        .update({ status: "paused", paused_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ paused: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel") {
      await supabase
        .from("bulk_analysis_sessions")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ cancelled: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "skip-item") {
      await supabase
        .from("bulk_analysis_items")
        .update({ status: "skipped", completed_at: new Date().toISOString() })
        .eq("id", itemId);

      // Update session skipped count
      const { data: item } = await supabase
        .from("bulk_analysis_items")
        .select("session_id")
        .eq("id", itemId)
        .single();

      if (item) {
        await supabase
          .from("bulk_analysis_sessions")
          .update({ skipped_items: supabase.rpc("increment", { x: 1 }) })
          .eq("id", item.session_id);
      }

      return new Response(
        JSON.stringify({ skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "retry-item") {
      await supabase
        .from("bulk_analysis_items")
        .update({ 
          status: "pending", 
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq("id", itemId);

      return new Response(
        JSON.stringify({ retrying: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-status") {
      const { data: session } = await supabase
        .from("bulk_analysis_sessions")
        .select(`
          *,
          items:bulk_analysis_items(*)
        `)
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      return new Response(
        JSON.stringify({ session }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Error in process-bulk-queue:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
