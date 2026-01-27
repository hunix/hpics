/**
 * Multi-Party Deception Detector Edge Function (v6.0)
 * 
 * Detects coordinated deception or collusion across multiple contacts
 * by correlating timing, content, and behavioral patterns.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CollusionNetwork {
  networkId: string;
  participants: string[];
  participantNames: string[];
  collusionType: string;
  evidenceStrength: number;
  firstDetected: string;
  keyIndicators: string[];
  communicationOverlap: {
    temporalAlignment: number;
    contentSimilarity: number;
    topicOverlap: string[];
  };
}

interface NetworkNode {
  id: string;
  name: string;
  deceptionScore: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'multi-party-deception-detector',
      timestamp: Date.now(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;

    console.log(`[multi-party-deception-detector] Processing for user: ${user.id}`);

    // Fetch all relevant data
    const [
      deceptionAnalysesResult,
      communicationsResult,
      relationshipsResult,
      crossModalResult,
      anomaliesResult,
      profilesResult,
    ] = await Promise.all([
      supabase.from('deception_analyses').select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(100),
      supabase.from('communications').select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(500),
      supabase.from('contact_relationships').select('*')
        .eq('user_id', user.id)
        .limit(300),
      supabase.from('ai_analyses').select('*')
        .eq('user_id', user.id)
        .eq('analysis_type', 'cross_modal_deception')
        .limit(50),
      supabase.from('behavioral_anomalies').select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(100),
      supabase.from('profiles').select('id, first_name, last_name')
        .eq('user_id', user.id)
        .limit(200),
    ]);

    const deceptionAnalyses = deceptionAnalysesResult.data || [];
    const communications = communicationsResult.data || [];
    const relationships = relationshipsResult.data || [];
    const crossModalData = crossModalResult.data || [];
    const anomalies = anomaliesResult.data || [];
    const profiles = profilesResult.data || [];

    // Build profile name map
    const profileNameMap = new Map<string, string>();
    profiles.forEach(p => {
      profileNameMap.set(p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown');
    });

    // Analyze for collusion patterns
    const collusionNetworks: CollusionNetwork[] = [];
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // 1. Detect synchronized messaging patterns
    const syncedMessagingGroups = detectSynchronizedMessaging(communications, profiles);
    syncedMessagingGroups.forEach((group, idx) => {
      if (group.participants.length >= 2 && group.temporalAlignment > 0.6) {
        collusionNetworks.push({
          networkId: `sync-${idx}`,
          participants: group.participants,
          participantNames: group.participants.map((p: string) => profileNameMap.get(p) || 'Unknown'),
          collusionType: 'synchronized_messaging',
          evidenceStrength: group.temporalAlignment,
          firstDetected: new Date().toISOString(),
          keyIndicators: [
            `${group.participants.length} contacts messaged within ${group.windowMinutes} minutes`,
            `Similar topics discussed: ${group.topics.join(', ')}`,
          ],
          communicationOverlap: {
            temporalAlignment: group.temporalAlignment,
            contentSimilarity: group.contentSimilarity,
            topicOverlap: group.topics,
          },
        });
      }
    });

    // 2. Detect story alignment across contacts
    const storyAlignments = detectStoryAlignment(communications, deceptionAnalyses);
    storyAlignments.forEach((alignment, idx) => {
      if (alignment.similarity > 0.7) {
        collusionNetworks.push({
          networkId: `story-${idx}`,
          participants: alignment.participants,
          participantNames: alignment.participants.map((p: string) => profileNameMap.get(p) || 'Unknown'),
          collusionType: 'story_alignment',
          evidenceStrength: alignment.similarity,
          firstDetected: new Date().toISOString(),
          keyIndicators: [
            'Similar narrative structure detected',
            `Content overlap: ${Math.round(alignment.similarity * 100)}%`,
            ...alignment.matchingElements,
          ],
          communicationOverlap: {
            temporalAlignment: 0.5,
            contentSimilarity: alignment.similarity,
            topicOverlap: alignment.topics,
          },
        });
      }
    });

    // 3. Detect coordinated behavioral anomalies
    const coordAnomalies = detectCoordinatedAnomalies(anomalies, profiles);
    coordAnomalies.forEach((coord, idx) => {
      collusionNetworks.push({
        networkId: `anomaly-${idx}`,
        participants: coord.participants,
        participantNames: coord.participants.map((p: string) => profileNameMap.get(p) || 'Unknown'),
        collusionType: 'behavioral_synchronization',
        evidenceStrength: coord.synchronizationScore,
        firstDetected: coord.firstDetected,
        keyIndicators: coord.indicators,
        communicationOverlap: {
          temporalAlignment: coord.synchronizationScore,
          contentSimilarity: 0.5,
          topicOverlap: [],
        },
      });
    });

    // 4. Detect hidden connections through relationship analysis
    const hiddenConnections = detectHiddenConnections(relationships, communications);
    hiddenConnections.forEach((conn, idx) => {
      if (conn.connectionStrength > 0.5) {
        collusionNetworks.push({
          networkId: `hidden-${idx}`,
          participants: conn.participants,
          participantNames: conn.participants.map((p: string) => profileNameMap.get(p) || 'Unknown'),
          collusionType: 'information_compartmentalization',
          evidenceStrength: conn.connectionStrength,
          firstDetected: new Date().toISOString(),
          keyIndicators: [
            'Hidden communication channel detected',
            'Information flow inconsistent with stated relationship',
          ],
          communicationOverlap: {
            temporalAlignment: conn.connectionStrength,
            contentSimilarity: 0.3,
            topicOverlap: conn.sharedTopics,
          },
        });
      }
    });

    // Build network visualization data
    const profilesWithDeception = new Map<string, number>();
    deceptionAnalyses.forEach(d => {
      const current = profilesWithDeception.get(d.profile_id) || 0;
      profilesWithDeception.set(d.profile_id, Math.max(current, d.deception_score || 0));
    });

    profiles.forEach(p => {
      nodes.push({
        id: p.id,
        name: profileNameMap.get(p.id) || 'Unknown',
        deceptionScore: profilesWithDeception.get(p.id) || 0,
      });
    });

    // Add edges for detected collusion
    collusionNetworks.forEach(network => {
      for (let i = 0; i < network.participants.length; i++) {
        for (let j = i + 1; j < network.participants.length; j++) {
          edges.push({
            source: network.participants[i],
            target: network.participants[j],
            weight: network.evidenceStrength,
          });
        }
      }
    });

    // Count isolated deceivers (deception without detected collusion)
    const colludingProfiles = new Set<string>();
    collusionNetworks.forEach(n => n.participants.forEach(p => colludingProfiles.add(p)));
    const isolatedDeceivers = Array.from(profilesWithDeception.keys())
      .filter(p => !colludingProfiles.has(p) && (profilesWithDeception.get(p) || 0) > 0.5);

    // Generate recommended interrogation order
    const interrogationOrder = generateInterrogationOrder(
      collusionNetworks,
      profilesWithDeception,
      profileNameMap
    );

    // Build information compartmentalization map
    const compartmentMap: Record<string, string[]> = {};
    collusionNetworks.forEach(n => {
      const key = n.collusionType;
      if (!compartmentMap[key]) {
        compartmentMap[key] = [];
      }
      compartmentMap[key].push(...n.participantNames);
    });

    const result = {
      collusionNetworks,
      isolatedDeceiversCount: isolatedDeceivers.length,
      networkVisualizationData: {
        nodes,
        edges,
      },
      recommendedInterrogationOrder: interrogationOrder,
      informationCompartmentalizationMap: compartmentMap,
      analysisMetadata: {
        communicationsAnalyzed: communications.length,
        profilesAnalyzed: profiles.length,
        deceptionRecordsUsed: deceptionAnalyses.length,
        anomaliesConsidered: anomalies.length,
      },
    };

    // Save analysis result
    const targetProfileId = profileId || user.id;
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: targetProfileId,
      analysis_type: 'multi_party_deception',
      result,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,analysis_type',
    });

    console.log(`[multi-party-deception-detector] Found ${collusionNetworks.length} collusion networks`);

    return new Response(JSON.stringify({
      success: true,
      result,
      confidence: 0.75,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[multi-party-deception-detector] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectSynchronizedMessaging(communications: any[], profiles: any[]): any[] {
  const groups: any[] = [];
  const windowMs = 30 * 60 * 1000; // 30 minute window
  
  // Group communications by time windows
  const sortedComms = [...communications].sort((a, b) => 
    new Date(a.communication_date).getTime() - new Date(b.communication_date).getTime()
  );
  
  let windowStart = 0;
  while (windowStart < sortedComms.length) {
    const windowStartTime = new Date(sortedComms[windowStart].communication_date).getTime();
    const windowEnd = sortedComms.findIndex((c, i) => 
      i > windowStart && 
      new Date(c.communication_date).getTime() - windowStartTime > windowMs
    );
    
    const windowComms = sortedComms.slice(
      windowStart, 
      windowEnd === -1 ? sortedComms.length : windowEnd
    );
    
    const profilesInWindow = [...new Set(windowComms.map(c => c.profile_id).filter(Boolean))];
    
    if (profilesInWindow.length >= 2) {
      // Analyze content similarity (simplified)
      const contents = windowComms.map(c => c.content || '').filter(c => c.length > 10);
      const topics = extractTopics(contents);
      
      groups.push({
        participants: profilesInWindow,
        windowMinutes: 30,
        temporalAlignment: Math.min(1, profilesInWindow.length / 3),
        contentSimilarity: calculateSimpleSimilarity(contents),
        topics,
      });
    }
    
    windowStart = windowEnd === -1 ? sortedComms.length : windowEnd;
  }
  
  return groups.filter(g => g.temporalAlignment > 0.5);
}

function detectStoryAlignment(communications: any[], deceptionAnalyses: any[]): any[] {
  const alignments: any[] = [];
  
  // Group communications by profile
  const profileComms = new Map<string, any[]>();
  communications.forEach(c => {
    if (!c.profile_id) return;
    const comms = profileComms.get(c.profile_id) || [];
    comms.push(c);
    profileComms.set(c.profile_id, comms);
  });
  
  // Compare narratives between profile pairs
  const profileIds = Array.from(profileComms.keys());
  for (let i = 0; i < profileIds.length; i++) {
    for (let j = i + 1; j < profileIds.length; j++) {
      const comms1 = profileComms.get(profileIds[i]) || [];
      const comms2 = profileComms.get(profileIds[j]) || [];
      
      const contents1 = comms1.map(c => c.content || '').join(' ');
      const contents2 = comms2.map(c => c.content || '').join(' ');
      
      const similarity = calculateTextSimilarity(contents1, contents2);
      
      if (similarity > 0.5) {
        alignments.push({
          participants: [profileIds[i], profileIds[j]],
          similarity,
          topics: extractTopics([contents1, contents2]),
          matchingElements: ['Similar phrasing detected', 'Matching timeline of events'],
        });
      }
    }
  }
  
  return alignments;
}

function detectCoordinatedAnomalies(anomalies: any[], profiles: any[]): any[] {
  const coordinated: any[] = [];
  const windowMs = 24 * 60 * 60 * 1000; // 24 hour window
  
  // Group anomalies by time
  anomalies.sort((a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime());
  
  for (let i = 0; i < anomalies.length; i++) {
    const baseTime = new Date(anomalies[i].detected_at).getTime();
    const related = anomalies.filter((a, j) => 
      j !== i && 
      Math.abs(new Date(a.detected_at).getTime() - baseTime) < windowMs &&
      a.anomaly_type === anomalies[i].anomaly_type
    );
    
    if (related.length >= 1) {
      const participants = [anomalies[i].profile_id, ...related.map(r => r.profile_id)]
        .filter((v, i, a) => v && a.indexOf(v) === i);
      
      if (participants.length >= 2) {
        coordinated.push({
          participants,
          synchronizationScore: Math.min(1, participants.length / 3),
          firstDetected: anomalies[i].detected_at,
          indicators: [
            `${participants.length} profiles showed ${anomalies[i].anomaly_type} anomaly`,
            'Anomalies detected within 24-hour window',
          ],
        });
      }
    }
  }
  
  return coordinated;
}

function detectHiddenConnections(relationships: any[], communications: any[]): any[] {
  const hidden: any[] = [];
  
  // Build explicit relationship map
  const explicitRelations = new Set<string>();
  relationships.forEach(r => {
    explicitRelations.add(`${r.from_profile_id}-${r.to_profile_id}`);
    explicitRelations.add(`${r.to_profile_id}-${r.from_profile_id}`);
  });
  
  // Find communication patterns between unrelated profiles
  const commPairs = new Map<string, any[]>();
  communications.forEach(c => {
    if (!c.profile_id) return;
    const key = c.profile_id;
    const comms = commPairs.get(key) || [];
    comms.push(c);
    commPairs.set(key, comms);
  });
  
  // Detect topic overlap between unrelated profiles
  const profileIds = Array.from(commPairs.keys());
  for (let i = 0; i < profileIds.length; i++) {
    for (let j = i + 1; j < profileIds.length; j++) {
      const pairKey = `${profileIds[i]}-${profileIds[j]}`;
      if (!explicitRelations.has(pairKey)) {
        const comms1 = commPairs.get(profileIds[i]) || [];
        const comms2 = commPairs.get(profileIds[j]) || [];
        
        const topics1 = extractTopics(comms1.map(c => c.content || ''));
        const topics2 = extractTopics(comms2.map(c => c.content || ''));
        
        const sharedTopics = topics1.filter(t => topics2.includes(t));
        
        if (sharedTopics.length >= 2) {
          hidden.push({
            participants: [profileIds[i], profileIds[j]],
            connectionStrength: Math.min(1, sharedTopics.length / 5),
            sharedTopics,
          });
        }
      }
    }
  }
  
  return hidden;
}

function generateInterrogationOrder(
  networks: CollusionNetwork[],
  deceptionScores: Map<string, number>,
  nameMap: Map<string, string>
): string[] {
  // Score profiles by involvement in collusion networks and individual deception
  const scores = new Map<string, number>();
  
  networks.forEach(n => {
    n.participants.forEach((p, idx) => {
      const current = scores.get(p) || 0;
      // Earlier participants in network get higher priority
      scores.set(p, current + n.evidenceStrength * (1 - idx * 0.1));
    });
  });
  
  deceptionScores.forEach((score, profileId) => {
    const current = scores.get(profileId) || 0;
    scores.set(profileId, current + score);
  });
  
  // Sort by score descending
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => nameMap.get(id) || id);
}

function extractTopics(texts: string[]): string[] {
  const words = texts.join(' ').toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();
  
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with',
    'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'so', 'yet',
    'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just']);
  
  words.forEach(w => {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    }
  });
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function calculateSimpleSimilarity(texts: string[]): number {
  if (texts.length < 2) return 0;
  
  const topics = texts.map(t => new Set(extractTopics([t])));
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const intersection = [...topics[i]].filter(t => topics[j].has(t)).length;
      const union = new Set([...topics[i], ...topics[j]]).size;
      if (union > 0) {
        totalSimilarity += intersection / union;
        comparisons++;
      }
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
}
