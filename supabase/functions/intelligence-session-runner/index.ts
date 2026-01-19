import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All intelligence tasks with their edge functions and categories
const INTELLIGENCE_TASKS = [
  // Core Intelligence (Priority 1)
  { name: 'MICE Assessment', edgeFunction: 'mice-recruitment-analyzer', analysisType: 'full_assessment', category: 'core', priority: 1 },
  { name: 'Behavioral DNA', edgeFunction: 'behavioral-dna-sequencer', analysisType: 'full_sequence', category: 'core', priority: 1 },
  { name: 'Dark Triad Analysis', edgeFunction: 'dark-triad-analyzer', analysisType: 'full_analysis', category: 'core', priority: 1 },
  { name: 'Vulnerability Mapping', edgeFunction: 'vulnerability-mapper', analysisType: 'comprehensive', category: 'core', priority: 1 },
  { name: 'Manipulation Susceptibility', edgeFunction: 'manipulation-susceptibility-engine', analysisType: 'full_assessment', category: 'core', priority: 1 },
  
  // Psychological Operations (Priority 2)
  { name: 'Cognitive Warfare', edgeFunction: 'cognitive-warfare-engine', analysisType: 'full_analysis', category: 'psychological', priority: 2 },
  { name: 'Emotional Exploitation', edgeFunction: 'emotional-exploitation-mapper', analysisType: 'full_mapping', category: 'psychological', priority: 2 },
  { name: 'Trust Architecture', edgeFunction: 'trust-architecture-mapper', analysisType: 'full_map', category: 'psychological', priority: 2 },
  { name: 'Social Engineering', edgeFunction: 'social-engineering-simulator', analysisType: 'full_simulation', category: 'psychological', priority: 2 },
  { name: 'Deception Detection', edgeFunction: 'deception-pattern-analyzer', analysisType: 'full_analysis', category: 'psychological', priority: 2 },
  { name: 'Influence Operations', edgeFunction: 'influence-operation-planner', analysisType: 'full_plan', category: 'psychological', priority: 2 },
  
  // Advanced Warfare (Priority 3)
  { name: 'Memetic Propagation', edgeFunction: 'memetic-propagation-engine', analysisType: 'vulnerability_scan', category: 'warfare', priority: 3 },
  { name: 'Reality Consensus', edgeFunction: 'reality-consensus-engine', analysisType: 'map_anchors', category: 'warfare', priority: 3 },
  { name: 'Mass Formation', edgeFunction: 'mass-formation-analyzer', analysisType: 'full_analysis', category: 'warfare', priority: 3 },
  { name: 'Narrative Warfare', edgeFunction: 'narrative-warfare-engine', analysisType: 'full_analysis', category: 'warfare', priority: 3 },
  { name: 'Predictive Behavior', edgeFunction: 'predictive-behavior-engine', analysisType: 'full_prediction', category: 'warfare', priority: 3 },
  { name: 'Precognitive Patterns', edgeFunction: 'precognitive-pattern-engine', analysisType: 'full_analysis', category: 'warfare', priority: 3 },
  
  // Network Intelligence (Priority 4)
  { name: 'Network Topology', edgeFunction: 'network-topology-mapper', analysisType: 'full_map', category: 'network', priority: 4 },
  { name: 'Social Graph', edgeFunction: 'social-graph-analyzer', analysisType: 'full_analysis', category: 'network', priority: 4 },
  { name: 'Relationship Dynamics', edgeFunction: 'relationship-dynamics-engine', analysisType: 'full_analysis', category: 'network', priority: 4 },
  { name: 'Influence Network', edgeFunction: 'influence-network-mapper', analysisType: 'full_map', category: 'network', priority: 4 },
  
  // Temporal & Quantum (Priority 5)
  { name: 'Temporal Dynamics', edgeFunction: 'temporal-dynamics-engine', analysisType: 'full_analysis', category: 'temporal', priority: 5 },
  { name: 'Quantum Cognition', edgeFunction: 'quantum-cognition-engine', analysisType: 'superposition', category: 'temporal', priority: 5 },
  { name: 'Morphic Resonance', edgeFunction: 'morphic-resonance-detector', analysisType: 'network', category: 'temporal', priority: 5 },
  
  // Meta Intelligence (Priority 6)
  { name: 'Meta Learning', edgeFunction: 'meta-learning-orchestrator', analysisType: 'full_training', category: 'meta', priority: 6 },
  { name: 'Omega Point', edgeFunction: 'omega-point-calculator', analysisType: 'full_calculation', category: 'meta', priority: 6 },
  { name: 'Reality Comprehension', edgeFunction: 'reality-comprehension-engine', analysisType: 'full_analysis', category: 'meta', priority: 6 },
  { name: 'Omniscient Synthesis', edgeFunction: 'omniscient-synthesis-engine', analysisType: 'full_synthesis', category: 'meta', priority: 6 },
  
  // Fusion Intelligence (Priority 7)
  { name: 'Deep Pattern Fusion', edgeFunction: 'deep-pattern-fusion-engine', analysisType: 'full_fusion', category: 'fusion', priority: 7 },
  { name: 'Unified Field Analysis', edgeFunction: 'unified-field-analyzer', analysisType: 'full_unification', category: 'fusion', priority: 7 },
  { name: 'Strategic Synthesis', edgeFunction: 'strategic-synthesis-engine', analysisType: 'full_synthesis', category: 'fusion', priority: 7 },
  { name: 'Hyperdimensional Mapping', edgeFunction: 'hyperdimensional-mapper', analysisType: 'full_mapping', category: 'fusion', priority: 7 },
  { name: 'Absolute Intelligence', edgeFunction: 'absolute-intelligence-synthesizer', analysisType: 'full_synthesis', category: 'fusion', priority: 7 },
  { name: 'Transcendent Integration', edgeFunction: 'transcendent-integration-engine', analysisType: 'full_integration', category: 'fusion', priority: 7 },
];

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
  action: 'start' | 'resume' | 'pause' | 'cancel' | 'retry_failed' | 'retry_task';
  profileId?: string;
  sessionId?: string;
  taskId?: string;
  forceRefresh?: boolean;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const { action, profileId, sessionId, taskId, forceRefresh } = body;

    console.log(`[Session Runner] Action: ${action}, User: ${user.id}, Profile: ${profileId}, Session: ${sessionId}`);

    let result: any;

    switch (action) {
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
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session Runner] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
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

  // Start processing in background
  EdgeRuntime.waitUntil(processSessionTasks(supabase, session.id, userId, profileId, forceRefresh));

  // Update session to running
  await supabase
    .from('intelligence_sessions')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', session.id);

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

  // Reset any stuck 'running' tasks (stale detection)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await supabase
    .from('intelligence_session_tasks')
    .update({ status: 'pending', started_at: null })
    .eq('session_id', sessionId)
    .eq('status', 'running')
    .lt('started_at', fiveMinutesAgo);

  // Update session status
  await supabase
    .from('intelligence_sessions')
    .update({ 
      status: 'running', 
      resumed_at: new Date().toISOString(),
      error_message: null 
    })
    .eq('id', sessionId);

  // Resume processing
  EdgeRuntime.waitUntil(processSessionTasks(supabase, sessionId, userId, session.profile_id, session.force_refresh));

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

  // Update session status
  await supabase
    .from('intelligence_sessions')
    .update({ 
      status: 'running', 
      resumed_at: new Date().toISOString(),
      error_message: null 
    })
    .eq('id', sessionId);

  // Resume processing
  EdgeRuntime.waitUntil(processSessionTasks(supabase, sessionId, userId, session.profile_id, session.force_refresh));

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

  // Ensure session is running
  await supabase
    .from('intelligence_sessions')
    .update({ status: 'running' })
    .eq('id', task.session_id);

  // Process this task
  EdgeRuntime.waitUntil(processSessionTasks(supabase, task.session_id, userId, task.session.profile_id, task.session.force_refresh));

  return { taskId, status: 'retrying' };
}

async function processSessionTasks(supabase: any, sessionId: string, userId: string, profileId: string, forceRefresh: boolean) {
  console.log(`[Session ${sessionId}] Starting task processing`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Process tasks by priority groups
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
      await Promise.all(batch.map(task => 
        processTask(supabase, supabaseUrl, supabaseAnonKey, task, userId, profileId, forceRefresh)
      ));
    }
  }

  // Check final status
  const { data: finalTasks } = await supabase
    .from('intelligence_session_tasks')
    .select('status')
    .eq('session_id', sessionId);

  const pending = finalTasks?.filter(t => t.status === 'pending').length || 0;
  const failed = finalTasks?.filter(t => t.status === 'failed').length || 0;
  const completed = finalTasks?.filter(t => t.status === 'completed').length || 0;

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
    console.log(`[Task ${task.id}] Invoking ${task.edge_function}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    const response = await fetch(`${supabaseUrl}/functions/v1/${task.edge_function}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userId,
        profileId,
        analysisType: task.analysis_type,
        forceRefresh,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
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
    console.log(`[Task ${task.id}] Completed in ${processingTime}ms`);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`[Task ${task.id}] Failed:`, errorMessage);
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
          willRetry: shouldRetry 
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
