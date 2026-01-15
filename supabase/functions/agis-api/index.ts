/**
 * AGIS External API
 * Provides programmatic access to AGIS intelligence capabilities
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agis-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface AGISRequest {
  action: string;
  profileId?: string;
  params?: Record<string, unknown>;
}

interface AGISResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate request
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header', timestamp: new Date().toISOString() }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token', timestamp: new Date().toISOString() }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: AGISRequest = await req.json();
    const { action, profileId, params } = body;

    let responseData: unknown;

    switch (action) {
      case 'get_mice_assessment': {
        if (!profileId) throw new Error('profileId required');
        const { data, error } = await supabase
          .from('mice_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_betrayal_prediction': {
        if (!profileId) throw new Error('profileId required');
        const { data, error } = await supabase
          .from('betrayal_predictions')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_sacred_values': {
        if (!profileId) throw new Error('profileId required');
        const { data, error } = await supabase
          .from('sacred_values')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('protection_level', { ascending: false });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_psychology_assessment': {
        if (!profileId) throw new Error('profileId required');
        const { data, error } = await supabase
          .from('psychology_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_full_dossier': {
        if (!profileId) throw new Error('profileId required');
        
        const [mice, betrayal, sacred, psychology, attachment, biometrics] = await Promise.all([
          supabase.from('mice_assessments').select('*').eq('user_id', user.id).eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('betrayal_predictions').select('*').eq('user_id', user.id).eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('sacred_values').select('*').eq('user_id', user.id).eq('profile_id', profileId).order('protection_level', { ascending: false }),
          supabase.from('psychology_assessments').select('*').eq('user_id', user.id).eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('attachment_profiles').select('*').eq('user_id', user.id).eq('profile_id', profileId).maybeSingle(),
          supabase.from('behavioral_biometrics').select('*').eq('user_id', user.id).eq('profile_id', profileId).maybeSingle(),
        ]);

        responseData = {
          mice_assessment: mice.data,
          betrayal_prediction: betrayal.data,
          sacred_values: sacred.data,
          psychology_assessment: psychology.data,
          attachment_profile: attachment.data,
          behavioral_biometrics: biometrics.data,
          generated_at: new Date().toISOString(),
        };
        break;
      }

      case 'list_high_risk_profiles': {
        const threshold = (params?.threshold as number) || 0.7;
        const { data, error } = await supabase
          .from('betrayal_predictions')
          .select('profile_id, defection_probability, trust_score, warning_signs')
          .eq('user_id', user.id)
          .gte('defection_probability', threshold)
          .order('defection_probability', { ascending: false });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_intelligence_snapshots': {
        if (!profileId) throw new Error('profileId required');
        const days = (params?.days as number) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        const { data, error } = await supabase
          .from('intelligence_snapshots')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .gte('snapshot_date', since.toISOString())
          .order('snapshot_date', { ascending: true });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_counter_intel_events': {
        const limit = (params?.limit as number) || 50;
        const { data, error } = await supabase
          .from('counter_intel_events')
          .select('*')
          .eq('user_id', user.id)
          .order('detected_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        responseData = data;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}. Available actions: get_mice_assessment, get_betrayal_prediction, get_sacred_values, get_psychology_assessment, get_full_dossier, list_high_risk_profiles, get_intelligence_snapshots, get_counter_intel_events`,
            timestamp: new Date().toISOString() 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const response: AGISResponse = {
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AGIS API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString() 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
