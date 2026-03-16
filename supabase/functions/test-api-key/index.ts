import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'test-api-key', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth
  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader ?? '' } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const provider = body.provider as string;
    const apiKey = body.apiKey as string;

    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ success: false, message: 'Missing provider or apiKey' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const start = Date.now();
    let result: { success: boolean; message: string };

    switch (provider) {
      case 'OPENAI_API_KEY': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const text = await res.text();
        result = res.ok
          ? { success: true, message: 'OpenAI connected' }
          : { success: false, message: `OpenAI: ${res.status}` };
        break;
      }
      case 'ANTHROPIC_API_KEY': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-20250514',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        const text = await res.text();
        result = res.ok || res.status === 200
          ? { success: true, message: 'Anthropic connected' }
          : { success: false, message: `Anthropic: ${res.status}` };
        break;
      }
      case 'GEMINI_API_KEY': {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const text = await res.text();
        result = res.ok
          ? { success: true, message: 'Gemini connected' }
          : { success: false, message: `Gemini: ${res.status}` };
        break;
      }
      case 'GROQ_API_KEY': {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const text = await res.text();
        result = res.ok
          ? { success: true, message: 'Groq connected' }
          : { success: false, message: `Groq: ${res.status}` };
        break;
      }
      case 'ELEVENLABS_API_KEY': {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': apiKey },
        });
        const text = await res.text();
        result = res.ok
          ? { success: true, message: 'ElevenLabs connected' }
          : { success: false, message: `ElevenLabs: ${res.status}` };
        break;
      }
      case 'DEEPGRAM_API_KEY': {
        const res = await fetch('https://api.deepgram.com/v1/projects', {
          headers: { Authorization: `Token ${apiKey}` },
        });
        const text = await res.text();
        result = res.ok
          ? { success: true, message: 'Deepgram connected' }
          : { success: false, message: `Deepgram: ${res.status}` };
        break;
      }
      case 'PDL_API_KEY': {
        const res = await fetch('https://api.peopledatalabs.com/v5/person/enrich?email=test@test.com', {
          headers: { 'X-Api-Key': apiKey },
        });
        const text = await res.text();
        // PDL returns 404 for not found but key is valid if not 401/403
        result = res.status !== 401 && res.status !== 403
          ? { success: true, message: 'PDL connected' }
          : { success: false, message: `PDL: ${res.status}` };
        break;
      }
      case 'HUGGINGFACE_HUB_TOKEN': {
        const res = await fetch('https://huggingface.co/api/whoami-v2', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const text = await res.text();
        result = res.ok
          ? { success: true, message: 'HuggingFace connected' }
          : { success: false, message: `HuggingFace: ${res.status}` };
        break;
      }
      default:
        result = { success: false, message: `No test available for ${provider}` };
    }

    const duration = Date.now() - start;

    return new Response(JSON.stringify({ ...result, responseTime: duration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
