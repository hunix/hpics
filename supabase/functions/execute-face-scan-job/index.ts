import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FaceScanJob {
  id: string;
  user_id: string;
  job_type: string;
  model_key: string | null;
  scan_mode: string;
  auto_tag_threshold: number;
  confirm_threshold: number;
  media_ids: string[] | null;
  profile_ids: string[] | null;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  skipped_items: number;
  processed_media_ids: string[];
  failed_media_ids: Array<{ mediaId: string; error: string; attempts: number }>;
  current_batch_index: number;
  faces_detected: number;
  faces_matched: number;
  faces_auto_tagged: number;
  faces_pending_review: number;
  actual_cost_cents: number;
  tokens_used: number;
  retry_count: number;
  max_retries: number;
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobId, resume = false, retryFailedOnly = false } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "jobId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get job
    const { data: job, error: jobError } = await supabase
      .from("face_scan_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if job should be running
    if (!["running", "pending"].includes(job.status)) {
      return new Response(
        JSON.stringify({ error: "Job is not in a runnable state", status: job.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get items to process
    let mediaItems: Array<{ id: string; storage_path: string }> = [];

    if (retryFailedOnly && job.failed_media_ids?.length > 0) {
      // Retry only failed items
      const failedIds = job.failed_media_ids.map((f: { mediaId: string }) => f.mediaId);
      const { data } = await supabase
        .from("media")
        .select("id, storage_path")
        .in("id", failedIds);
      mediaItems = data || [];
    } else {
      // Get all media items not yet processed
      let query = supabase
        .from("media")
        .select("id, storage_path")
        .eq("user_id", job.user_id)
        .ilike("mime_type", "image/%");

      // Apply scope filter
      if (job.media_ids?.length > 0) {
        query = query.in("id", job.media_ids);
      }

      // Exclude already processed
      if (job.processed_media_ids?.length > 0) {
        query = query.not("id", "in", `(${job.processed_media_ids.join(",")})`);
      }

      // Apply scan mode
      if (job.scan_mode === "tagged_only") {
        // Only process media that has face regions
        const { data: regionMediaIds } = await supabase
          .from("face_regions")
          .select("media_id")
          .eq("user_id", job.user_id);
        
        const taggedIds = [...new Set(regionMediaIds?.map(r => r.media_id) || [])];
        if (taggedIds.length > 0) {
          query = query.in("id", taggedIds);
        } else {
          mediaItems = [];
        }
      }

      const { data } = await query.limit(500);
      mediaItems = data || [];
    }

    // Update total items if first run
    if (!resume && !retryFailedOnly && job.total_items === 0) {
      await supabase
        .from("face_scan_jobs")
        .update({ 
          total_items: mediaItems.length,
          started_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    // Process in batches
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let facesDetected = 0;
    let facesMatched = 0;
    let facesAutoTagged = 0;
    let facesPendingReview = 0;
    let totalCostCents = 0;
    let totalTokens = 0;
    const newProcessedIds: string[] = [];
    const newFailedItems: Array<{ mediaId: string; error: string; attempts: number }> = [];

    for (let i = 0; i < mediaItems.length; i += BATCH_SIZE) {
      // Check if job was paused or cancelled
      const { data: currentJob } = await supabase
        .from("face_scan_jobs")
        .select("status")
        .eq("id", jobId)
        .single();

      if (currentJob?.status === "paused" || currentJob?.status === "cancelled") {
        console.log(`Job ${jobId} was ${currentJob.status}, stopping execution`);
        break;
      }

      const batch = mediaItems.slice(i, i + BATCH_SIZE);

      for (const media of batch) {
        try {
          // Process based on job type
          if (job.job_type === "detect_local") {
            // Local detection is done client-side, just mark as needing detection
            newProcessedIds.push(media.id);
            successCount++;
          } else if (job.job_type === "detect_mosaic" || job.job_type === "full_pipeline") {
            // For cloud detection, we'd call the mosaic-biometric-match function
            // This is a simplified version - the actual implementation would batch images
            
            // Create a face region record for detected faces
            // In a real implementation, this would call the AI
            
            newProcessedIds.push(media.id);
            successCount++;
          } else if (job.job_type === "crop_faces") {
            // Cropping is done client-side
            newProcessedIds.push(media.id);
            successCount++;
          } else if (job.job_type === "match_faces") {
            // Match existing face regions against profiles
            const { data: regions } = await supabase
              .from("face_regions")
              .select("*")
              .eq("media_id", media.id)
              .eq("user_id", job.user_id)
              .is("profile_id", null);

            for (const region of regions || []) {
              // In a real implementation, this would compare embeddings
              facesDetected++;
            }

            newProcessedIds.push(media.id);
            successCount++;
          }

          processedCount++;
        } catch (error) {
          console.error(`Error processing media ${media.id}:`, error);
          
          const existingFailure = job.failed_media_ids?.find(
            (f: { mediaId: string }) => f.mediaId === media.id
          );
          const attempts = (existingFailure?.attempts || 0) + 1;
          
          newFailedItems.push({
            mediaId: media.id,
            error: error instanceof Error ? error.message : "Unknown error",
            attempts,
          });
          failedCount++;
          processedCount++;
        }
      }

      // Update progress after each batch
      const updatedFailedIds = [
        ...(job.failed_media_ids || []).filter(
          (f: { mediaId: string }) => !newFailedItems.some(n => n.mediaId === f.mediaId)
        ),
        ...newFailedItems,
      ];

      await supabase
        .from("face_scan_jobs")
        .update({
          processed_items: job.processed_items + processedCount,
          successful_items: job.successful_items + successCount,
          failed_items: updatedFailedIds.length,
          processed_media_ids: [...(job.processed_media_ids || []), ...newProcessedIds],
          failed_media_ids: updatedFailedIds,
          faces_detected: job.faces_detected + facesDetected,
          faces_matched: job.faces_matched + facesMatched,
          faces_auto_tagged: job.faces_auto_tagged + facesAutoTagged,
          faces_pending_review: job.faces_pending_review + facesPendingReview,
          actual_cost_cents: job.actual_cost_cents + totalCostCents,
          tokens_used: job.tokens_used + totalTokens,
          last_progress_at: new Date().toISOString(),
          current_batch_index: job.current_batch_index + 1,
        })
        .eq("id", jobId);

      // Reset counters for next batch update
      processedCount = 0;
      successCount = 0;
      failedCount = 0;
      facesDetected = 0;
      facesMatched = 0;
      facesAutoTagged = 0;
      facesPendingReview = 0;
      totalCostCents = 0;
      totalTokens = 0;
      newProcessedIds.length = 0;
      newFailedItems.length = 0;

      // Rate limit delay between batches
      if (i + BATCH_SIZE < mediaItems.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Check final status
    const { data: finalJob } = await supabase
      .from("face_scan_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (finalJob && finalJob.status === "running") {
      // Job completed naturally
      const isComplete = finalJob.processed_items >= finalJob.total_items;
      
      await supabase
        .from("face_scan_jobs")
        .update({
          status: isComplete ? "completed" : finalJob.status,
          completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Job processing completed",
        jobId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in execute-face-scan-job:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
