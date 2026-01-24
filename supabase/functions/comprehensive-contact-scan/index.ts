import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  profileId: string;
  deviceType?: 'mobile' | 'desktop';
  action?: 'start' | 'status' | 'cancel';
}

const SCAN_STAGES = [
  { id: 'profile', name: 'Profile Enrichment', function: 'enrich-profile' },
  { id: 'psychological', name: 'Psychological Analysis', function: 'deep-psychological-analysis' },
  { id: 'behavioral', name: 'Behavioral Predictions', function: 'analyze-behavioral' },
  { id: 'cross-modal', name: 'Cross-Modal Synthesis', function: 'cross-modal-fusion-realtime' },
  { id: 'network', name: 'Network Intelligence', function: 'network-analysis' },
  { id: 'preferences', name: 'Preference Extraction', function: 'predict-contact-preferences' },
  { id: 'trust', name: 'Trust Assessment', function: 'assess-trust' },
  { id: 'influence', name: 'Influence Mapping', function: 'analyze-influence' },
  { id: 'risks', name: 'Risk Analysis', function: 'predict-risks' },
  { id: 'dossier', name: 'Report Generation', function: 'generate-dossier' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'comprehensive-contact-scan', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, deviceType = 'desktop', action = 'start' } = await req.json() as ScanRequest;

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify profile belongs to user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      // Return current scan status
      const { data: session } = await supabase
        .from('comprehensive_scan_sessions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({ session }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel') {
      // Cancel active scan
      await supabase
        .from('comprehensive_scan_sessions')
        .update({ status: 'cancelled' })
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .eq('status', 'running');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing running scan
    const { data: existingScan } = await supabase
      .from('comprehensive_scan_sessions')
      .select('id')
      .eq('profile_id', profileId)
      .eq('status', 'running')
      .maybeSingle();

    if (existingScan) {
      return new Response(JSON.stringify({ 
        error: 'A scan is already in progress',
        sessionId: existingScan.id 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create new scan session
    const { data: session, error: sessionError } = await supabase
      .from('comprehensive_scan_sessions')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        status: 'running',
        device_type: deviceType,
        total_stages: SCAN_STAGES.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    const sessionId = session.id;
    const profileName = `${profile.first_name} ${profile.last_name || ''}`.trim();
    let totalCost = 0;
    const stagesCompleted: string[] = [];
    const resultsSummary: Record<string, any> = {};

    // Process each stage sequentially
    for (const stage of SCAN_STAGES) {
      // Check if scan was cancelled
      const { data: currentSession } = await supabase
        .from('comprehensive_scan_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (currentSession?.status === 'cancelled') {
        console.log('Scan cancelled by user');
        break;
      }

      console.log(`Processing stage: ${stage.name}`);

      try {
        // Call the appropriate edge function
        const functionUrl = `${supabaseUrl}/functions/v1/${stage.function}`;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileId,
            profileName,
            userId: user.id,
            includeInScan: true,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          stagesCompleted.push(stage.id);
          resultsSummary[stage.id] = {
            success: true,
            timestamp: new Date().toISOString(),
            cost: result.cost || 0,
          };
          totalCost += result.cost || 0;
        } else {
          const errorText = await response.text();
          console.error(`Stage ${stage.id} failed:`, errorText);
          resultsSummary[stage.id] = {
            success: false,
            error: errorText.substring(0, 200),
          };
        }
      } catch (stageError) {
        const stageMessage = stageError instanceof Error ? stageError.message : 'Unknown error';
        console.error(`Stage ${stage.id} error:`, stageMessage);
        resultsSummary[stage.id] = {
          success: false,
          error: stageMessage,
        };
      }

      // Update session progress
      await supabase
        .from('comprehensive_scan_sessions')
        .update({
          stages_completed: stagesCompleted,
          cost_cents: totalCost,
          results_summary: resultsSummary,
        })
        .eq('id', sessionId);
    }

    // Mark scan as completed
    const finalStatus = stagesCompleted.length === SCAN_STAGES.length ? 'completed' : 'failed';
    await supabase
      .from('comprehensive_scan_sessions')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        stages_completed: stagesCompleted,
        cost_cents: totalCost,
        results_summary: resultsSummary,
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      stagesCompleted: stagesCompleted.length,
      totalStages: SCAN_STAGES.length,
      totalCost,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Comprehensive scan error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
