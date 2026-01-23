import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitorRequest {
  profileId?: string;
  searchTerms?: string[];
  action: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, searchTerms, action } = await req.json() as MonitorRequest;

    if (action === 'scan') {
      // Fetch profile data for context
      let profileData: any = null;
      if (profileId) {
        const { data } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        profileData = data;
      }

      // Generate search terms from profile if not provided
      const terms = searchTerms || generateSearchTerms(profileData);

      // Simulate dark web intelligence gathering
      // In production, this would integrate with APIs like SpyCloud, DarkOwl, etc.
      const scanResults = await simulateDarkWebScan(terms, profileId);

      // Store dark web mentions
      const mentions = scanResults.mentions.map((m: any) => ({
        user_id: user.id,
        profile_id: profileId,
        mention_source: m.source,
        source_type: m.sourceType,
        content_snippet: m.snippet,
        full_content: m.fullContent,
        threat_score: m.threatScore,
        relevance_score: m.relevanceScore,
        entities_mentioned: m.entities,
        context_analysis: m.analysis,
        source_credibility: m.credibility,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      }));

      if (mentions.length > 0) {
        const { error: mentionError } = await supabaseClient
          .from('dark_web_mentions')
          .insert(mentions);

        if (mentionError) console.error('Error inserting mentions:', mentionError);
      }

      // Store credential exposures
      const exposures = scanResults.exposures.map((e: any) => ({
        user_id: user.id,
        profile_id: profileId,
        exposure_type: e.type,
        affected_service: e.service,
        exposure_severity: e.severity,
        credential_types: e.credentialTypes,
        breach_source: e.source,
        breach_date: e.date,
        data_exposed: e.dataExposed,
        remediation_status: 'unresolved',
        remediation_actions: [],
        discovered_at: new Date().toISOString(),
      }));

      if (exposures.length > 0) {
        const { error: exposureError } = await supabaseClient
          .from('credential_exposures')
          .insert(exposures);

        if (exposureError) console.error('Error inserting exposures:', exposureError);
      }

      // Store threat intelligence
      const threats = scanResults.threats.map((t: any) => ({
        user_id: user.id,
        profile_id: profileId,
        threat_type: t.type,
        threat_name: t.name,
        threat_level: t.level,
        threat_vector: t.vector,
        indicators_of_compromise: t.iocs,
        attack_patterns: t.patterns,
        mitigation_strategies: t.mitigations,
        intel_sources: t.sources,
        confidence_score: t.confidence,
        is_active: true,
        first_detected_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      }));

      if (threats.length > 0) {
        const { error: threatError } = await supabaseClient
          .from('threat_intelligence')
          .insert(threats);

        if (threatError) console.error('Error inserting threats:', threatError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        mentionsFound: mentions.length,
        exposuresFound: exposures.length,
        threatsIdentified: threats.length,
        searchTermsUsed: terms.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Dark web monitor error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSearchTerms(profileData: any): string[] {
  const terms: string[] = [];
  
  if (profileData) {
    // Use correct column names: first_name, last_name, organization (not full_name, email, phone, company)
    const fullName = profileData.first_name && profileData.last_name 
      ? `${profileData.first_name} ${profileData.last_name}`.trim()
      : profileData.first_name || profileData.last_name || null;
    if (fullName) terms.push(fullName);
    // NOTE: email/phone are in contact_methods table, not profiles
    if (profileData.organization) terms.push(profileData.organization);
    
    // Generate variations from constructed full name
    if (fullName) {
      const parts = fullName.split(' ');
      if (parts.length >= 2) {
        terms.push(`${parts[0]} ${parts[parts.length - 1]}`);
        terms.push(`${parts[0].toLowerCase()}${parts[parts.length - 1].toLowerCase()}`);
      }
    }
  }

  return terms.filter(Boolean);
}

async function simulateDarkWebScan(terms: string[], profileId?: string): Promise<{
  mentions: any[];
  exposures: any[];
  threats: any[];
}> {
  // Simulated dark web intelligence results
  // In production, integrate with actual dark web monitoring APIs
  
  const mentions = [];
  const exposures = [];
  const threats = [];

  // Simulate findings based on probability
  for (const term of terms) {
    // 10% chance of finding a mention
    if (Math.random() < 0.1) {
      const sourceTypes = ['forum', 'marketplace', 'paste', 'leak_database', 'telegram'];
      const sources = ['breached.to', 'raidforums', 'cracked.io', 'darkforum', 'paste.onion'];
      
      mentions.push({
        source: sources[Math.floor(Math.random() * sources.length)],
        sourceType: sourceTypes[Math.floor(Math.random() * sourceTypes.length)],
        snippet: `... discussion mentioning ${term} regarding potential ...`,
        fullContent: `Extended content related to ${term} found in underground forum discussion.`,
        threatScore: Math.random() * 0.6 + 0.2,
        relevanceScore: Math.random() * 0.4 + 0.6,
        entities: [{ entity: term, type: 'search_term', context: 'direct_match' }],
        analysis: { sentiment: 'negative', intent: 'information_gathering', risk: 'moderate' },
        credibility: Math.random() * 0.4 + 0.5,
      });
    }

    // 5% chance of credential exposure
    if (Math.random() < 0.05 && term.includes('@')) {
      const services = ['social_network', 'email_provider', 'e_commerce', 'financial', 'gaming'];
      const severities = ['low', 'medium', 'high', 'critical'];
      
      exposures.push({
        type: 'credential_leak',
        service: services[Math.floor(Math.random() * services.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        credentialTypes: ['email', Math.random() > 0.5 ? 'password_hash' : 'plaintext_password'],
        source: 'compilation_breach',
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        dataExposed: { email: true, password: true, personal_info: Math.random() > 0.5 },
      });
    }
  }

  // 3% chance of threat intelligence
  if (Math.random() < 0.03 && profileId) {
    const threatTypes = ['targeted_attack', 'phishing_campaign', 'social_engineering', 'data_sale'];
    const levels = ['low', 'medium', 'high'];
    
    threats.push({
      type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      name: 'Potential targeted campaign',
      level: levels[Math.floor(Math.random() * levels.length)],
      vector: { method: 'unknown', target: 'credentials', delivery: 'unknown' },
      iocs: [
        { type: 'domain', value: 'suspicious-domain.com', confidence: 0.6 },
      ],
      patterns: [{ pattern: 'reconnaissance', likelihood: 0.7 }],
      mitigations: [
        { strategy: 'Enable MFA', effectiveness: 0.9, implemented: false },
        { strategy: 'Password change', effectiveness: 0.8, implemented: false },
      ],
      sources: ['dark_web_monitor', 'threat_intel_feed'],
      confidence: Math.random() * 0.3 + 0.5,
    });
  }

  return { mentions, exposures, threats };
}
