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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, scanScope } = await req.json();

    // Comprehensive security data gathering
    const [
      { data: accessLogs },
      { data: apiUsage },
      { data: authEvents },
      { data: dataExports },
      { data: sensitiveAccess },
      { data: anomalies },
      { data: externalIntegrations }
    ] = await Promise.all([
      supabase.from('data_access_events')
        .select('*')
        .eq('user_id', userId)
        .order('accessed_at', { ascending: false })
        .limit(500),
      supabase.from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .ilike('action', '%auth%')
        .limit(100),
      supabase.from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .ilike('action', '%export%')
        .limit(50),
      supabase.from('data_access_events')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sensitive', true)
        .limit(100),
      supabase.from('behavioral_anomalies')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(100),
      supabase.from('app_settings')
        .select('*')
        .eq('user_id', userId)
        .ilike('setting_key', '%integration%')
    ]);

    const SECURITY_PROMPT = `You are a cybersecurity threat analyst specializing in personal information security. Analyze the following security data to identify threats, vulnerabilities, and provide recommendations.

Provide comprehensive security analysis in this JSON format:
{
  "overallSecurityScore": 0-100,
  "threatLevel": "critical|high|elevated|guarded|low",
  "activeThreats": [
    {
      "threatId": "string",
      "category": "unauthorized_access|data_exfiltration|brute_force|session_hijack|insider_threat|api_abuse|privacy_violation",
      "severity": 1-10,
      "description": "string",
      "evidence": ["string"],
      "affectedAssets": ["string"],
      "recommendedActions": ["string"],
      "urgency": "immediate|within_24h|within_week|monitor"
    }
  ],
  "vulnerabilities": [
    {
      "id": "string",
      "type": "string",
      "description": "string",
      "exploitability": 1-10,
      "impact": 1-10,
      "remediation": "string"
    }
  ],
  "accessPatternAnalysis": {
    "normalAccessHours": ["string"],
    "unusualAccessDetected": boolean,
    "geoAnomalies": ["string"],
    "deviceAnomalies": ["string"],
    "frequencyAnomalies": ["string"]
  },
  "dataSecurityAssessment": {
    "sensitiveDataAccessCount": number,
    "unusualAccessPatterns": ["string"],
    "potentialDataLeaks": ["string"],
    "encryptionStatus": "full|partial|none",
    "recommendations": ["string"]
  },
  "authenticationSecurity": {
    "failedLoginAttempts": number,
    "suspiciousLoginPatterns": ["string"],
    "sessionSecurityIssues": ["string"],
    "mfaStatus": "enabled|disabled|partial"
  },
  "apiSecurityAssessment": {
    "unusualApiUsage": ["string"],
    "rateLimitConcerns": ["string"],
    "apiKeyExposureRisk": "high|medium|low"
  },
  "privacyRisks": [
    {
      "riskType": "string",
      "description": "string",
      "affectedData": ["string"],
      "mitigationSteps": ["string"]
    }
  ],
  "complianceStatus": {
    "dataRetention": "compliant|needs_attention|non_compliant",
    "accessControls": "compliant|needs_attention|non_compliant",
    "auditTrail": "compliant|needs_attention|non_compliant",
    "issues": ["string"]
  },
  "securityRecommendations": [
    {
      "priority": "critical|high|medium|low",
      "category": "string",
      "recommendation": "string",
      "effort": "minimal|moderate|significant",
      "impact": "string"
    }
  ],
  "securityTrend": {
    "direction": "improving|stable|deteriorating",
    "keyFactors": ["string"]
  }
}`;

    const securityData = {
      accessLogs: accessLogs || [],
      apiUsage: apiUsage || [],
      authEvents: authEvents || [],
      dataExports: dataExports || [],
      sensitiveAccess: sensitiveAccess || [],
      anomalies: anomalies || [],
      externalIntegrations: externalIntegrations || []
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SECURITY_PROMPT },
          { role: 'user', content: JSON.stringify(securityData) }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      analysis = { raw: content, parseError: true };
    }

    // Store security analysis
    await supabase.from('ai_analyses').insert({
      user_id: userId,
      profile_id: userId,
      analysis_type: 'security_threat_analysis',
      result: analysis,
      generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Security threat analyzer error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
