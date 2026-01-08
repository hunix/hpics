import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Invalid token');

    const { profileId, imageUrls, model, modelTier = 'balanced' } = await req.json();

    const prompt = `Analyze these full-body images for biometric profiling:
1. Estimate height (if reference objects visible)
2. Body type classification
3. Body proportions
4. Posture patterns
5. Any distinctive physical characteristics

JSON response:
{
  "estimated_height": {"cm": 175, "confidence": 0.7, "reference_used": "door frame"},
  "body_type": "athletic",
  "proportions": {"torso_leg_ratio": 0.9, "arm_span_ratio": 1.0},
  "posture_profile": {"typical_stance": "upright", "shoulder_alignment": "level"},
  "distinctive_features": ["tall stature", "broad shoulders"]
}`;

    // Build image content for vision model
    const imageContent = imageUrls.map((url: string) => ({ 
      type: "image_url", 
      image_url: { url } 
    }));

    const selectedModel = model || selectModel(modelTier as any);
    
    const aiResponse = await callAI({
      model: selectedModel,
      messages: [{ 
        role: 'user', 
        content: JSON.stringify([{ type: "text", text: prompt }, ...imageContent])
      }],
      userId: user.id,
      functionName: 'extract-body-biometrics',
      profileId,
      maxTokens: 1500,
      promptKey: 'BIOMETRIC_BODY_ANALYSIS',
      promptVersion: 1,
    });

    const analysis = parseAIJson<Record<string, unknown> | null>(aiResponse.content, null);

    if (!analysis) {
      return new Response(JSON.stringify({ success: false, error: 'Analysis failed' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: existing } = await supabase
      .from('contact_biometrics')
      .select('id')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle();
    
    const data = { 
      body_measurements: analysis, 
      body_language_baseline: (analysis as Record<string, unknown>).posture_profile || null,
      ai_model_used: selectedModel,
    };
    
    if (existing) {
      await supabase.from('contact_biometrics').update(data).eq('id', existing.id);
    } else {
      await supabase.from('contact_biometrics').insert({ user_id: user.id, profile_id: profileId, ...data });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      cost_cents: aiResponse.costCents,
      tokens: aiResponse.totalTokens,
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('extract-body-biometrics error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
