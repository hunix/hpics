import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clearance level hierarchy
const CLEARANCE_LEVELS: Record<string, number> = {
  'uncleared': 0,
  'confidential': 1,
  'secret': 2,
  'top_secret': 3,
  'sci': 4
};

async function decryptData(ciphertext: string, iv: string, keyMaterial: CryptoKey): Promise<string> {
  const decoder = new TextDecoder();
  
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    keyMaterial,
    ciphertextBytes
  );
  
  return decoder.decode(decrypted);
}

async function deriveKey(userId: string, keyName: string): Promise<CryptoKey> {
  const masterSecret = Deno.env.get('ENCRYPTION_MASTER_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterSecret!.slice(0, 32)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = encoder.encode(`${userId}:${keyName}`);
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
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

    const { encrypted_value, table_name, column_name } = await req.json();

    if (!encrypted_value || !table_name || !column_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if value is encrypted
    if (!encrypted_value.startsWith('ENC:')) {
      return new Response(JSON.stringify({ value: encrypted_value }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get encryption field metadata
    const { data: fieldMeta } = await supabase
      .from('encrypted_fields')
      .select('data_classification')
      .eq('table_name', table_name)
      .eq('column_name', column_name)
      .eq('user_id', user.id)
      .single();

    // Get user's clearance level
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('clearance')
      .eq('user_id', user.id)
      .single();

    const requiredClearance = fieldMeta?.data_classification || 'confidential';
    const userClearance = userRole?.clearance || 'uncleared';

    // Check clearance
    if (CLEARANCE_LEVELS[userClearance] < CLEARANCE_LEVELS[requiredClearance]) {
      // Log denied access
      await supabase.from('sensitive_data_access_log').insert({
        user_id: user.id,
        table_name,
        access_type: 'decrypt',
        data_classification: requiredClearance,
        user_clearance: userClearance,
        access_granted: false,
        denial_reason: `Insufficient clearance: ${userClearance} < ${requiredClearance}`
      });

      console.log(`[DECRYPT DENIED] User ${user.id} lacks clearance for ${table_name}.${column_name}`);
      
      return new Response(JSON.stringify({ 
        error: 'Insufficient clearance',
        required: requiredClearance,
        current: userClearance
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse encrypted value
    const parts = encrypted_value.split(':');
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ error: 'Invalid encrypted format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const [, iv, ciphertext] = parts;

    // Derive key and decrypt
    const keyName = `${table_name}_${column_name}`;
    const cryptoKey = await deriveKey(user.id, keyName);
    const decryptedValue = await decryptData(ciphertext, iv, cryptoKey);

    // Log successful access
    await supabase.from('sensitive_data_access_log').insert({
      user_id: user.id,
      table_name,
      access_type: 'decrypt',
      data_classification: requiredClearance,
      user_clearance: userClearance,
      access_granted: true
    });

    console.log(`[DECRYPT] User ${user.id} decrypted ${table_name}.${column_name}`);

    return new Response(JSON.stringify({ value: decryptedValue }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Decryption error:', error);
    return new Response(JSON.stringify({ error: 'Decryption failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
