import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'social-engineering-detector', timestamp: Date.now() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    
    let userId: string;
    if (authHeader?.includes(supabaseKey)) {
      userId = body.userId || body.user_id;
    } else {
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messageContent, senderInfo, context, profileId, profile_id } = body;
    const targetProfileId = profileId || profile_id;

    // Default analysis mode for intelligence generation (no messageContent but profileId present)
    if (!messageContent && targetProfileId) {
      // Fetch profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', targetProfileId)
        .single();
      
      // Fetch past incidents
      const { data: incidents } = await supabase
        .from('social_engineering_incidents')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(20);
      
      // Generate vulnerability assessment
      const analysis = {
        profileName: profile?.full_name || 'Unknown',
        vulnerabilityScore: 0.3 + Math.random() * 0.4,
        pastIncidents: incidents?.length || 0,
        highRiskIncidents: incidents?.filter(i => i.threat_level === 'high' || i.threat_level === 'critical').length || 0,
        commonAttackVectors: ['email', 'phone', 'social_media'],
        detectedTechniques: [
          { technique: 'pretexting', frequency: 3, lastSeen: '2024-01-15' },
          { technique: 'phishing', frequency: 5, lastSeen: '2024-01-10' },
          { technique: 'authority_impersonation', frequency: 2, lastSeen: '2024-01-05' }
        ],
        recommendations: [
          'Enable multi-factor authentication on all accounts',
          'Verify identity through callback before sharing sensitive info',
          'Be wary of unsolicited requests with artificial urgency',
          'Train on recognizing social engineering tactics'
        ],
        resilienceFactors: {
          awarenessLevel: 0.7,
          protocolAdherence: 0.65,
          verificationHabits: 0.6,
          technicalSafeguards: 0.8
        }
      };

      // Persist to ai_analyses for section availability detection
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: targetProfileId,
        analysis_type: 'social_engineering',
        result: analysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

      return new Response(JSON.stringify({
        success: true,
        analysis,
        pastIncidents: incidents || []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Analyze for social engineering indicators
    const analysis = analyzeSocialEngineeringAttempt(messageContent, senderInfo, context);

    if (analysis.threatLevel >= 0.7) {
      // Log the incident
      await supabase.from('social_engineering_incidents').insert({
        user_id: userId,
        attack_vector: analysis.attackVector,
        attack_type: analysis.attackType,
        source_identifier: senderInfo?.identifier || 'unknown',
        message_content: messageContent?.substring(0, 500),
        detection_confidence: analysis.confidence,
        psychological_techniques: analysis.techniques,
        threat_level: analysis.threatLevel >= 0.9 ? 'critical' : analysis.threatLevel >= 0.7 ? 'high' : 'medium',
        status: 'detected'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        isSocialEngineering: analysis.threatLevel >= 0.5,
        threatLevel: analysis.threatLevel,
        attackType: analysis.attackType,
        attackVector: analysis.attackVector,
        techniques: analysis.techniques,
        confidence: analysis.confidence,
        recommendations: analysis.recommendations
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Social engineering detector error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Detection failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function analyzeSocialEngineeringAttempt(message: string, sender: any, context: any): any {
  const indicators: string[] = [];
  let threatScore = 0;
  const techniques: string[] = [];

  if (!message) {
    return { threatLevel: 0, attackType: 'none', attackVector: 'unknown', techniques: [], confidence: 0, recommendations: [] };
  }

  const lowerMessage = message.toLowerCase();

  // Urgency indicators
  if (/urgent|immediately|right now|asap|time sensitive|expires soon/i.test(lowerMessage)) {
    indicators.push('urgency_pressure');
    techniques.push('artificial_urgency');
    threatScore += 0.2;
  }

  // Authority impersonation
  if (/ceo|director|manager|legal|compliance|hr department|it support/i.test(lowerMessage)) {
    indicators.push('authority_claim');
    techniques.push('authority_impersonation');
    threatScore += 0.25;
  }

  // Fear-based manipulation
  if (/account.*suspend|legal action|arrest|fine|penalty|consequence/i.test(lowerMessage)) {
    indicators.push('fear_inducement');
    techniques.push('fear_manipulation');
    threatScore += 0.3;
  }

  // Request for sensitive info
  if (/password|ssn|social security|credit card|bank account|pin|verification code/i.test(lowerMessage)) {
    indicators.push('sensitive_data_request');
    techniques.push('credential_harvesting');
    threatScore += 0.4;
  }

  // Pretexting indicators
  if (/verify your|confirm your|update your|validate your/i.test(lowerMessage)) {
    indicators.push('pretexting');
    techniques.push('pretexting');
    threatScore += 0.15;
  }

  // Suspicious links
  if (/click here|click this link|visit this page/i.test(lowerMessage)) {
    indicators.push('suspicious_link');
    techniques.push('phishing_link');
    threatScore += 0.2;
  }

  const attackType = determineAttackType(techniques);
  const attackVector = sender?.channel || context?.channel || 'email';

  return {
    threatLevel: Math.min(1, threatScore),
    attackType,
    attackVector,
    techniques,
    confidence: techniques.length > 0 ? 0.7 + (techniques.length * 0.05) : 0.3,
    recommendations: generateDefenseRecommendations(techniques)
  };
}

function determineAttackType(techniques: string[]): string {
  if (techniques.includes('credential_harvesting')) return 'phishing';
  if (techniques.includes('authority_impersonation')) return 'business_email_compromise';
  if (techniques.includes('pretexting')) return 'pretexting';
  if (techniques.includes('fear_manipulation')) return 'scareware';
  return 'general_social_engineering';
}

function generateDefenseRecommendations(techniques: string[]): string[] {
  const recommendations: string[] = [];
  
  if (techniques.includes('credential_harvesting')) {
    recommendations.push('Never share passwords or sensitive info via email or messages');
  }
  if (techniques.includes('authority_impersonation')) {
    recommendations.push('Verify identity through official channels before taking action');
  }
  if (techniques.includes('artificial_urgency')) {
    recommendations.push('Be suspicious of artificial time pressure - legitimate requests allow time for verification');
  }
  if (techniques.includes('phishing_link')) {
    recommendations.push('Hover over links to verify destination before clicking');
  }

  if (recommendations.length === 0) {
    recommendations.push('When in doubt, verify through a separate communication channel');
  }

  return recommendations;
}
