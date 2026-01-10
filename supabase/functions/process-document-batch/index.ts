import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId, action } = await req.json() as {
      jobId: string;
      action: 'start' | 'resume' | 'pause';
    };

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('document_analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle pause action
    if (action === 'pause') {
      await supabase
        .from('document_analysis_jobs')
        .update({ 
          status: 'paused', 
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Job paused' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing
    await supabase
      .from('document_analysis_jobs')
      .update({ 
        status: 'processing',
        started_at: job.started_at || new Date().toISOString(),
        paused_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Get items to process - documents are typically images with document-like extensions
    const options = job.options || {};
    const profileFilter = job.profile_id;

    // Query for document-type images (PDFs, scans, etc.)
    let query = supabase
      .from('media')
      .select('id, file_url, profile_id, file_name, mime_type')
      .eq('user_id', user.id)
      .or('mime_type.ilike.image/%,mime_type.ilike.application/pdf')
      .order('created_at', { ascending: true });

    if (profileFilter) {
      query = query.eq('profile_id', profileFilter);
    }

    // Get already processed items
    const { data: existingInsights } = await supabase
      .from('document_insights')
      .select('media_id')
      .eq('user_id', user.id)
      .eq('job_id', jobId);

    const processedIds = new Set((existingInsights || []).map(i => i.media_id));

    const { data: mediaItems, error: mediaError } = await query;

    if (mediaError) {
      throw new Error(`Failed to fetch media: ${mediaError.message}`);
    }

    // Filter to document-like files (exclude photos based on naming patterns)
    const documentPatterns = /\.(pdf|doc|docx|xls|xlsx|scan|receipt|invoice|contract)/i;
    let itemsToProcess = (mediaItems || []).filter(m => {
      if (processedIds.has(m.id)) return false;
      // Include PDFs always, and images that look like documents
      if (m.mime_type?.includes('pdf')) return true;
      if (m.file_name && documentPatterns.test(m.file_name)) return true;
      // Include all images if no specific filter - AI will classify
      return m.mime_type?.startsWith('image/');
    });
    
    if (job.current_item_id && action === 'resume') {
      const currentIndex = itemsToProcess.findIndex(m => m.id === job.current_item_id);
      if (currentIndex > 0) {
        itemsToProcess = itemsToProcess.slice(currentIndex);
      }
    }

    // Update total if starting fresh
    if (action === 'start') {
      await supabase
        .from('document_analysis_jobs')
        .update({ 
          total_items: itemsToProcess.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    let processedCount = job.processed_items || 0;
    let failedCount = job.failed_items || 0;
    let totalCostCents = job.actual_cost_cents || 0;

    // Process items one by one
    for (const item of itemsToProcess) {
      // Check if job was paused
      const { data: currentJob } = await supabase
        .from('document_analysis_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      if (currentJob?.status === 'paused') {
        break;
      }

      // Update current item
      await supabase
        .from('document_analysis_jobs')
        .update({ 
          current_item_id: item.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      try {
        // Call comprehensive document analysis
        const analyzeResponse = await fetch(
          `${supabaseUrl}/functions/v1/analyze-document-comprehensive`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mediaId: item.id,
              imageUrl: item.file_url,
              profileId: item.profile_id,
              jobId,
              options,
              model: job.model,
            }),
          }
        );

        const result = await analyzeResponse.json();

        if (result.success) {
          processedCount++;
          totalCostCents += result.costCents || 0;
        } else {
          failedCount++;
          console.error(`Failed to analyze document ${item.id}:`, result.error);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error processing document ${item.id}:`, error);
        
        await supabase
          .from('document_analysis_jobs')
          .update({ 
            last_error: error instanceof Error ? error.message : 'Unknown error',
            retry_count: (job.retry_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }

      // Update progress
      await supabase
        .from('document_analysis_jobs')
        .update({ 
          processed_items: processedCount,
          failed_items: failedCount,
          actual_cost_cents: totalCostCents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    // Check final status
    const { data: finalJob } = await supabase
      .from('document_analysis_jobs')
      .select('status, total_items, processed_items')
      .eq('id', jobId)
      .single();

    const isComplete = (finalJob?.processed_items || 0) >= (finalJob?.total_items || 0);
    
    if (isComplete && finalJob?.status !== 'paused') {
      await supabase
        .from('document_analysis_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    return new Response(JSON.stringify({
      success: true,
      processedCount,
      failedCount,
      totalCostCents,
      status: isComplete ? 'completed' : (finalJob?.status || 'processing'),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Document batch processing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
