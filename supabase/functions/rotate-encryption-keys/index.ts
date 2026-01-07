import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, clearance')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { key_name, force_rotation } = await req.json();

    // Get existing key
    const { data: existingKey } = await supabase
      .from('encryption_keys')
      .select('*')
      .eq('key_name', key_name)
      .eq('user_id', user.id)
      .single();

    if (!existingKey && !force_rotation) {
      return new Response(JSON.stringify({ error: 'Key not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new key version
    const newVersion = (existingKey?.key_version || 0) + 1;
    
    // Create hash for new key (actual key is derived at runtime)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(`${user.id}:${key_name}:${newVersion}:${Date.now()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (existingKey) {
      // Deactivate old key
      await supabase
        .from('encryption_keys')
        .update({ is_active: false })
        .eq('id', existingKey.id);
    }

    // Create new key record
    const { data: newKey, error: insertError } = await supabase
      .from('encryption_keys')
      .insert({
        key_name,
        key_version: newVersion,
        key_hash: keyHash,
        algorithm: 'AES-256-GCM',
        is_active: true,
        created_by: user.id,
        user_id: user.id,
        rotated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Log the rotation
    await supabase.functions.invoke('log-audit-event', {
      body: {
        action_type: 'key_rotation',
        resource_type: 'encryption_key',
        resource_id: newKey.id,
        data_classification: 'top_secret',
        metadata: {
          key_name,
          old_version: existingKey?.key_version || 0,
          new_version: newVersion
        }
      },
      headers: { Authorization: authHeader }
    });

    console.log(`[KEY ROTATION] Key ${key_name} rotated to version ${newVersion} by ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      key_name,
      new_version: newVersion,
      rotated_at: newKey.rotated_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Key rotation error:', error);
    return new Response(JSON.stringify({ error: 'Key rotation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
