import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { 
      action_type, 
      resource_type, 
      resource_id, 
      data_classification,
      metadata 
    } = await req.json();

    if (!action_type || !resource_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's current clearance
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('clearance')
      .eq('user_id', user.id)
      .single();

    // Get the previous log entry for hash chain
    const { data: lastLog } = await supabase
      .from('immutable_audit_logs')
      .select('current_hash, sequence_number')
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastLog?.current_hash || 'GENESIS';

    // Build the log entry data for hashing
    const timestamp = new Date().toISOString();
    const logData = {
      user_id: user.id,
      action_type,
      resource_type,
      resource_id,
      data_classification,
      clearance_used: userRole?.clearance || 'uncleared',
      timestamp,
      previous_hash: previousHash,
      metadata
    };

    // Compute current hash (includes previous hash for chain integrity)
    const currentHash = await computeHash(JSON.stringify(logData));

    // Get IP and user agent from request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Insert immutable audit log
    const { data: auditLog, error: insertError } = await supabase
      .from('immutable_audit_logs')
      .insert({
        user_id: user.id,
        action_type,
        resource_type,
        resource_id,
        data_classification,
        clearance_used: userRole?.clearance || 'uncleared',
        previous_hash: previousHash,
        current_hash: currentHash,
        ip_address: ipAddress !== 'unknown' ? ipAddress : null,
        user_agent: userAgent,
        request_metadata: metadata,
        response_status: 'success'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Audit log insert error:', insertError);
      throw insertError;
    }

    console.log(`[AUDIT] ${action_type} on ${resource_type}:${resource_id} by ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      log_id: auditLog.id,
      sequence_number: auditLog.sequence_number,
      hash: currentHash
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Audit logging error:', error);
    return new Response(JSON.stringify({ error: 'Failed to log audit event' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
