import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Dark2Clear De-anonymization Engine
 * Based on Int. J. Electronic Security (2023)
 * 
 * Harvests "Clear-Web Mentions" from dark web personas to de-anonymize actors.
 * Cross-references PGP keys, emails, payment accounts to bridge identities.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'dark2clear-deanonymization', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) throw new Error('userId required for service calls');
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`[Dark2Clear] Analyzing identity bridges for profile ${profileId}`);

    // Gather identity markers
    const [profileResult, contactMethodsResult, socialResult, networkResult, shadowResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_methods')
        .select('*')
        .eq('profile_id', profileId),
      supabase.from('social_capture_results')
        .select('*')
        .eq('profile_id', profileId)
        .limit(20),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['network_exploitation', 'digital_footprint'])
        .limit(5),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'shadow_network')
        .limit(3),
    ]);

    const profile = profileResult.data;
    const contactMethods = contactMethodsResult.data || [];
    const socialCaptures = socialResult.data || [];
    const networkAnalyses = networkResult.data || [];
    const shadowAnalyses = shadowResult.data || [];

    // Extract identity markers
    const identityMarkers = extractIdentityMarkers(profile, contactMethods, socialCaptures);
    
    // Analyze pattern consistency across surfaces
    const patternAnalysis = analyzePatternConsistency(identityMarkers, socialCaptures);
    
    // Build identity bridge graph
    const identityBridges = buildIdentityBridges(identityMarkers, networkAnalyses, shadowAnalyses);
    
    // Calculate de-anonymization risk
    const deanonRisk = calculateDeanonRisk(identityMarkers, identityBridges);
    
    // Generate OPSEC recommendations
    const opsecRecommendations = generateOpsecRecommendations(deanonRisk, identityBridges);

    const analysisResult = {
      profileId,
      modelVersion: '1.0.0-dark2clear',
      analyzedAt: new Date().toISOString(),
      identityMarkers,
      patternAnalysis,
      identityBridges,
      deanonRisk,
      opsecRecommendations,
      surfaceCorrelations: findSurfaceCorrelations(identityMarkers),
    };

    // Persist to ai_analyses
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'surface_identity_bridge',
        result: analysisResult,
        confidence_score: deanonRisk.confidence,
        model_used: 'dark2clear-v1.0',
        tokens_used: 0,
        cost_cents: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    console.log(`[Dark2Clear] Identity analysis complete for ${profileId} - risk level: ${deanonRisk.level}`);

    return new Response(JSON.stringify({
      success: true,
      analysisResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Dark2Clear] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractIdentityMarkers(profile: any, contactMethods: any[], socialCaptures: any[]): Record<string, any> {
  const markers = {
    emails: [] as string[],
    phones: [] as string[],
    usernames: [] as string[],
    cryptoAddresses: [] as string[],
    pgpFingerprints: [] as string[],
    ipPatterns: [] as string[],
    languageMarkers: [] as string[],
    timezonePatterns: [] as string[],
    deviceFingerprints: [] as string[],
    writingPatterns: [] as string[],
  };

  // Extract from contact methods
  for (const method of contactMethods) {
    if (method.type === 'email') {
      markers.emails.push(method.value);
    } else if (method.type === 'phone') {
      markers.phones.push(method.value);
    }
  }

  // Extract from profile
  if (profile) {
    // Extract username patterns from known handles
    if (profile.username) markers.usernames.push(profile.username);
    if (profile.social_handles) {
      const handles = profile.social_handles;
      for (const handle of Object.values(handles)) {
        if (typeof handle === 'string') markers.usernames.push(handle);
      }
    }
  }

  // Extract from social captures
  for (const capture of socialCaptures) {
    const data = capture.captured_data || {};
    
    if (data.username) markers.usernames.push(data.username);
    if (data.email) markers.emails.push(data.email);
    
    // Look for crypto addresses in content
    if (data.content || data.bio) {
      const text = (data.content || '') + ' ' + (data.bio || '');
      const btcAddresses = text.match(/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g) || [];
      const ethAddresses = text.match(/\b0x[a-fA-F0-9]{40}\b/g) || [];
      markers.cryptoAddresses.push(...btcAddresses, ...ethAddresses);
    }
  }

  // Deduplicate
  for (const key of Object.keys(markers) as (keyof typeof markers)[]) {
    markers[key] = [...new Set(markers[key])];
  }

  return markers;
}

function analyzePatternConsistency(markers: Record<string, any>, socialCaptures: any[]): Record<string, any> {
  // Analyze username patterns for consistency
  const usernames = markers.usernames;
  const usernamePatterns = analyzeUsernamePatterns(usernames);
  
  // Analyze email patterns
  const emails = markers.emails;
  const emailPatterns = analyzeEmailPatterns(emails);
  
  // Analyze timing patterns from captures
  const timingPatterns = analyzeTimingPatterns(socialCaptures);

  return {
    usernameConsistency: usernamePatterns.consistencyScore,
    usernamePatterns: usernamePatterns.patterns,
    emailConsistency: emailPatterns.consistencyScore,
    emailPatterns: emailPatterns.patterns,
    timingPatterns,
    overallPatternStrength: (usernamePatterns.consistencyScore + emailPatterns.consistencyScore) / 2,
  };
}

function analyzeUsernamePatterns(usernames: string[]): { consistencyScore: number; patterns: string[] } {
  if (usernames.length < 2) {
    return { consistencyScore: 0.5, patterns: [] };
  }

  const patterns: string[] = [];
  let consistencyScore = 0.3;

  // Check for common prefixes
  const prefix3 = usernames[0]?.substring(0, 3).toLowerCase();
  const matchingPrefix = usernames.filter(u => u.toLowerCase().startsWith(prefix3));
  if (matchingPrefix.length > usernames.length * 0.5) {
    patterns.push(`Common prefix: ${prefix3}*`);
    consistencyScore += 0.2;
  }

  // Check for number patterns
  const numbersOnly = usernames.map(u => u.replace(/\D/g, ''));
  const commonNumbers = numbersOnly.filter(n => n.length > 0 && numbersOnly[0] === n);
  if (commonNumbers.length > 1) {
    patterns.push(`Repeated number sequence: ${numbersOnly[0]}`);
    consistencyScore += 0.2;
  }

  // Check for word reuse
  const words = usernames.flatMap(u => u.split(/[^a-zA-Z]+/).filter(w => w.length > 2));
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word.toLowerCase(), (wordCounts.get(word.toLowerCase()) || 0) + 1);
  }
  const repeatedWords = [...wordCounts.entries()].filter(([_, count]) => count > 1);
  if (repeatedWords.length > 0) {
    patterns.push(`Repeated words: ${repeatedWords.map(([w]) => w).join(', ')}`);
    consistencyScore += 0.2;
  }

  return { consistencyScore: Math.min(1, consistencyScore), patterns };
}

function analyzeEmailPatterns(emails: string[]): { consistencyScore: number; patterns: string[] } {
  if (emails.length < 2) {
    return { consistencyScore: 0.5, patterns: [] };
  }

  const patterns: string[] = [];
  let consistencyScore = 0.3;

  // Extract local parts
  const localParts = emails.map(e => e.split('@')[0]);
  
  // Check for same name pattern
  const firstLocal = localParts[0]?.toLowerCase();
  const similar = localParts.filter(l => 
    l.toLowerCase().includes(firstLocal.substring(0, 4)) ||
    firstLocal.includes(l.toLowerCase().substring(0, 4))
  );
  
  if (similar.length > 1) {
    patterns.push('Similar email local parts detected');
    consistencyScore += 0.3;
  }

  // Check domain patterns
  const domains = emails.map(e => e.split('@')[1]);
  const uniqueDomains = new Set(domains);
  if (uniqueDomains.size === 1) {
    patterns.push(`Single domain used: ${[...uniqueDomains][0]}`);
    consistencyScore += 0.2;
  }

  return { consistencyScore: Math.min(1, consistencyScore), patterns };
}

function analyzeTimingPatterns(captures: any[]): Record<string, any> {
  if (captures.length < 3) {
    return { hasPattern: false, timezone: null, activeHours: [] };
  }

  // Extract timestamps
  const timestamps = captures
    .map(c => new Date(c.captured_at || c.created_at))
    .filter(d => !isNaN(d.getTime()));

  if (timestamps.length < 3) {
    return { hasPattern: false, timezone: null, activeHours: [] };
  }

  // Analyze hour distribution
  const hours = timestamps.map(t => t.getUTCHours());
  const hourCounts = new Map<number, number>();
  for (const h of hours) {
    hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
  }

  // Find peak hours
  const sortedHours = [...hourCounts.entries()].sort((a, b) => b[1] - a[1]);
  const activeHours = sortedHours.slice(0, 3).map(([h]) => h);

  // Estimate timezone from active hours (assuming 9am-11pm activity)
  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
  const estimatedOffset = Math.round((15 - avgHour) % 24 - 12);

  return {
    hasPattern: true,
    estimatedTimezone: `UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}`,
    activeHours,
    confidence: sortedHours.length > 0 ? sortedHours[0][1] / hours.length : 0,
  };
}

function buildIdentityBridges(markers: Record<string, any>, networkAnalyses: any[], shadowAnalyses: any[]): any[] {
  const bridges: any[] = [];

  // Email-to-username bridges
  for (const email of markers.emails) {
    const local = email.split('@')[0];
    for (const username of markers.usernames) {
      if (username.toLowerCase().includes(local.toLowerCase()) ||
          local.toLowerCase().includes(username.toLowerCase())) {
        bridges.push({
          type: 'email_username',
          sourceMarker: email,
          targetMarker: username,
          strength: 0.7,
          bridgeType: 'naming_pattern',
        });
      }
    }
  }

  // Crypto address bridges (if multiple addresses found)
  if (markers.cryptoAddresses.length > 1) {
    bridges.push({
      type: 'crypto_linkage',
      sourceMarker: markers.cryptoAddresses[0],
      targetMarker: markers.cryptoAddresses.slice(1),
      strength: 0.9,
      bridgeType: 'blockchain_correlation',
    });
  }

  // Add bridges from shadow network analysis
  for (const analysis of shadowAnalyses) {
    const result = analysis.result || {};
    if (result.hiddenConnections) {
      for (const conn of result.hiddenConnections) {
        bridges.push({
          type: 'shadow_network',
          sourceMarker: conn.source,
          targetMarker: conn.target,
          strength: conn.confidence || 0.5,
          bridgeType: 'network_analysis',
        });
      }
    }
  }

  return bridges;
}

function calculateDeanonRisk(markers: Record<string, any>, bridges: any[]): Record<string, any> {
  let riskScore = 0.2; // Base risk

  // More unique identifiers = higher risk
  const totalMarkers = Object.values(markers).flat().length;
  riskScore += Math.min(0.3, totalMarkers * 0.02);

  // More bridges = higher risk
  riskScore += Math.min(0.3, bridges.length * 0.05);

  // High-strength bridges increase risk
  const highStrengthBridges = bridges.filter(b => b.strength > 0.7);
  riskScore += Math.min(0.2, highStrengthBridges.length * 0.1);

  const level = riskScore > 0.7 ? 'critical' : riskScore > 0.5 ? 'high' : riskScore > 0.3 ? 'moderate' : 'low';

  return {
    score: Math.min(1, riskScore),
    level,
    confidence: Math.min(0.9, 0.5 + (bridges.length * 0.05)),
    factors: [
      `${totalMarkers} unique identity markers found`,
      `${bridges.length} identity bridges detected`,
      `${highStrengthBridges.length} high-confidence correlations`,
    ],
  };
}

function findSurfaceCorrelations(markers: Record<string, any>): any[] {
  const correlations: any[] = [];

  // Look for correlations between different marker types
  if (markers.emails.length > 0 && markers.usernames.length > 0) {
    correlations.push({
      type: 'cross_platform_naming',
      description: 'Similar naming patterns across email and usernames',
      surfaces: ['email', 'social'],
      exploitability: 0.7,
    });
  }

  if (markers.cryptoAddresses.length > 0) {
    correlations.push({
      type: 'blockchain_exposure',
      description: 'Cryptocurrency addresses can be traced through blockchain analysis',
      surfaces: ['cryptocurrency', 'financial'],
      exploitability: 0.8,
    });
  }

  if (markers.phones.length > 0) {
    correlations.push({
      type: 'phone_linkage',
      description: 'Phone numbers provide strong identity anchor across services',
      surfaces: ['phone', 'messaging', '2fa'],
      exploitability: 0.9,
    });
  }

  return correlations;
}

function generateOpsecRecommendations(risk: Record<string, any>, bridges: any[]): string[] {
  const recommendations: string[] = [];

  if (risk.level === 'critical' || risk.level === 'high') {
    recommendations.push('URGENT: Identity correlation risk is severe - recommend immediate compartmentalization');
    recommendations.push('Use separate identities with no naming pattern overlap');
    recommendations.push('Avoid reusing usernames or email patterns across platforms');
  }

  if (bridges.some(b => b.type === 'crypto_linkage')) {
    recommendations.push('Use mixing services or new wallets for privacy-sensitive transactions');
  }

  if (bridges.some(b => b.type === 'email_username')) {
    recommendations.push('Create unique, unrelated usernames for each platform');
    recommendations.push('Use email aliasing services to break correlation patterns');
  }

  recommendations.push('Consider using different VPNs/exit nodes for different identities');
  recommendations.push('Vary posting times to obscure timezone patterns');
  recommendations.push('Develop distinct writing styles for compartmentalized identities');

  return recommendations;
}
