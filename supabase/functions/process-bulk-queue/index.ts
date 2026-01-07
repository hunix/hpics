import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  status: string;
  queue_position: number;
  priority_score: number;
  retry_count: number;
  max_retries: number;
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

      // Get next pending item
      const { data: nextItem, error: itemError } = await supabase
        .from("bulk_analysis_items")
        .select("*")
        .eq("session_id", sessionId)
        .eq("status", "pending")
        .order("priority_score", { ascending: false })
        .order("queue_position", { ascending: true })
        .limit(1)
        .single();

      if (itemError || !nextItem) {
        // No more items, check if session is complete
        const { data: session } = await supabase
          .from("bulk_analysis_sessions")
          .select("total_items, completed_items, failed_items, skipped_items")
          .eq("id", sessionId)
          .single();

        if (session) {
          const processed = session.completed_items + session.failed_items + session.skipped_items;
          if (processed >= session.total_items) {
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

      return new Response(
        JSON.stringify({ nextItem, done: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "process-item") {
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
