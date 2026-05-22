import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY_MS = 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const __url = new URL(req.url);
  if (__url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "batch-intelligence-init", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { jobType, action, jobId } = await req.json();

    // Handle cancel action
    if (action === 'cancel' && jobId) {
      const { error } = await supabase
        .from('batch_jobs')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Job cancelled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle start action
    if (action === 'start' && jobType) {
      // Check for existing running job
      const { data: runningJob } = await supabase
        .from('batch_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'running')
        .single();

      if (runningJob) {
        return new Response(
          JSON.stringify({ error: 'A job is already running. Please wait for it to complete.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get total items count based on job type
      let totalItems = 0;
      let estimatedCostCents = 0;

      switch (jobType) {
        case 'embeddings': {
          // messages has no user_id column - must join via conversations
          const { count: msgCount } = await supabase
            .from('messages')
            .select('id, conversations!inner(user_id)', { count: 'exact', head: true })
            .eq('conversations.user_id', user.id);
          const { count: mediaCount } = await supabase
            .from('media')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalItems = (msgCount ?? 0) + (mediaCount ?? 0);
          estimatedCostCents = Math.ceil(totalItems * 0.01 * 100);
          break;
        }
        case 'relationship_scores':
        case 'behavioral_predictions':
        case 'threat_assessment':
        case 'churn_prediction': {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalItems = count ?? 0;
          const costPerItem = jobType === 'behavioral_predictions' ? 5 : 
                             jobType === 'threat_assessment' ? 8 : 
                             jobType === 'churn_prediction' ? 3 : 2;
          estimatedCostCents = Math.ceil(totalItems * costPerItem);
          break;
        }
        case 'osint_scan': {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalItems = count ?? 0;
          estimatedCostCents = Math.ceil(totalItems * 10);
          break;
        }
        case 'relationship_inference': {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalItems = Math.ceil((count ?? 0) * 1.5);
          estimatedCostCents = Math.ceil(totalItems * 3);
          break;
        }
        case 'biometric_extraction': {
          const { count } = await supabase
            .from('media')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalItems = count ?? 0;
          estimatedCostCents = Math.ceil(totalItems * 4);
          break;
        }
      }

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('batch_jobs')
        .insert({
          user_id: user.id,
          job_type: jobType,
          status: 'running',
          total_items: totalItems,
          estimated_cost_cents: estimatedCostCents,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process synchronously (Deno Deploy doesn't support background tasks)
      // For long-running jobs, we process a batch and return, client should poll
      processJobBatch(supabase, user.id, job.id, jobType).catch(console.error);

      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: job.id,
          message: `Started ${jobType} job with ${totalItems} items`,
          estimatedCostCents
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processJobBatch(
  supabase: any,
  userId: string,
  jobId: string,
  jobType: string
) {
  let processedItems = 0;
  let failedItems = 0;
  let actualCostCents = 0;

  try {
      switch (jobType) {
        case 'embeddings':
          await processEmbeddings(supabase, userId, jobId, (progress, cost) => {
            processedItems = progress;
            actualCostCents = cost;
          });
          break;
        case 'behavioral_predictions':
          await processBehavioralPredictions(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
        case 'relationship_scores':
          await processRelationshipScores(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
        case 'osint_scan':
          await processOsintScans(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
        case 'threat_assessment':
          await processThreatAssessments(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
        case 'relationship_inference':
          await processRelationshipInference(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
        case 'biometric_extraction':
          await processBiometricExtraction(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
        case 'churn_prediction':
          await processChurnPredictions(supabase, userId, jobId, (progress, failed, cost) => {
            processedItems = progress;
            failedItems = failed;
            actualCostCents = cost;
          });
          break;
      }

    // Mark job as completed
    await supabase
      .from('batch_jobs')
      .update({
        status: 'completed',
        processed_items: processedItems,
        failed_items: failedItems,
        actual_cost_cents: actualCostCents,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

  } catch (error: unknown) {
    console.error(`Job ${jobId} failed:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('batch_jobs')
      .update({
        status: 'failed',
        processed_items: processedItems,
        failed_items: failedItems,
        actual_cost_cents: actualCostCents,
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

type ProgressCallback = (processed: number, cost: number) => void;
type ProgressWithFailedCallback = (processed: number, failed: number, cost: number) => void;

async function processEmbeddings(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressCallback
): Promise<void> {
  let processed = 0;
  let cost = 0;

  // Process messages - join via conversations for user scoping
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .not('content', 'is', null);

  if (messages) {
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      // Check if job was cancelled
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      const batch = messages.slice(i, i + BATCH_SIZE);
      const texts = batch.map((m: any) => m.content).filter(Boolean);
      const sourceIds = batch.map((m: any) => m.id);

      if (texts.length > 0) {
        try {
          await supabase.functions.invoke('generate-embeddings', {
            body: { texts, sourceType: 'message', sourceIds }
          });
          processed += batch.length;
          cost += batch.length;
        } catch (e) {
          console.error('Embedding batch failed:', e);
        }
      }

      // Update progress
      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }
}

async function processBehavioralPredictions(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId);

  if (profiles) {
    for (const profile of profiles) {
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      try {
        await supabase.functions.invoke('train-behavior-model', {
          body: { profileId: profile.id }
        });
        processed++;
        cost += 5;
      } catch (e) {
        console.error(`Behavioral prediction failed for ${profile.id}:`, e);
        failed++;
      }

      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, failed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }
}

async function processRelationshipScores(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId);

  if (profiles) {
    for (const profile of profiles) {
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      try {
        await supabase.functions.invoke('calculate-relationship-score', {
          body: { profileId: profile.id }
        });
        processed++;
        cost += 2;
      } catch (e) {
        console.error(`Relationship score failed for ${profile.id}:`, e);
        failed++;
      }

      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, failed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS / 2));
    }
  }
}

async function processOsintScans(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('user_id', userId);

  if (profiles) {
    for (const profile of profiles) {
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      try {
        await supabase.functions.invoke('osint-scan', {
          body: { profileId: profile.id }
        });
        processed++;
        cost += 10;
      } catch (e) {
        console.error(`OSINT scan failed for ${profile.id}:`, e);
        failed++;
      }

      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, failed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS * 2));
    }
  }
}

async function processThreatAssessments(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId);

  if (profiles) {
    for (const profile of profiles) {
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      try {
        await supabase.functions.invoke('assess-threat', {
          body: { profileId: profile.id }
        });
        processed++;
        cost += 8;
      } catch (e) {
        console.error(`Threat assessment failed for ${profile.id}:`, e);
        failed++;
      }

      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, failed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }
}

async function processRelationshipInference(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  try {
    await supabase.functions.invoke('infer-relationships', {
      body: { userId }
    });
    processed = 1;
    cost = 50;
  } catch (e) {
    console.error('Relationship inference failed:', e);
    failed = 1;
  }

  await supabase
    .from('batch_jobs')
    .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
    .eq('id', jobId);

  onProgress(processed, failed, cost);
}

async function processBiometricExtraction(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  const { data: media } = await supabase
    .from('media')
    .select('id, mime_type, profile_id')
    .eq('user_id', userId);

  if (media) {
    for (const item of media) {
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      try {
        const isImage = item.mime_type?.startsWith('image/');
        const isAudio = item.mime_type?.startsWith('audio/');
        
        if (isImage) {
          await supabase.functions.invoke('extract-facial-biometrics', {
            body: { mediaId: item.id, profileId: item.profile_id }
          });
        } else if (isAudio) {
          await supabase.functions.invoke('extract-voice-biometrics', {
            body: { mediaId: item.id, profileId: item.profile_id }
          });
        }
        processed++;
        cost += 4;
      } catch (e) {
        console.error(`Biometric extraction failed for ${item.id}:`, e);
        failed++;
      }

      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, failed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }
}

async function processChurnPredictions(
  supabase: any,
  userId: string,
  jobId: string,
  onProgress: ProgressWithFailedCallback
): Promise<void> {
  let processed = 0;
  let failed = 0;
  let cost = 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId);

  if (profiles) {
    for (const profile of profiles) {
      const { data: job } = await supabase
        .from('batch_jobs')
        .select('status')
        .eq('id', jobId)
        .single();
      
      if (job?.status === 'cancelled') return;

      try {
        await supabase.functions.invoke('predict-churn', {
          body: { profileId: profile.id }
        });
        processed++;
        cost += 3;
      } catch (e) {
        console.error(`Churn prediction failed for ${profile.id}:`, e);
        failed++;
      }

      await supabase
        .from('batch_jobs')
        .update({ processed_items: processed, failed_items: failed, actual_cost_cents: cost })
        .eq('id', jobId);

      onProgress(processed, failed, cost);
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS / 2));
    }
  }
}
