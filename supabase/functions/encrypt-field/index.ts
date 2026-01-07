import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple AES-256-GCM encryption using Web Crypto API
async function encryptData(plaintext: string, keyMaterial: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(plaintext)
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

async function getOrCreateKey(supabase: any, userId: string, keyName: string): Promise<CryptoKey> {
  // In production, keys would be stored in Vault or HSM
  // For now, derive key from a secret + user-specific salt
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

    const { value, table_name, column_name, classification } = await req.json();

    if (!value || !table_name || !column_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create encryption key
    const keyName = `${table_name}_${column_name}`;
    const cryptoKey = await getOrCreateKey(supabase, user.id, keyName);

    // Encrypt the value
    const { ciphertext, iv } = await encryptData(value, cryptoKey);

    // Store encryption metadata
    await supabase.from('encrypted_fields').upsert({
      table_name,
      column_name,
      data_classification: classification || 'confidential',
      encryption_enabled: true,
      user_id: user.id
    }, { onConflict: 'table_name,column_name,user_id' });

    // Log the encryption action
    console.log(`[ENCRYPT] User ${user.id} encrypted ${table_name}.${column_name}`);

    return new Response(JSON.stringify({
      encrypted_value: `ENC:${iv}:${ciphertext}`,
      algorithm: 'AES-256-GCM',
      classification
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Encryption error:', error);
    return new Response(JSON.stringify({ error: 'Encryption failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
