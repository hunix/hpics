import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ThreatRequest {
  profileId: string;
  assessmentTypes?: string[];
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      profileId, 
      assessmentTypes = ['identity_verification', 'behavioral_anomaly', 'deception_risk'] 
    } = await req.json() as ThreatRequest;

    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather all available data for threat assessment
    const [
      { data: profile },
      { data: biometrics },
      { data: baselines },
      { data: anomalies },
      { data: deceptionAnalyses },
      { data: communications },
      { data: crossRefs }
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("contact_biometrics").select("*").eq("profile_id", profileId).maybeSingle(),
      supabase.from("behavioral_baselines").select("*").eq("profile_id", profileId).limit(5),
      supabase.from("behavioral_anomalies").select("*").eq("profile_id", profileId).eq("is_resolved", false).limit(10),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId).eq("analysis_type", "deception").limit(5),
      supabase.from("communications").select("*").eq("profile_id", profileId).order("occurred_at", { ascending: false }).limit(50),
      supabase.from("cross_references").select("*").eq("profile_id", profileId),
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate identity confidence
    const identityIndicators: any[] = [];
    let identityScore = 0.5; // Base score

    // Biometric verification
    if (biometrics) {
      if (biometrics.facial_confidence && biometrics.facial_confidence > 0.8) {
        identityScore += 0.15;
        identityIndicators.push({ type: 'biometric_facial', status: 'verified', score: biometrics.facial_confidence });
      }
      if (biometrics.voice_confidence && biometrics.voice_confidence > 0.8) {
        identityScore += 0.1;
        identityIndicators.push({ type: 'biometric_voice', status: 'verified', score: biometrics.voice_confidence });
      }
    }

    // Cross-reference verification
    if (crossRefs && crossRefs.length > 0) {
      const verifiedRefs = crossRefs.filter((r: any) => r.confidence > 0.8);
      if (verifiedRefs.length >= 2) {
        identityScore += 0.1;
        identityIndicators.push({ type: 'cross_reference', status: 'multiple_verified', count: verifiedRefs.length });
      }
    }

    // Communication consistency
    if (communications && communications.length >= 10) {
      identityScore += 0.1;
      identityIndicators.push({ type: 'communication_history', status: 'established', count: communications.length });
    }

    identityScore = Math.min(1, identityScore);

    // Detect contradictions and threats
    const threatIndicators: any[] = [];
    const contradictions: any[] = [];

    // Check for unresolved anomalies
    if (anomalies && anomalies.length > 0) {
      const criticalAnomalies = anomalies.filter((a: any) => a.severity === 'critical' || a.severity === 'high');
      if (criticalAnomalies.length > 0) {
        threatIndicators.push({
          type: 'behavioral_anomaly',
          severity: 'high',
          description: `${criticalAnomalies.length} critical behavioral anomalies detected`,
          details: criticalAnomalies.map((a: any) => a.anomaly_type),
        });
      }
    }

    // Check deception analyses
    if (deceptionAnalyses && deceptionAnalyses.length > 0) {
      for (const analysis of deceptionAnalyses) {
        const result = analysis.result as any;
        if (result?.deception_score && result.deception_score > 0.6) {
          threatIndicators.push({
            type: 'deception_detected',
            severity: result.deception_score > 0.8 ? 'critical' : 'medium',
            description: 'Elevated deception indicators in communication',
            score: result.deception_score,
          });
        }
      }
    }

    // Use AI to synthesize threat assessment
    const threatPrompt = `You are a counter-intelligence analyst. Assess the threat level for this contact based on the following data:

Profile: ${profile.first_name} ${profile.last_name || ''}
Relationship Type: ${profile.relationship_type || 'Unknown'}

Identity Confidence: ${(identityScore * 100).toFixed(0)}%
Identity Indicators: ${JSON.stringify(identityIndicators)}

Detected Threat Indicators: ${JSON.stringify(threatIndicators)}
Unresolved Anomalies: ${anomalies?.length || 0}
Contradictions Found: ${contradictions.length}

Based on this data, provide:
1. overall_threat_level: 'low', 'medium', 'high', or 'critical'
2. threat_score: 0-1 numeric score
3. key_concerns: Array of specific concerns (max 5)
4. recommendations: Array of recommended actions (max 3)
5. assessment_summary: 1-2 sentence summary

Return as JSON.`;

    const aiResponse = await callAI({
      userId: user.id,
      functionName: "assess-threat",
      profileId,
      messages: [
        { role: "system", content: "You are a counter-intelligence analyst. Return valid JSON only." },
        { role: "user", content: threatPrompt }
      ],
      model: "google/gemini-2.5-flash",
      temperature: 0.3,
      maxTokens: 1500,
    });

    let assessment: any = {
      threat_level: 'low',
      threat_score: 0.2,
      key_concerns: [],
      recommendations: [],
      assessment_summary: 'No significant threats detected.',
    };

    try {
      const parsed = JSON.parse(aiResponse.content);
      assessment = {
        threat_level: parsed.overall_threat_level || parsed.threat_level || 'low',
        threat_score: parsed.threat_score || 0.2,
        key_concerns: parsed.key_concerns || [],
        recommendations: parsed.recommendations || [],
        assessment_summary: parsed.assessment_summary || '',
      };
    } catch (e) {
      console.error("Failed to parse AI threat response:", e);
    }

    // Store threat assessment
    const { data: storedAssessment, error: insertError } = await supabase
      .from("threat_assessments")
      .insert({
        user_id: user.id,
        profile_id: profileId,
        assessment_type: 'comprehensive',
        threat_level: assessment.threat_level,
        threat_score: assessment.threat_score,
        identity_confidence: identityScore,
        indicators: threatIndicators,
        contradictions: contradictions,
        recommendations: assessment.recommendations,
        evidence: {
          identity_indicators: identityIndicators,
          key_concerns: assessment.key_concerns,
          summary: assessment.assessment_summary,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store threat assessment:", insertError);
    }

    // Create security alert if threat level is high or critical
    if (assessment.threat_level === 'high' || assessment.threat_level === 'critical') {
      await supabase.from("security_alerts").insert({
        user_id: user.id,
        alert_type: 'threat_assessment',
        category: 'counter_intelligence',
        severity: assessment.threat_level,
        description: `${assessment.threat_level.toUpperCase()} threat level detected for ${profile.first_name} ${profile.last_name || ''}: ${assessment.assessment_summary}`,
        metadata: {
          profile_id: profileId,
          threat_score: assessment.threat_score,
          key_concerns: assessment.key_concerns,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      profile_name: `${profile.first_name} ${profile.last_name || ''}`,
      identity_confidence: identityScore,
      identity_indicators: identityIndicators,
      threat_assessment: {
        level: assessment.threat_level,
        score: assessment.threat_score,
        concerns: assessment.key_concerns,
        recommendations: assessment.recommendations,
        summary: assessment.assessment_summary,
      },
      stored_assessment_id: storedAssessment?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("assess-threat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
