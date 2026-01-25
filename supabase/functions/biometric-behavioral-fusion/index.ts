/**
 * Biometric-Behavioral Fusion Engine (v1.0.0)
 * Correlates wearable HRV/stress data with voice stress and facial micro-expressions
 * for triple-point deception verification.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BiometricFusionRequest {
  profileId: string;
  userId?: string;
}

const BIOMETRIC_FUSION_PROMPT = `You are an elite biometric intelligence analyst specializing in multi-modal deception detection and behavioral authenticity verification.

Your task is to correlate physiological signals (HRV, stress levels, heart rate) with voice stress patterns and facial micro-expression analysis to create a triple-point verification system.

CORRELATION ANALYSIS FRAMEWORK:

1. PHYSIOLOGICAL BASELINE ANALYSIS
   - Heart Rate Variability (HRV) patterns during interactions
   - Stress level trends and spikes
   - Heart rate changes correlated with conversation topics
   - Autonomic nervous system indicators

2. VOICE STRESS CORRELATION
   - Voice stress markers aligned with physiological stress
   - Pitch/tempo changes during high-stress moments
   - Micro-tremor detection in voice
   - Speech pattern anomalies during deception attempts

3. FACIAL MICRO-EXPRESSION CORRELATION
   - Micro-expression timing vs physiological stress
   - Facial Action Coding System (FACS) alignment
   - Eye movement patterns during stress
   - Asymmetrical expressions indicating masking

4. TRIPLE-POINT VERIFICATION
   - All three signals aligned = HIGH CONFIDENCE assessment
   - Two signals aligned = MODERATE CONFIDENCE
   - Signals contradictory = REQUIRES INVESTIGATION

Return JSON:
{
  "triplePointVerification": {
    "physiologicalStress": 0.0-1.0,
    "vocalStress": 0.0-1.0,
    "facialStress": 0.0-1.0,
    "combinedDeceptionScore": 0.0-1.0,
    "convergenceLevel": "aligned|partial|contradictory",
    "confidenceLevel": 0.0-1.0
  },
  "biometricBaseline": {
    "restingHRV": number,
    "baselineStress": 0.0-1.0,
    "emotionalRange": "narrow|moderate|wide",
    "stressRecoverySpeed": "slow|moderate|fast"
  },
  "stressCorrelationTimeline": [
    {
      "timestamp": "ISO date or relative",
      "physiologicalStress": 0.0-1.0,
      "vocalIndicators": string[],
      "facialIndicators": string[],
      "contextTrigger": "what caused it",
      "convergenceScore": 0.0-1.0
    }
  ],
  "deceptionAlerts": [
    {
      "alertType": "high_divergence|stress_masking|baseline_deviation",
      "severity": "low|medium|high|critical",
      "description": "what was detected",
      "evidencePoints": string[],
      "timestamp": "when",
      "recommendedAction": "what to do"
    }
  ],
  "authenticityMarkers": [
    {
      "context": "situation",
      "authenticityScore": 0.0-1.0,
      "supportingEvidence": string[]
    }
  ],
  "manipulationVulnerability": {
    "overallVulnerability": 0.0-1.0,
    "physiologicalTriggers": string[],
    "emotionalTriggers": string[],
    "optimalApproachTiming": string
  },
  "recommendations": {
    "verificationNeeded": string[],
    "highConfidenceAssessments": string[],
    "dataGaps": string[]
  },
  "confidenceScore": 0.0-1.0,
  "dataQuality": "low|medium|high"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return new Response(
      JSON.stringify({ ok: true, function: "biometric-behavioral-fusion", timestamp: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle auth
    const authHeader = req.headers.get("Authorization");
    const body = await req.json();
    const token = authHeader?.replace("Bearer ", "");
    const isServiceRoleCall = token === supabaseKey;

    // Normalize parameters
    const profileId = body.profileId || body.profile_id;
    let userId = body.userId || body.user_id;

    if (!isServiceRoleCall && authHeader && token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId && !isServiceRoleCall) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather biometric and behavioral data
    const [
      biometricsResult,
      vocalAnalysesResult,
      facialAnalysesResult,
      behavioralAnalysesResult,
      voiceInsightsResult,
      mediaAnalysesResult,
    ] = await Promise.all([
      supabase.from("interaction_biometrics").select("*").eq("profile_id", profileId)
        .order("recorded_at", { ascending: false }).limit(100),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId)
        .eq("analysis_type", "vocal").order("generated_at", { ascending: false }).limit(10),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId)
        .eq("analysis_type", "facial").order("generated_at", { ascending: false }).limit(10),
      supabase.from("behavioral_analyses").select("*").eq("profile_id", profileId)
        .order("created_at", { ascending: false }).limit(20),
      supabase.from("voice_insights").select("*").eq("profile_id", profileId)
        .order("created_at", { ascending: false }).limit(30),
      supabase.from("media_analyses").select("*").eq("profile_id", profileId)
        .order("created_at", { ascending: false }).limit(30),
    ]);

    const contextData = {
      biometrics: {
        samples: biometricsResult.data || [],
        sampleCount: (biometricsResult.data || []).length,
        hasHRV: (biometricsResult.data || []).some((b: Record<string, unknown>) => b.hrv_value !== null),
        hasStress: (biometricsResult.data || []).some((b: Record<string, unknown>) => b.stress_level !== null),
      },
      vocalAnalyses: {
        analyses: vocalAnalysesResult.data || [],
        count: (vocalAnalysesResult.data || []).length,
      },
      facialAnalyses: {
        analyses: facialAnalysesResult.data || [],
        count: (facialAnalysesResult.data || []).length,
      },
      behavioralPatterns: behavioralAnalysesResult.data || [],
      voiceInsights: voiceInsightsResult.data || [],
      mediaAnalyses: (mediaAnalysesResult.data || []).filter((m: Record<string, unknown>) => 
        m.analysis_type === 'facial' || m.analysis_type === 'microexpression'
      ),
    };

    console.log(`[biometric-behavioral-fusion] Processing for profile ${profileId}:`, {
      biometricSamples: contextData.biometrics.sampleCount,
      vocalCount: contextData.vocalAnalyses.count,
      facialCount: contextData.facialAnalyses.count,
    });

    const aiResponse = await callAI({
      model: selectModel("quality"),
      messages: [
        { role: "system", content: BIOMETRIC_FUSION_PROMPT },
        { 
          role: "user", 
          content: `Perform triple-point biometric-behavioral fusion analysis on this data:\n\n${JSON.stringify(contextData, null, 2)}`
        }
      ],
      userId: userId,
      functionName: "biometric-behavioral-fusion",
      profileId: profileId,
      temperature: 0.4,
    });

    const analysis = parseAIJson(aiResponse.content, {
      triplePointVerification: {
        physiologicalStress: 0,
        vocalStress: 0,
        facialStress: 0,
        combinedDeceptionScore: 0,
        convergenceLevel: "contradictory",
        confidenceLevel: 0,
      },
      biometricBaseline: {},
      stressCorrelationTimeline: [],
      deceptionAlerts: [],
      authenticityMarkers: [],
      manipulationVulnerability: {},
      recommendations: {},
      confidenceScore: 0,
      dataQuality: "low",
    });

    // Store in ai_analyses for section availability
    await supabase.from("ai_analyses").upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: "biometric_behavioral_fusion",
      result: analysis,
      generated_at: new Date().toISOString(),
    }, { onConflict: "profile_id,analysis_type" });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        profileId,
        costCents: aiResponse.costCents,
        metadata: {
          biometricSamples: contextData.biometrics.sampleCount,
          vocalAnalyses: contextData.vocalAnalyses.count,
          facialAnalyses: contextData.facialAnalyses.count,
          convergenceLevel: analysis.triplePointVerification?.convergenceLevel,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Biometric-behavioral fusion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
