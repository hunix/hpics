import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ModalityData {
  type: string;
  confidence: number;
  findings: Record<string, unknown>;
  timestamp: string;
}

interface SynthesisResult {
  corroborated_findings: Array<{
    finding: string;
    modalities: string[];
    confidence: number;
    temporal_alignment: number;
  }>;
  contradictions: Array<{
    finding: string;
    modalities: string[];
    severity: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  deception_assessment: {
    risk_level: 'low' | 'medium' | 'high';
    confidence: number;
    indicators: string[];
    behavioral_inconsistencies: string[];
  };
  confidence_boosted_insights: string[];
  overall_summary: string;
  modal_weights: Record<string, number>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all modality data in parallel
    const [vocalData, facialData, bodyLanguageData, behavioralData, profileData] = await Promise.all([
      supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'vocal')
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'facial')
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase
        .from('body_language_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .neq('analysis_type', 'cross_modal')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single(),
    ]);

    // Prepare modality context
    const modalityContext: ModalityData[] = [];

    if (vocalData.data?.length) {
      vocalData.data.forEach(v => {
        modalityContext.push({
          type: 'vocal',
          confidence: (v.result as Record<string, unknown>)?.confidence as number || 0.7,
          findings: v.result as Record<string, unknown>,
          timestamp: v.generated_at,
        });
      });
    }

    if (facialData.data?.length) {
      facialData.data.forEach(f => {
        modalityContext.push({
          type: 'facial',
          confidence: (f.result as Record<string, unknown>)?.confidence as number || 0.75,
          findings: f.result as Record<string, unknown>,
          timestamp: f.generated_at,
        });
      });
    }

    if (bodyLanguageData.data?.length) {
      bodyLanguageData.data.forEach(b => {
        modalityContext.push({
          type: 'body_language',
          confidence: b.confidence_score || 0.65,
          findings: {
            posture: b.posture_analysis,
            gestures: b.gesture_patterns,
            comfort: b.comfort_indicators,
            rapport: b.rapport_signals,
          },
          timestamp: b.created_at,
        });
      });
    }

    if (behavioralData.data?.length) {
      behavioralData.data.forEach(b => {
        modalityContext.push({
          type: 'behavioral',
          confidence: b.confidence_score || 0.7,
          findings: {
            patterns: b.behavioral_patterns,
            personality: b.personality_indicators,
          },
          timestamp: b.created_at,
        });
      });
    }

    if (modalityContext.length < 2) {
      return new Response(JSON.stringify({ 
        error: "Insufficient data for cross-modal synthesis",
        available_modalities: modalityContext.length,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI for synthesis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert behavioral analyst specializing in cross-modal signal synthesis. 
Your task is to analyze data from multiple modalities (vocal, facial, body language, behavioral) and:
1. Identify findings that are corroborated across modalities (increases confidence)
2. Detect contradictions between modalities (potential deception indicators)
3. Assess overall deception risk based on inconsistencies
4. Provide high-confidence insights where multiple modalities agree

Respond with a JSON object matching this structure:
{
  "corroborated_findings": [{"finding": "...", "modalities": ["vocal", "facial"], "confidence": 0.85, "temporal_alignment": 0.9}],
  "contradictions": [{"finding": "...", "modalities": ["vocal", "behavioral"], "severity": "medium", "explanation": "..."}],
  "deception_assessment": {"risk_level": "low|medium|high", "confidence": 0.7, "indicators": [], "behavioral_inconsistencies": []},
  "confidence_boosted_insights": ["insight1", "insight2"],
  "overall_summary": "Comprehensive assessment...",
  "modal_weights": {"vocal": 0.25, "facial": 0.25, "body_language": 0.25, "behavioral": 0.25}
}`;

    const userPrompt = `Analyze the following multi-modal data for profile "${profileData.data?.first_name || 'Unknown'} ${profileData.data?.last_name || ''}" and provide cross-modal synthesis:

${JSON.stringify(modalityContext, null, 2)}

Focus on:
1. Temporal alignment - findings that occur at similar times are more likely corroborated
2. Cross-modal agreement - same emotion/intent detected across different modalities
3. Contradictions - e.g., positive words but negative facial expressions
4. Deception indicators - mismatches between verbal and non-verbal cues`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      return new Response(JSON.stringify({ error: "AI synthesis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    // Parse AI response
    let synthesis: SynthesisResult;
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      synthesis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      synthesis = {
        corroborated_findings: [],
        contradictions: [],
        deception_assessment: { risk_level: 'low', confidence: 0.5, indicators: [], behavioral_inconsistencies: [] },
        confidence_boosted_insights: [],
        overall_summary: content,
        modal_weights: { vocal: 0.25, facial: 0.25, body_language: 0.25, behavioral: 0.25 },
      };
    }

    // Calculate overall confidence
    const modalityWeights = synthesis.modal_weights || { vocal: 0.25, facial: 0.25, body_language: 0.25, behavioral: 0.25 };
    let overallConfidence = 0;
    modalityContext.forEach(m => {
      const weight = modalityWeights[m.type] || 0.25;
      overallConfidence += m.confidence * weight;
    });

    // Store synthesis result
    const { error: insertError } = await supabase
      .from('behavioral_analyses')
      .insert({
        profile_id: profileId,
        user_id: user.id,
        analysis_type: 'cross_modal',
        confidence_score: overallConfidence,
        raw_analysis: synthesis,
        behavioral_patterns: synthesis.corroborated_findings,
        personality_indicators: synthesis.confidence_boosted_insights,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'cross-modal-synthesis-v2',
      model_name: 'google/gemini-2.5-flash',
      provider: 'lovable',
      estimated_cost_cents: 2,
      actual_cost_cents: 2,
      total_tokens: aiData.usage?.total_tokens || 0,
      input_tokens: aiData.usage?.prompt_tokens || 0,
      output_tokens: aiData.usage?.completion_tokens || 0,
      status: 'completed',
    });

    return new Response(JSON.stringify({
      success: true,
      synthesis,
      overallConfidence,
      modalitiesAnalyzed: modalityContext.length,
      profile: {
        id: profileId,
        name: `${profileData.data?.first_name || ''} ${profileData.data?.last_name || ''}`.trim(),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Synthesis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
