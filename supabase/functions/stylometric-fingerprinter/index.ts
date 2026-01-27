import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'stylometric-fingerprinter', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;
    const text = body.text;

    if (!userId || !text) {
      return new Response(JSON.stringify({ error: 'userId and text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stylometric analysis
    const words = text.toLowerCase().split(/\s+/).filter((w: string) => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    
    const avgWordLength = words.reduce((sum: number, w: string) => sum + w.length, 0) / (words.length || 1);
    const avgSentenceLength = sentences.length > 0 
      ? sentences.map((s: string) => s.split(/\s+/).length).reduce((a: number, b: number) => a + b, 0) / sentences.length 
      : 0;
    
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / (words.length || 1);
    
    // Hapax rate
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    let hapaxCount = 0;
    for (const count of wordCounts.values()) {
      if (count === 1) hapaxCount++;
    }
    const hapaxRate = hapaxCount / (words.length || 1);

    // LLM detection heuristics
    const isLLMGenerated = hapaxRate < 0.35 && vocabularyRichness < 0.6 && avgSentenceLength > 15;
    const llmConfidence = isLLMGenerated ? 0.7 : 0.3;

    const result = {
      stylometricFeatures: {
        avgWordLength,
        avgSentenceLength,
        vocabularyRichness,
        hapaxRate,
        wordCount: words.length,
        sentenceCount: sentences.length,
      },
      llmDetection: {
        isLLMGenerated,
        confidence: llmConfidence,
        predictedModel: isLLMGenerated ? 'unknown-llm' : null,
      },
      analyzedAt: new Date().toISOString(),
    };

    // Persist
    if (profileId) {
      await supabase.from('ai_analyses').upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'stylometric',
        results: { ...result, sourceText: text.slice(0, 500) },
        confidence_score: llmConfidence,
        created_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[stylometric-fingerprinter] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
