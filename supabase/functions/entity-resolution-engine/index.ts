import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EntityResolutionRequest {
  action: 'resolve' | 'merge' | 'detect_aliases' | 'cross_reference';
  profileIds?: string[];
  threshold?: number;
}

interface EntityMatch {
  profileA: { id: string; name: string };
  profileB: { id: string; name: string };
  similarity: number;
  matchReasons: string[];
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'merge' | 'link' | 'review' | 'ignore';
}

interface AliasDetection {
  profileId: string;
  profileName: string;
  possibleAliases: string[];
  aliasType: 'nickname' | 'formal' | 'maiden' | 'professional' | 'online';
  confidence: number;
}

// Calculate string similarity using Levenshtein distance
function levenshteinSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  return 1 - costs[shorter.length] / longer.length;
}

// Phonetic similarity using simplified Soundex
function soundexCode(s: string): string {
  const a = s.toUpperCase().split('');
  const firstLetter = a[0];
  const codes: Record<string, string> = {
    A: '', E: '', I: '', O: '', U: '', H: '', W: '', Y: '',
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };
  
  const coded = a.map(letter => codes[letter] || '').join('');
  const deduplicated = coded.split('').filter((c, i, arr) => c !== arr[i - 1]).join('');
  return (firstLetter + deduplicated.slice(1)).padEnd(4, '0').slice(0, 4);
}

function phoneticSimilarity(s1: string, s2: string): number {
  const code1 = soundexCode(s1);
  const code2 = soundexCode(s2);
  
  let matches = 0;
  for (let i = 0; i < 4; i++) {
    if (code1[i] === code2[i]) matches++;
  }
  
  return matches / 4;
}

// Token-based similarity (Jaccard)
function tokenSimilarity(s1: string, s2: string): number {
  const tokens1 = new Set(s1.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  const tokens2 = new Set(s2.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Email similarity
function emailSimilarity(e1: string | null, e2: string | null): number {
  if (!e1 || !e2) return 0;
  
  const [local1, domain1] = e1.toLowerCase().split('@');
  const [local2, domain2] = e2.toLowerCase().split('@');
  
  // Same domain is a good signal
  const domainMatch = domain1 === domain2 ? 0.3 : 0;
  
  // Compare local parts
  const localSimilarity = levenshteinSimilarity(local1, local2) * 0.7;
  
  return domainMatch + localSimilarity;
}

// Calculate overall entity similarity
function calculateEntitySimilarity(profileA: any, profileB: any): { similarity: number; reasons: string[] } {
  let totalScore = 0;
  let maxScore = 0;
  const reasons: string[] = [];

  // Name comparison (weight: 40)
  if (profileA.name && profileB.name) {
    maxScore += 40;
    const nameLev = levenshteinSimilarity(profileA.name.toLowerCase(), profileB.name.toLowerCase());
    const namePhonetic = phoneticSimilarity(profileA.name, profileB.name);
    const nameToken = tokenSimilarity(profileA.name, profileB.name);
    const nameScore = Math.max(nameLev, namePhonetic, nameToken) * 40;
    totalScore += nameScore;
    
    if (nameScore > 30) reasons.push(`name_match:${Math.round(nameScore)}%`);
    else if (nameScore > 20) reasons.push(`name_partial:${Math.round(nameScore)}%`);
  }

  // Email comparison (weight: 30)
  if (profileA.email && profileB.email) {
    maxScore += 30;
    if (profileA.email.toLowerCase() === profileB.email.toLowerCase()) {
      totalScore += 30;
      reasons.push('email_exact_match');
    } else {
      const emailScore = emailSimilarity(profileA.email, profileB.email) * 30;
      totalScore += emailScore;
      if (emailScore > 15) reasons.push(`email_similar:${Math.round(emailScore)}%`);
    }
  }

  // Phone comparison (weight: 25)
  if (profileA.phone && profileB.phone) {
    maxScore += 25;
    const phone1 = profileA.phone.replace(/\D/g, '');
    const phone2 = profileB.phone.replace(/\D/g, '');
    if (phone1 === phone2) {
      totalScore += 25;
      reasons.push('phone_exact_match');
    } else if (phone1.slice(-7) === phone2.slice(-7)) {
      totalScore += 15;
      reasons.push('phone_partial_match');
    }
  }

  // Company comparison (weight: 15)
  if (profileA.company && profileB.company) {
    maxScore += 15;
    const companySim = levenshteinSimilarity(
      profileA.company.toLowerCase(),
      profileB.company.toLowerCase()
    );
    const companyScore = companySim * 15;
    totalScore += companyScore;
    if (companyScore > 10) reasons.push(`company_match:${Math.round(companySim * 100)}%`);
  }

  // Location comparison (weight: 10)
  if (profileA.location && profileB.location) {
    maxScore += 10;
    const locSim = tokenSimilarity(profileA.location, profileB.location);
    const locScore = locSim * 10;
    totalScore += locScore;
    if (locScore > 5) reasons.push(`location_match:${Math.round(locSim * 100)}%`);
  }

  const similarity = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  return { similarity, reasons };
}

// Detect potential aliases for a profile
function detectAliases(profile: any): AliasDetection | null {
  const aliases: string[] = [];
  let aliasType: AliasDetection['aliasType'] = 'nickname';
  
  const name = profile.name || '';
  const nameParts = name.split(/\s+/);
  
  // Generate nickname variants
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    // Common nickname patterns
    aliases.push(`${firstName.charAt(0)}. ${lastName}`);
    aliases.push(`${firstName} ${lastName.charAt(0)}.`);
    
    // Diminutives
    const diminutives: Record<string, string[]> = {
      'William': ['Will', 'Bill', 'Billy', 'Willy'],
      'Robert': ['Rob', 'Bob', 'Bobby', 'Robbie'],
      'Richard': ['Rich', 'Rick', 'Dick', 'Ricky'],
      'Elizabeth': ['Liz', 'Beth', 'Lizzy', 'Betty'],
      'Margaret': ['Maggie', 'Meg', 'Peggy', 'Marge'],
      'Katherine': ['Kate', 'Katie', 'Kathy', 'Kay'],
      'Jennifer': ['Jen', 'Jenny', 'Jenn'],
      'Michael': ['Mike', 'Mikey', 'Mick'],
      'Christopher': ['Chris', 'Topher', 'Kit'],
      'Alexander': ['Alex', 'Xander', 'Alec'],
      'Benjamin': ['Ben', 'Benji', 'Benny'],
      'Nicholas': ['Nick', 'Nicky', 'Nico'],
      'Jonathan': ['Jon', 'John', 'Johnny'],
      'Anthony': ['Tony', 'Ant']
    };
    
    for (const [formal, nicks] of Object.entries(diminutives)) {
      if (firstName.toLowerCase() === formal.toLowerCase()) {
        aliases.push(...nicks.map(n => `${n} ${lastName}`));
        aliasType = 'nickname';
      }
      if (nicks.some(n => firstName.toLowerCase() === n.toLowerCase())) {
        aliases.push(`${formal} ${lastName}`);
        aliasType = 'formal';
      }
    }
  }
  
  // Email-based aliases
  if (profile.email) {
    const [local] = profile.email.split('@');
    if (local && !aliases.includes(local)) {
      aliases.push(local.replace(/[._]/g, ' '));
      aliasType = 'online';
    }
  }
  
  if (aliases.length === 0) return null;
  
  return {
    profileId: profile.id,
    profileName: name,
    possibleAliases: [...new Set(aliases)].slice(0, 10),
    aliasType,
    confidence: aliases.length > 5 ? 0.6 : aliases.length > 2 ? 0.7 : 0.8
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'entity-resolution-engine', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, profileIds, threshold } = await req.json() as EntityResolutionRequest;
    const similarityThreshold = threshold || 60;

    console.log(`[Entity Resolution] Action: ${action}, threshold: ${similarityThreshold}`);

    // Get profiles
    let profileQuery = supabase.from('profiles').select('*').eq('user_id', user.id);
    if (profileIds && profileIds.length > 0) {
      profileQuery = profileQuery.in('id', profileIds);
    }
    const { data: profiles } = await profileQuery.limit(500);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No profiles found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result: any = {
      profilesAnalyzed: profiles.length,
      threshold: similarityThreshold
    };

    if (action === 'resolve' || action === 'merge') {
      const matches: EntityMatch[] = [];
      
      // Compare all pairs
      for (let i = 0; i < profiles.length; i++) {
        for (let j = i + 1; j < profiles.length; j++) {
          const { similarity, reasons } = calculateEntitySimilarity(profiles[i], profiles[j]);
          
          if (similarity >= similarityThreshold) {
            let confidence: EntityMatch['confidence'] = 'low';
            let suggestedAction: EntityMatch['suggestedAction'] = 'review';
            
            if (similarity >= 90) {
              confidence = 'high';
              suggestedAction = 'merge';
            } else if (similarity >= 75) {
              confidence = 'medium';
              suggestedAction = 'link';
            }
            
            matches.push({
              profileA: { id: profiles[i].id, name: profiles[i].name || 'Unknown' },
              profileB: { id: profiles[j].id, name: profiles[j].name || 'Unknown' },
              similarity: Math.round(similarity),
              matchReasons: reasons,
              confidence,
              suggestedAction
            });
          }
        }
      }
      
      result.potentialDuplicates = matches.sort((a, b) => b.similarity - a.similarity);
      result.duplicateCount = matches.length;
      result.highConfidenceMatches = matches.filter(m => m.confidence === 'high').length;
    }

    if (action === 'detect_aliases') {
      const aliasDetections: AliasDetection[] = [];
      
      for (const profile of profiles) {
        const detection = detectAliases(profile);
        if (detection) {
          aliasDetections.push(detection);
        }
      }
      
      result.aliasDetections = aliasDetections;
      result.profilesWithAliases = aliasDetections.length;
    }

    if (action === 'cross_reference') {
      // Find profiles that might be connected through shared attributes
      const crossRefs: Array<{ attribute: string; value: string; profiles: string[] }> = [];
      
      // Group by email domain
      const emailDomains = new Map<string, string[]>();
      for (const profile of profiles) {
        if (profile.email) {
          const domain = profile.email.split('@')[1]?.toLowerCase();
          if (domain) {
            if (!emailDomains.has(domain)) {
              emailDomains.set(domain, []);
            }
            emailDomains.get(domain)!.push(profile.name || profile.id);
          }
        }
      }
      
      for (const [domain, names] of emailDomains) {
        if (names.length > 1) {
          crossRefs.push({
            attribute: 'email_domain',
            value: domain,
            profiles: names
          });
        }
      }
      
      // Group by company
      const companies = new Map<string, string[]>();
      for (const profile of profiles) {
        if (profile.company) {
          const company = profile.company.toLowerCase();
          if (!companies.has(company)) {
            companies.set(company, []);
          }
          companies.get(company)!.push(profile.name || profile.id);
        }
      }
      
      for (const [company, names] of companies) {
        if (names.length > 1) {
          crossRefs.push({
            attribute: 'company',
            value: company,
            profiles: names
          });
        }
      }
      
      result.crossReferences = crossRefs;
      result.clusters = crossRefs.length;
    }

    // Store in ai_analyses for section availability detection
    if (profiles && profiles.length > 0) {
      const primaryProfileId = profileIds?.[0] || profiles[0]?.id;
      if (primaryProfileId) {
        await supabase.from('ai_analyses').upsert({
          user_id: user.id,
          profile_id: primaryProfileId,
          analysis_type: 'entity_resolution',
          result: result,
          generated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,analysis_type' });
      }
    }

    console.log(`[Entity Resolution] Complete. ${result.duplicateCount || 0} duplicates, ${result.profilesWithAliases || 0} alias profiles`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Entity Resolution] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
