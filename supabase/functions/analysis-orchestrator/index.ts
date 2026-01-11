/**
 * Analysis Orchestrator - Central Brain for CAAS
 * Controls all analysis operations, job management, and state machines
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  appendAnalysisEvent, 
  registerSourceAsset,
  type AnalysisEvent,
  type SourceType,
  type AnalysisType 
} from "../_shared/event-store.ts";
import { withCircuitBreaker, withRetry, sendToDeadLetter } from "../_shared/circuit-breaker.ts";
import { deepMerge } from "../_shared/aggregate-builder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Job status state machine
type JobStatus = 
  | 'registered'
  | 'validating'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'dead_letter';

type JobType = 
  | 'single_analysis'
  | 'batch_analysis'
  | 'aggregate_rebuild'
  | 'correlation'
  | 'enrichment'
  | 'validation';

interface OrchestratorRequest {
  action: 'register_job' | 'start_job' | 'complete_job' | 'fail_job' | 'get_status' | 'process_queue' | 'rebuild_aggregates' | 'health_check';
  job_id?: string;
  job_type?: JobType;
  profile_id?: string;
  source_type?: SourceType;
  source_id?: string;
  source_metadata?: Record<string, unknown>;
  analysis_types?: AnalysisType[];
  priority?: number;
  result?: Record<string, unknown>;
  error_message?: string;
  limit?: number;
}

interface OrchestratorResponse {
  success: boolean;
  job_id?: string;
  jobs?: unknown[];
  status?: string;
  message?: string;
  health?: Record<string, unknown>;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request: OrchestratorRequest = await req.json();
    let response: OrchestratorResponse;

    switch (request.action) {
      case 'register_job':
        response = await registerJob(supabase, user.id, request);
        break;
      case 'start_job':
        response = await startJob(supabase, user.id, request.job_id!);
        break;
      case 'complete_job':
        response = await completeJob(supabase, user.id, request.job_id!, request.result!);
        break;
      case 'fail_job':
        response = await failJob(supabase, user.id, request.job_id!, request.error_message!);
        break;
      case 'get_status':
        response = await getJobStatus(supabase, user.id, request.job_id);
        break;
      case 'process_queue':
        response = await processQueue(supabase, user.id, request.limit || 5);
        break;
      case 'rebuild_aggregates':
        response = await rebuildAggregates(supabase, user.id, request.profile_id, request.analysis_types);
        break;
      case 'health_check':
        response = await healthCheck(supabase);
        break;
      default:
        response = { success: false, error: 'Unknown action' };
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Register a new analysis job
 */
async function registerJob(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const idempotencyKey = `${userId}:${request.job_type}:${request.source_type}:${request.source_id}:${request.analysis_types?.join(',')}`;
  
  // Check for existing job (idempotency)
  const { data: existing } = await supabase
    .from('orchestrator_jobs')
    .select('id, status')
    .eq('idempotency_key', idempotencyKey)
    .in('status', ['registered', 'validating', 'queued', 'processing'])
    .maybeSingle();

  if (existing) {
    return { 
      success: true, 
      job_id: existing.id, 
      status: existing.status,
      message: 'Job already exists' 
    };
  }

  // Register source asset if provided
  let registryId: string | undefined;
  if (request.source_type && request.source_id) {
    const registration = await registerSourceAsset(supabase, {
      user_id: userId,
      asset_type: request.source_type,
      asset_id: request.source_id,
      metadata: request.source_metadata
    });
    registryId = registration.registry_id;
  }

  // Create job
  const { data: job, error } = await supabase
    .from('orchestrator_jobs')
    .insert({
      user_id: userId,
      job_type: request.job_type,
      idempotency_key: idempotencyKey,
      profile_id: request.profile_id,
      source_type: request.source_type,
      source_id: request.source_id,
      source_registry_id: registryId,
      status: 'registered',
      status_history: [{ status: 'registered', at: new Date().toISOString() }],
      priority: request.priority || 5,
      scheduled_for: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Update heartbeat
  await updateComponentHealth(supabase, 'orchestrator', true);

  return { 
    success: true, 
    job_id: job.id, 
    status: 'registered',
    message: 'Job registered successfully' 
  };
}

/**
 * Start processing a job
 */
async function startJob(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobId: string
): Promise<OrchestratorResponse> {
  const { data: job, error: fetchError } = await supabase
    .from('orchestrator_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: 'Job not found' };
  }

  if (!['registered', 'queued'].includes(job.status)) {
    return { success: false, error: `Cannot start job in ${job.status} status` };
  }

  const statusHistory = [...(job.status_history || []), {
    status: 'processing',
    at: new Date().toISOString()
  }];

  const { error } = await supabase
    .from('orchestrator_jobs')
    .update({
      status: 'processing',
      status_history: statusHistory,
      started_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
      worker_id: `worker-${crypto.randomUUID().slice(0, 8)}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, job_id: jobId, status: 'processing' };
}

/**
 * Complete a job with results
 */
async function completeJob(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobId: string,
  result: Record<string, unknown>
): Promise<OrchestratorResponse> {
  const { data: job, error: fetchError } = await supabase
    .from('orchestrator_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: 'Job not found' };
  }

  // Create analysis event
  const analysisTypes = result.analysis_types as AnalysisType[] || ['comprehensive'];
  const eventIds: string[] = [];

  for (const analysisType of analysisTypes) {
    const eventResult = await appendAnalysisEvent(supabase, {
      user_id: userId,
      profile_id: job.profile_id,
      event_type: 'analysis_created',
      source_type: job.source_type,
      source_id: job.source_id,
      source_registry_id: job.source_registry_id,
      analysis_type: analysisType,
      analysis_model: result.model as string,
      raw_result: result.data as Record<string, unknown> || result,
      confidence_score: result.confidence as number,
      key_insights: result.insights as string[],
      processing_duration_ms: result.duration_ms as number,
      cost_cents: result.cost_cents as number,
      tokens_used: result.tokens as number
    });

    if (eventResult.success && eventResult.event_id) {
      eventIds.push(eventResult.event_id);
    }
  }

  const statusHistory = [...(job.status_history || []), {
    status: 'completed',
    at: new Date().toISOString()
  }];

  const durationMs = job.started_at 
    ? Date.now() - new Date(job.started_at).getTime()
    : null;

  const { error } = await supabase
    .from('orchestrator_jobs')
    .update({
      status: 'completed',
      status_history: statusHistory,
      completed_at: new Date().toISOString(),
      result_event_ids: eventIds,
      result_summary: result,
      actual_duration_ms: durationMs,
      actual_cost_cents: result.cost_cents as number,
      tokens_used: result.tokens as number,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, job_id: jobId, status: 'completed' };
}

/**
 * Fail a job with error
 */
async function failJob(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobId: string,
  errorMessage: string
): Promise<OrchestratorResponse> {
  const { data: job, error: fetchError } = await supabase
    .from('orchestrator_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: 'Job not found' };
  }

  const newRetryCount = (job.retry_count || 0) + 1;
  const shouldRetry = newRetryCount <= (job.max_retries || 3);

  const statusHistory = [...(job.status_history || []), {
    status: shouldRetry ? 'queued' : 'failed',
    at: new Date().toISOString(),
    error: errorMessage
  }];

  if (shouldRetry) {
    // Retry with exponential backoff
    const backoffMs = Math.min(1000 * Math.pow(2, newRetryCount), 60000);
    const scheduledFor = new Date(Date.now() + backoffMs);

    const { error } = await supabase
      .from('orchestrator_jobs')
      .update({
        status: 'queued',
        status_history: statusHistory,
        retry_count: newRetryCount,
        last_retry_at: new Date().toISOString(),
        scheduled_for: scheduledFor.toISOString(),
        error_message: errorMessage,
        error_details: { last_error: errorMessage, retry_count: newRetryCount },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job_id: jobId, status: 'queued', message: `Retry ${newRetryCount} scheduled` };
  } else {
    // Send to dead letter queue
    await sendToDeadLetter(supabase, jobId, userId, job, errorMessage);

    const { error } = await supabase
      .from('orchestrator_jobs')
      .update({
        status: 'dead_letter',
        status_history: statusHistory,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job_id: jobId, status: 'dead_letter', message: 'Moved to dead letter queue' };
  }
}

/**
 * Get job status
 */
async function getJobStatus(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobId?: string
): Promise<OrchestratorResponse> {
  if (jobId) {
    const { data: job, error } = await supabase
      .from('orchestrator_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      return { success: false, error: 'Job not found' };
    }

    return { success: true, jobs: [job], status: job.status };
  }

  // Get recent jobs
  const { data: jobs, error } = await supabase
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, jobs: jobs || [] };
}

/**
 * Process queued jobs
 */
async function processQueue(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number
): Promise<OrchestratorResponse> {
  // Get queued jobs ready for processing
  const { data: jobs, error } = await supabase
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['registered', 'queued'])
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !jobs?.length) {
    return { success: true, jobs: [], message: 'No jobs to process' };
  }

  const processedJobs = [];

  for (const job of jobs) {
    // Start the job
    await startJob(supabase, userId, job.id);
    processedJobs.push(job.id);
  }

  return { 
    success: true, 
    jobs: processedJobs,
    message: `Started ${processedJobs.length} jobs` 
  };
}

/**
 * Rebuild aggregates for a profile
 */
async function rebuildAggregates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profileId?: string,
  analysisTypes?: AnalysisType[]
): Promise<OrchestratorResponse> {
  const types = analysisTypes || ['psychological', 'linguistic', 'behavioral', 'biometric', 'facial', 'voice'];
  
  let query = supabase
    .from('analysis_aggregates')
    .select('id, profile_id, aggregate_type')
    .eq('user_id', userId)
    .eq('needs_rebuild', true);

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  if (analysisTypes?.length) {
    query = query.in('aggregate_type', analysisTypes);
  }

  const { data: aggregates, error } = await query.limit(10);

  if (error || !aggregates?.length) {
    return { success: true, message: 'No aggregates need rebuilding' };
  }

  const results = [];
  for (const agg of aggregates) {
    try {
      const { data: result } = await supabase.rpc('rebuild_analysis_aggregate', {
        p_user_id: userId,
        p_profile_id: agg.profile_id,
        p_aggregate_type: agg.aggregate_type
      });
      results.push({ ...agg, result });
    } catch (err) {
      console.error(`Failed to rebuild ${agg.aggregate_type} for ${agg.profile_id}:`, err);
    }
  }

  return { 
    success: true, 
    jobs: results,
    message: `Rebuilt ${results.length} aggregates` 
  };
}

/**
 * Health check for all components
 */
async function healthCheck(
  supabase: ReturnType<typeof createClient>
): Promise<OrchestratorResponse> {
  const { data: health } = await supabase
    .from('system_health')
    .select('*');

  const components: Record<string, unknown> = {};
  let overallHealthy = true;

  for (const component of health || []) {
    const isStale = component.last_heartbeat 
      ? Date.now() - new Date(component.last_heartbeat).getTime() > 300000 // 5 minutes
      : true;
    
    const status = isStale ? 'unknown' : component.status;
    if (status !== 'healthy') {
      overallHealthy = false;
    }

    components[component.component] = {
      status,
      circuit_state: component.circuit_state,
      last_heartbeat: component.last_heartbeat,
      errors_last_hour: component.errors_last_hour
    };
  }

  // Get job statistics
  const { data: jobStats } = await supabase
    .from('orchestrator_jobs')
    .select('status')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  const stats = {
    total: jobStats?.length || 0,
    processing: jobStats?.filter(j => j.status === 'processing').length || 0,
    completed: jobStats?.filter(j => j.status === 'completed').length || 0,
    failed: jobStats?.filter(j => j.status === 'failed').length || 0,
    queued: jobStats?.filter(j => j.status === 'queued').length || 0
  };

  return {
    success: true,
    health: {
      overall: overallHealthy ? 'healthy' : 'degraded',
      components,
      job_stats_last_hour: stats,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Update component health heartbeat
 */
async function updateComponentHealth(
  supabase: ReturnType<typeof createClient>,
  component: string,
  isSuccess: boolean
): Promise<void> {
  const now = new Date().toISOString();
  
  await supabase
    .from('system_health')
    .update({
      last_heartbeat: now,
      status: 'healthy',
      consecutive_failures: isSuccess ? 0 : undefined,
      updated_at: now
    })
    .eq('component', component);
}
