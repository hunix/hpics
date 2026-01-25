import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All intelligence tasks mapped to EXISTING edge functions - v5.4 with complexity timeouts
// Complexity levels: light (3min), standard (5min), complex (10min), extreme (15min)
const INTELLIGENCE_TASKS = [
  // Core Intelligence (Priority 1) - 5 tasks
  { name: 'MICE Assessment', edgeFunction: 'mice-recruitment-analyzer', analysisType: 'mice_assessment', category: 'core', priority: 1, complexity: 'complex' },
  { name: 'Behavioral DNA', edgeFunction: 'behavioral-dna-sequencer', analysisType: 'behavioral_dna', category: 'core', priority: 1, complexity: 'standard' },
  { name: 'Attachment Vulnerability', edgeFunction: 'attachment-vulnerability-analyzer', analysisType: 'attachment_vulnerability', category: 'core', priority: 1, complexity: 'standard' },
  { name: 'Manipulation Susceptibility', edgeFunction: 'manipulation-vulnerability-assessment', analysisType: 'manipulation_susceptibility', category: 'core', priority: 1, complexity: 'standard' },
  { name: 'Phobia Exploitation', edgeFunction: 'phobia-exploitation-engine', analysisType: 'phobia_exploitation', category: 'core', priority: 1, complexity: 'light' },
  
  // Psychological Operations (Priority 2) - 6 tasks
  { name: 'Cognitive Warfare', edgeFunction: 'cognitive-warfare-engine', analysisType: 'cognitive_warfare', category: 'psychological', priority: 2, complexity: 'complex' },
  { name: 'Trauma Exploitation', edgeFunction: 'trauma-exploitation-engine', analysisType: 'trauma_exploitation', category: 'psychological', priority: 2, complexity: 'light' },
  { name: 'Deception Detection', edgeFunction: 'enhanced-deception-detector', analysisType: 'enhanced_deception_detection', category: 'psychological', priority: 2, complexity: 'standard' },
  { name: 'Influence Profile', edgeFunction: 'analyze-influence-profile', analysisType: 'influence_profile', category: 'psychological', priority: 2, complexity: 'standard' },
  { name: 'Coercion Resistance', edgeFunction: 'coercion-resistance-assessor', analysisType: 'coercion_resistance', category: 'psychological', priority: 2, complexity: 'standard' },
  { name: 'Existential Leverage', edgeFunction: 'existential-leverage-calculator', analysisType: 'existential_leverage', category: 'psychological', priority: 2, complexity: 'standard' },
  
  // Advanced Warfare (Priority 3) - 6 tasks
  { name: 'Memetic Propagation', edgeFunction: 'memetic-propagation-engine', analysisType: 'memetic_propagation', category: 'warfare', priority: 3, complexity: 'complex' },
  { name: 'Reality Consensus', edgeFunction: 'reality-consensus-engine', analysisType: 'reality_consensus', category: 'warfare', priority: 3, complexity: 'complex' },
  { name: 'Mass Formation', edgeFunction: 'mass-formation-analyzer', analysisType: 'mass_formation', category: 'warfare', priority: 3, complexity: 'complex' },
  { name: 'Narrative Control', edgeFunction: 'narrative-control-engine', analysisType: 'narrative_control', category: 'warfare', priority: 3, complexity: 'complex' },
  { name: 'Predictive Behavior', edgeFunction: 'predict-behavioral-scenarios', analysisType: 'behavioral_prediction', category: 'warfare', priority: 3, complexity: 'complex' },
  { name: 'Precognitive Patterns', edgeFunction: 'precognitive-pattern-engine', analysisType: 'precognitive_patterns', category: 'warfare', priority: 3, complexity: 'complex' },
  
  // Network Intelligence (Priority 4) - 4 tasks
  { name: 'Network Graph', edgeFunction: 'analyze-network-graph', analysisType: 'network_graph', category: 'network', priority: 4, complexity: 'extreme' },
  { name: 'Power Network', edgeFunction: 'power-network-analyzer', analysisType: 'power_network', category: 'network', priority: 4, complexity: 'extreme' },
  { name: 'Relationship Trajectory', edgeFunction: 'predict-relationship-trajectory', analysisType: 'relationship_trajectory', category: 'network', priority: 4, complexity: 'extreme' },
  { name: 'Network Exploitation', edgeFunction: 'network-exploitation-mapper', analysisType: 'network_exploitation', category: 'network', priority: 4, complexity: 'extreme' },
  
  // Temporal & Quantum (Priority 5) - 4 tasks
  { name: 'Temporal Fusion', edgeFunction: 'temporal-fusion-transformer', analysisType: 'temporal_fusion', category: 'temporal', priority: 5, complexity: 'complex' },
  { name: 'Quantum Cognition', edgeFunction: 'quantum-cognition-engine', analysisType: 'quantum_cognition', category: 'temporal', priority: 5, complexity: 'complex' },
  { name: 'Morphic Resonance', edgeFunction: 'morphic-resonance-detector', analysisType: 'morphic_resonance', category: 'temporal', priority: 5, complexity: 'complex' },
  { name: 'Omega Point Tracking', edgeFunction: 'omega-point-tracker', analysisType: 'omega_point', category: 'temporal', priority: 5, complexity: 'complex' },
  
  // Fusion Intelligence (Priority 6) - 5 tasks
  { name: 'Mosaic Intelligence', edgeFunction: 'mosaic-intelligence-fuser', analysisType: 'mosaic_intelligence_fusion', category: 'fusion', priority: 6, complexity: 'extreme' },
  { name: 'Unified Data Fusion', edgeFunction: 'unified-data-fusion', analysisType: 'unified_fusion', category: 'fusion', priority: 6, complexity: 'extreme' },
  { name: 'Omniscient Orchestrator', edgeFunction: 'omniscient-orchestrator', analysisType: 'omniscient_orchestration', category: 'fusion', priority: 6, complexity: 'extreme' },
  { name: 'Intelligence Dossier', edgeFunction: 'generate-intelligence-dossier', analysisType: 'full_dossier', category: 'fusion', priority: 6, complexity: 'extreme' },
  { name: 'Aggregate Intelligence', edgeFunction: 'aggregate-media-intelligence', analysisType: 'aggregate_intelligence', category: 'fusion', priority: 6, complexity: 'extreme' },
  
  // Defense Operations (Priority 7) - 10 warfare tasks
  { name: 'OPSEC Vulnerability', edgeFunction: 'opsec-vulnerability-analyzer', analysisType: 'opsec_assessment', category: 'defense', priority: 7, complexity: 'light' },
  { name: 'Social Engineering', edgeFunction: 'social-engineering-detector', analysisType: 'social_engineering', category: 'defense', priority: 7, complexity: 'standard' },
  { name: 'Crisis Response', edgeFunction: 'crisis-response-orchestrator', analysisType: 'crisis_response', category: 'defense', priority: 7, complexity: 'standard' },
  { name: 'Lawfare Defense', edgeFunction: 'lawfare-defense-analyzer', analysisType: 'lawfare_defense', category: 'defense', priority: 7, complexity: 'standard' },
  { name: 'Reputation Defense', edgeFunction: 'reputation-defense-engine', analysisType: 'reputation_defense', category: 'defense', priority: 7, complexity: 'standard' },
  { name: 'Behavioral Baseline', edgeFunction: 'behavioral-baseline-monitor', analysisType: 'behavioral_baseline', category: 'defense', priority: 7, complexity: 'light' },
  { name: 'Family Protection', edgeFunction: 'family-protection-analyzer', analysisType: 'family_protection', category: 'defense', priority: 7, complexity: 'light' },
  { name: 'Economic Warfare', edgeFunction: 'economic-warfare-detector', analysisType: 'economic_warfare', category: 'defense', priority: 7, complexity: 'standard' },
  { name: 'TSCM Sweep', edgeFunction: 'tscm-sweep-analyzer', analysisType: 'tscm_sweep', category: 'defense', priority: 7, complexity: 'light' },
  { name: 'Digital Footprint', edgeFunction: 'digital-footprint-scanner', analysisType: 'digital_footprint', category: 'defense', priority: 7, complexity: 'light' },
  
  // Advanced Fusion Intelligence (Priority 8) - 4 v5.0 tasks
  { name: 'Biometric-Behavioral Fusion', edgeFunction: 'biometric-behavioral-fusion', analysisType: 'biometric_behavioral_fusion', category: 'fusion', priority: 8, complexity: 'complex' },
  { name: 'Geospatial-Communication Fusion', edgeFunction: 'geospatial-communication-fusion', analysisType: 'geospatial_communication_fusion', category: 'fusion', priority: 8, complexity: 'complex' },
  { name: 'Financial-Document Synthesis', edgeFunction: 'financial-document-synthesis', analysisType: 'financial_document_synthesis', category: 'fusion', priority: 8, complexity: 'standard' },
  { name: 'Calendar Pattern Analyzer', edgeFunction: 'calendar-pattern-analyzer', analysisType: 'calendar_pattern', category: 'fusion', priority: 8, complexity: 'standard' },
  
  // Advanced Intelligence Systems (Priority 9) - 5 v6.0 tasks
  { name: 'Relationship Half-Life', edgeFunction: 'relationship-half-life-calculator', analysisType: 'relationship_half_life', category: 'intelligence', priority: 9, complexity: 'complex' },
  { name: 'Automated Red Team', edgeFunction: 'automated-red-team-engine', analysisType: 'automated_red_team', category: 'warfare', priority: 9, complexity: 'extreme' },
  { name: 'Multi-Party Deception', edgeFunction: 'multi-party-deception-detector', analysisType: 'multi_party_deception', category: 'warfare', priority: 9, complexity: 'extreme' },
  { name: 'Zero-Day Anomaly', edgeFunction: 'zero-day-anomaly-detector', analysisType: 'zero_day_anomaly', category: 'intelligence', priority: 9, complexity: 'complex' },
  { name: 'Hypergame Theory', edgeFunction: 'hypergame-theory-engine', analysisType: 'hypergame_theory', category: 'intelligence', priority: 9, complexity: 'extreme' },
];

// Per-complexity timeout values (in ms) - matches platform_config values
const COMPLEXITY_TIMEOUTS: Record<string, number> = {
  light: 180000,    // 3 minutes
  standard: 300000, // 5 minutes
  complex: 600000,  // 10 minutes
  extreme: 900000,  // 15 minutes
};

// Circuit breaker state (in-memory for this execution)
const circuitBreakers: Record<string, { failures: number; lastFailure: number; isOpen: boolean }> = {};
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_TIMEOUT = 60000; // 60 seconds

function checkCircuitBreaker(functionName: string): boolean {
  const breaker = circuitBreakers[functionName];
  if (!breaker) return true; // No circuit, allow
  
  if (breaker.isOpen) {
    // Check if we should try half-open
    if (Date.now() - breaker.lastFailure > CIRCUIT_RESET_TIMEOUT) {
      breaker.isOpen = false;
      breaker.failures = 0;
      return true;
    }
    return false;
  }
  return true;
}

function recordCircuitFailure(functionName: string): void {
  if (!circuitBreakers[functionName]) {
    circuitBreakers[functionName] = { failures: 0, lastFailure: 0, isOpen: false };
  }
  const breaker = circuitBreakers[functionName];
  breaker.failures++;
  breaker.lastFailure = Date.now();
  
  if (breaker.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    breaker.isOpen = true;
    console.log(`[Circuit Breaker] OPEN for ${functionName} after ${breaker.failures} failures`);
  }
}

function recordCircuitSuccess(functionName: string): void {
  if (circuitBreakers[functionName]) {
    circuitBreakers[functionName].failures = 0;
    circuitBreakers[functionName].isOpen = false;
  }
}

interface SessionAction {
  action: 'start' | 'resume' | 'pause' | 'cancel' | 'retry_failed' | 'retry_task' | 'process';
  profileId?: string;
  sessionId?: string;
  taskId?: string;
  forceRefresh?: boolean;
  userId?: string;
  batchSize?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/body parsing (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'intelligence-session-runner', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const body: SessionAction = await req.json();
    const { action, profileId, sessionId, taskId, forceRefresh, batchSize } = body;

    console.log(`[Session Runner] Action: ${action}, User: ${user.id}, Profile: ${profileId}, Session: ${sessionId}`);

    let result: any;

    // Handle undefined action - default to 'start' if profileId is provided
    const effectiveAction = action || (profileId ? 'start' : undefined);
    
    if (!effectiveAction) {
      return new Response(JSON.stringify({ 
        error: 'Action is required. Valid actions: start, resume, pause, cancel, retry_failed, retry_task, process',
        validActions: ['start', 'resume', 'pause', 'cancel', 'retry_failed', 'retry_task', 'process']
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (effectiveAction) {
      case 'start':
        result = await startSession(supabase, user.id, profileId!, forceRefresh || false);
        break;
      case 'resume':
        result = await resumeSession(supabase, user.id, sessionId!);
        break;
      case 'pause':
        result = await pauseSession(supabase, user.id, sessionId!);
        break;
      case 'cancel':
        result = await cancelSession(supabase, user.id, sessionId!);
        break;
      case 'retry_failed':
        result = await retryFailedTasks(supabase, user.id, sessionId!);
        break;
      case 'retry_task':
        result = await retryTask(supabase, user.id, taskId!);
        break;
      case 'process':
        // NEW: Synchronous batch processing - processes one batch and returns
        result = await processBatch(supabase, user.id, sessionId!, batchSize || 3);
        break;
      default:
        return new Response(JSON.stringify({ 
          error: `Unknown action: ${effectiveAction}`,
          validActions: ['start', 'resume', 'pause', 'cancel', 'retry_failed', 'retry_task', 'process']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session Runner] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startSession(supabase: any, userId: string, profileId: string, forceRefresh: boolean) {
  // Check for existing active session
  const { data: existingSession } = await supabase
    .from('intelligence_sessions')
    .select('id, status')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .in('status', ['pending', 'running', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingSession && !forceRefresh) {
    // Return existing session for resume
    return { sessionId: existingSession.id, status: 'existing', message: 'Active session exists' };
  }

  // Cancel any existing sessions for this profile
  if (existingSession) {
    await supabase
      .from('intelligence_sessions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', existingSession.id);
  }

  // Create new session
  const { data: session, error: sessionError } = await supabase
    .from('intelligence_sessions')
    .insert({
      user_id: userId,
      profile_id: profileId,
      status: 'pending',
      force_refresh: forceRefresh,
      total_tasks: INTELLIGENCE_TASKS.length,
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // Create all task records
  const taskRecords = INTELLIGENCE_TASKS.map(task => ({
    session_id: session.id,
    task_name: task.name,
    edge_function: task.edgeFunction,
    analysis_type: task.analysisType,
    category: task.category,
    priority: task.priority,
    status: 'pending',
    attempts: 0,
    max_attempts: 3,
  }));

  const { error: tasksError } = await supabase
    .from('intelligence_session_tasks')
    .insert(taskRecords);

  if (tasksError) throw tasksError;

  // Update session to running (no fire-and-forget - frontend will poll with 'process' action)
  await supabase
    .from('intelligence_sessions')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', session.id);

  console.log(`[Session ${session.id}] Created with ${INTELLIGENCE_TASKS.length} tasks - awaiting frontend polling`);

  return { sessionId: session.id, status: 'started', totalTasks: INTELLIGENCE_TASKS.length };
}

async function resumeSession(supabase: any, userId: string, sessionId: string) {
  // Verify ownership
  const { data: session, error } = await supabase
    .from('intelligence_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !session) throw new Error('Session not found');

  // Reset stuck 'running' tasks based on per-complexity timeouts
  // Get all running tasks and check against their complexity timeout
  const { data: runningTasks } = await supabase
    .from('intelligence_session_tasks')
    .select('id, started_at, edge_function')
    .eq('session_id', sessionId)
    .eq('status', 'running');

  if (runningTasks?.length) {
    const now = Date.now();
    const taskIdsToReset: string[] = [];
    
    for (const task of runningTasks) {
      // Find task complexity from INTELLIGENCE_TASKS
      const taskDef = INTELLIGENCE_TASKS.find(t => t.edgeFunction === task.edge_function);
      const complexity = taskDef?.complexity || 'standard';
      const timeout = COMPLEXITY_TIMEOUTS[complexity] || 300000;
      
      const taskStarted = new Date(task.started_at).getTime();
      if (now - taskStarted > timeout) {
        taskIdsToReset.push(task.id);
      }
    }
    
    if (taskIdsToReset.length > 0) {
      await supabase
        .from('intelligence_session_tasks')
        .update({ status: 'pending', started_at: null })
        .in('id', taskIdsToReset);
      console.log(`[Session ${sessionId}] Reset ${taskIdsToReset.length} stale tasks based on complexity timeouts`);
    }
  }

  // Update session status
  await supabase
    .from('intelligence_sessions')
    .update({ 
      status: 'running', 
      resumed_at: new Date().toISOString(),
      error_message: null 
    })
    .eq('id', sessionId);

  console.log(`[Session ${sessionId}] Resumed - awaiting frontend polling`);

  return { sessionId, status: 'resumed' };
}

async function pauseSession(supabase: any, userId: string, sessionId: string) {
  const { error } = await supabase
    .from('intelligence_sessions')
    .update({ 
      status: 'paused', 
      paused_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;

  return { sessionId, status: 'paused' };
}

async function cancelSession(supabase: any, userId: string, sessionId: string) {
  // Update session
  const { error: sessionError } = await supabase
    .from('intelligence_sessions')
    .update({ 
      status: 'cancelled', 
      completed_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (sessionError) throw sessionError;

  // Cancel pending tasks
  await supabase
    .from('intelligence_session_tasks')
    .update({ status: 'cancelled' })
    .eq('session_id', sessionId)
    .eq('status', 'pending');

  return { sessionId, status: 'cancelled' };
}

async function retryFailedTasks(supabase: any, userId: string, sessionId: string) {
  // Verify ownership
  const { data: session, error } = await supabase
    .from('intelligence_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !session) throw new Error('Session not found');

  // Reset failed tasks
  const { data: resetTasks } = await supabase
    .from('intelligence_session_tasks')
    .update({ 
      status: 'pending', 
      error_message: null,
      error_details: null,
      started_at: null,
      completed_at: null
    })
    .eq('session_id', sessionId)
    .eq('status', 'failed')
    .select();

  // Update session status (no fire-and-forget - frontend will poll with 'process' action)
  await supabase
    .from('intelligence_sessions')
    .update({ 
      status: 'running', 
      resumed_at: new Date().toISOString(),
      error_message: null 
    })
    .eq('id', sessionId);

  console.log(`[Session ${sessionId}] Retrying ${resetTasks?.length || 0} failed tasks - awaiting frontend polling`);

  return { sessionId, status: 'retrying', tasksReset: resetTasks?.length || 0 };
}

async function retryTask(supabase: any, userId: string, taskId: string) {
  // Get task and verify ownership through session
  const { data: task, error } = await supabase
    .from('intelligence_session_tasks')
    .select('*, session:intelligence_sessions!inner(*)')
    .eq('id', taskId)
    .single();

  if (error || !task || task.session.user_id !== userId) {
    throw new Error('Task not found');
  }

  // Reset task
  await supabase
    .from('intelligence_session_tasks')
    .update({ 
      status: 'pending', 
      error_message: null,
      error_details: null,
      started_at: null,
      completed_at: null,
      attempts: 0
    })
    .eq('id', taskId);

  // Ensure session is running (no fire-and-forget - frontend will poll with 'process' action)
  await supabase
    .from('intelligence_sessions')
    .update({ status: 'running' })
    .eq('id', task.session_id);

  console.log(`[Task ${taskId}] Reset for retry - awaiting frontend polling`);

  return { taskId, status: 'retrying' };
}

// NEW: Synchronous batch processing with atomic task claiming (v5.4)
async function processBatch(supabase: any, userId: string, sessionId: string, batchSize: number = 3) {
  console.log(`[Session ${sessionId}] Processing batch of ${batchSize} tasks (atomic claiming)`);
  
  // Verify ownership and get session details
  const { data: session, error: sessionError } = await supabase
    .from('intelligence_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'running') {
    return { 
      sessionId, 
      status: session.status, 
      processed: 0, 
      remaining: 0,
      message: `Session is ${session.status}, not processing` 
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Use atomic task claiming via RPC to prevent race conditions (SKIP LOCKED pattern)
  const { data: claimedTasks, error: claimError } = await supabase
    .rpc('claim_pending_tasks', { 
      p_session_id: sessionId, 
      p_limit: batchSize 
    });

  if (claimError) {
    console.error(`[Session ${sessionId}] Failed to claim tasks:`, claimError);
    throw new Error(`Task claiming failed: ${claimError.message}`);
  }

  if (!claimedTasks || claimedTasks.length === 0) {
    // No more pending tasks - finalize session
    const { data: allTasks } = await supabase
      .from('intelligence_session_tasks')
      .select('status')
      .eq('session_id', sessionId);

    const failed = allTasks?.filter((t: any) => t.status === 'failed').length || 0;
    const completed = allTasks?.filter((t: any) => t.status === 'completed').length || 0;
    const skipped = allTasks?.filter((t: any) => t.status === 'skipped').length || 0;

    const finalStatus = failed > 0 && completed === 0 ? 'failed' : 'completed';
    
    await supabase
      .from('intelligence_sessions')
      .update({ 
        status: finalStatus, 
        completed_at: new Date().toISOString(),
        current_category: null,
        completed_tasks: completed,
        failed_tasks: failed,
        skipped_tasks: skipped
      })
      .eq('id', sessionId);

    console.log(`[Session ${sessionId}] Completed. Status: ${finalStatus}, Completed: ${completed}, Failed: ${failed}, Skipped: ${skipped}`);

    return { 
      sessionId, 
      status: finalStatus, 
      processed: 0, 
      remaining: 0,
      completed,
      failed,
      skipped,
      message: 'Session completed' 
    };
  }

  // Update session current category
  await supabase
    .from('intelligence_sessions')
    .update({ current_category: claimedTasks[0].category })
    .eq('id', sessionId);

  // Process claimed tasks in parallel (already marked as 'running' by the RPC)
  const results = await Promise.all(claimedTasks.map((task: any) => 
    processTask(supabase, supabaseUrl, supabaseAnonKey, task, userId, session.profile_id, session.force_refresh)
  ));

  // Count remaining pending tasks
  const { count: remainingCount } = await supabase
    .from('intelligence_session_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'pending');

  // Get updated task counts for session
  const { data: taskCounts } = await supabase
    .from('intelligence_session_tasks')
    .select('status')
    .eq('session_id', sessionId);

  const completedCount = taskCounts?.filter((t: any) => t.status === 'completed').length || 0;
  const failedCount = taskCounts?.filter((t: any) => t.status === 'failed').length || 0;
  const skippedCount = taskCounts?.filter((t: any) => t.status === 'skipped').length || 0;

  // Update session counts
  await supabase
    .from('intelligence_sessions')
    .update({ 
      completed_tasks: completedCount,
      failed_tasks: failedCount,
      skipped_tasks: skippedCount
    })
    .eq('id', sessionId);

  console.log(`[Session ${sessionId}] Processed batch of ${claimedTasks.length} tasks. Remaining: ${remainingCount || 0}`);

  return { 
    sessionId, 
    status: 'running', 
    processed: claimedTasks.length, 
    remaining: remainingCount || 0,
    completed: completedCount,
    failed: failedCount,
    skipped: skippedCount,
    message: `Processed ${claimedTasks.length} tasks` 
  };
}

async function processSessionTasks(supabase: any, sessionId: string, userId: string, profileId: string, forceRefresh: boolean) {
  console.log(`[Session ${sessionId}] Starting task processing`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Process tasks by priority groups (1-7)
  const priorities = [1, 2, 3, 4, 5, 6, 7];
  
  for (const priority of priorities) {
    // Check if session is still running
    const { data: session } = await supabase
      .from('intelligence_sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (!session || session.status !== 'running') {
      console.log(`[Session ${sessionId}] Session no longer running, stopping`);
      break;
    }

    // Get pending tasks for this priority
    const { data: tasks } = await supabase
      .from('intelligence_session_tasks')
      .select('*')
      .eq('session_id', sessionId)
      .eq('priority', priority)
      .eq('status', 'pending')
      .order('created_at');

    if (!tasks || tasks.length === 0) continue;

    // Update session current category
    await supabase
      .from('intelligence_sessions')
      .update({ current_category: tasks[0].category })
      .eq('id', sessionId);

    // Process tasks in batches of 3
    const BATCH_SIZE = 3;
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      
      // Check session status again
      const { data: checkSession } = await supabase
        .from('intelligence_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (!checkSession || checkSession.status !== 'running') break;

      // Process batch in parallel
      await Promise.all(batch.map((task: any) => 
        processTask(supabase, supabaseUrl, supabaseAnonKey, task, userId, profileId, forceRefresh)
      ));
    }
  }

  // Check final status
  const { data: finalTasks } = await supabase
    .from('intelligence_session_tasks')
    .select('status')
    .eq('session_id', sessionId);

  const pending = finalTasks?.filter((t: any) => t.status === 'pending').length || 0;
  const failed = finalTasks?.filter((t: any) => t.status === 'failed').length || 0;
  const completed = finalTasks?.filter((t: any) => t.status === 'completed').length || 0;

  // Update session final status
  let finalStatus = 'completed';
  if (pending > 0) {
    // Still has pending tasks, might have been paused/cancelled
    const { data: session } = await supabase
      .from('intelligence_sessions')
      .select('status')
      .eq('id', sessionId)
      .single();
    finalStatus = session?.status || 'paused';
  } else if (failed > 0 && completed === 0) {
    finalStatus = 'failed';
  } else if (failed > 0) {
    finalStatus = 'completed'; // Partial success
  }

  if (finalStatus === 'completed' || finalStatus === 'failed') {
    await supabase
      .from('intelligence_sessions')
      .update({ 
        status: finalStatus, 
        completed_at: new Date().toISOString(),
        current_category: null
      })
      .eq('id', sessionId);
  }

  console.log(`[Session ${sessionId}] Processing complete. Status: ${finalStatus}, Completed: ${completed}, Failed: ${failed}`);
}

async function processTask(supabase: any, supabaseUrl: string, supabaseAnonKey: string, task: any, userId: string, profileId: string, forceRefresh: boolean) {
  const startTime = Date.now();
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Check circuit breaker
  if (!checkCircuitBreaker(task.edge_function)) {
    console.log(`[Task ${task.id}] Circuit breaker OPEN for ${task.edge_function}, skipping`);
    await supabase
      .from('intelligence_session_tasks')
      .update({ 
        status: 'pending', 
        error_message: 'Circuit breaker open, will retry later'
      })
      .eq('id', task.id);
    return;
  }

  // Mark task as running
  await supabase
    .from('intelligence_session_tasks')
    .update({ 
      status: 'running', 
      started_at: new Date().toISOString(),
      attempts: task.attempts + 1
    })
    .eq('id', task.id);

  try {
    console.log(`[Task ${task.id}] Invoking ${task.edge_function} for profile ${profileId}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    // Use service role key for backend-to-backend calls to avoid auth issues
    const response = await fetch(`${supabaseUrl}/functions/v1/${task.edge_function}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        userId,
        profileId,
        analysisType: task.analysis_type,
        forceRefresh,
        // Some functions expect different parameter names
        profile_id: profileId,
        user_id: userId,
        targetProfileId: profileId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    
    // Handle 404 - function doesn't exist
    if (response.status === 404) {
      console.warn(`[Task ${task.id}] Edge function ${task.edge_function} not found (404), marking as skipped`);
      await supabase
        .from('intelligence_session_tasks')
        .update({ 
          status: 'skipped', 
          completed_at: new Date().toISOString(),
          error_message: `Function not deployed: ${task.edge_function}`,
          processing_time_ms: Date.now() - startTime
        })
        .eq('id', task.id);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 500)}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }
    
    const processingTime = Date.now() - startTime;

    // Success - update task
    await supabase
      .from('intelligence_session_tasks')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        result,
        processing_time_ms: processingTime,
        error_message: null,
        error_details: null
      })
      .eq('id', task.id);

    recordCircuitSuccess(task.edge_function);
    console.log(`[Task ${task.id}] ${task.edge_function} completed in ${processingTime}ms`);

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Task ${task.id}] ${task.edge_function} failed:`, errorMessage);
    recordCircuitFailure(task.edge_function);

    // Check if we should retry
    const newAttempts = task.attempts + 1;
    const shouldRetry = newAttempts < task.max_attempts && isRetryableError(errorMessage);

    await supabase
      .from('intelligence_session_tasks')
      .update({ 
        status: shouldRetry ? 'pending' : 'failed',
        completed_at: shouldRetry ? null : new Date().toISOString(),
        error_message: errorMessage,
        error_details: { 
          attempts: newAttempts, 
          lastError: errorMessage,
          willRetry: shouldRetry,
          function: task.edge_function
        },
        processing_time_ms: processingTime
      })
      .eq('id', task.id);
  }
}

function isRetryableError(error: string): boolean {
  const retryablePatterns = [
    'timeout',
    'abort',
    '500',
    '502',
    '503',
    '504',
    'network',
    'connection',
    'ECONNRESET',
    'upstream connect error',
    'fetch failed',
  ];
  
  const lowerError = error.toLowerCase();
  return retryablePatterns.some(pattern => lowerError.includes(pattern.toLowerCase()));
}
