import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LinkRequest {
  captureId?: string;
  profileId?: string;
  runForAll?: boolean;
}

interface SocialIdentity {
  platform: string;
  username: string;
  displayName?: string;
  bio?: string;
  website?: string;
  email?: string;
  avatarUrl?: string;
  captureId: string;
  followers?: number;
  profileUrl?: string;
}

interface IdentityMatch {
  identities: SocialIdentity[];
  confidence: number;
  matchReasons: string[];
  suggestedProfileId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_AI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { captureId, profileId, runForAll = false }: LinkRequest = await req.json();

    console.log('Link social identities - captureId:', captureId, 'profileId:', profileId, 'runForAll:', runForAll);

    // Get all social captures to analyze
    let capturesQuery = supabase
      .from('device_captures')
      .select('id, source_app, extracted_data, profile_id, created_at')
      .eq('user_id', user.id)
      .in('capture_type', ['social_profile', 'bulk_social_scrape'])
      .order('created_at', { ascending: false });

    if (captureId) {
      capturesQuery = capturesQuery.eq('id', captureId);
    } else if (profileId) {
      capturesQuery = capturesQuery.eq('profile_id', profileId);
    } else if (!runForAll) {
      capturesQuery = capturesQuery.limit(50);
    }

    const { data: captures, error: fetchError } = await capturesQuery;

    if (fetchError || !captures?.length) {
      return new Response(
        JSON.stringify({ error: 'No captures found', details: fetchError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract identities from captures
    const identities: SocialIdentity[] = captures.map(capture => {
      const ed = capture.extracted_data || {};
      return {
        platform: ed.platform || capture.source_app,
        username: ed.username || ed.profile?.username,
        displayName: ed.displayName || ed.profile?.displayName,
        bio: ed.bio || ed.profile?.bio,
        website: ed.website || ed.profile?.website,
        email: ed.email || ed.profile?.email,
        avatarUrl: ed.profileImageUrl || ed.avatarUrl || ed.profile?.avatarUrl,
        captureId: capture.id,
        followers: ed.followersCount || ed.stats?.followers,
        profileUrl: ed.profileUrl,
      };
    }).filter(id => id.username);

    if (identities.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No identities to link', matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group identities by potential matches
    const matches: IdentityMatch[] = [];
    const processed = new Set<string>();

    for (const identity of identities) {
      if (processed.has(identity.captureId)) continue;

      const matchGroup: SocialIdentity[] = [identity];
      const matchReasons: string[] = [];
      processed.add(identity.captureId);

      // Find other identities that might be the same person
      for (const other of identities) {
        if (processed.has(other.captureId)) continue;
        if (other.platform === identity.platform) continue; // Same platform = different person

        const reasons = checkIdentityMatch(identity, other);
        if (reasons.length > 0) {
          matchGroup.push(other);
          matchReasons.push(...reasons);
          processed.add(other.captureId);
        }
      }

      if (matchGroup.length > 1) {
        const confidence = calculateConfidence(matchReasons, matchGroup);
        matches.push({
          identities: matchGroup,
          confidence,
          matchReasons: [...new Set(matchReasons)],
        });
      }
    }

    // Use AI for uncertain matches if available
    if (lovableApiKey && matches.length > 0) {
      for (const match of matches) {
        if (match.confidence < 0.7 && match.confidence > 0.3) {
          const aiConfirmation = await confirmMatchWithAI(lovableApiKey, match);
          if (aiConfirmation) {
            match.confidence = aiConfirmation.confidence;
            match.matchReasons.push(...aiConfirmation.reasons);
          }
        }
      }
    }

    // Find existing profiles that might match
    for (const match of matches) {
      const suggestedProfile = await findMatchingProfile(supabase, user.id, match);
      if (suggestedProfile) {
        match.suggestedProfileId = suggestedProfile;
      }
    }

    // Store confirmed matches (confidence > 0.7)
    const confirmedMatches = matches.filter(m => m.confidence >= 0.7);
    let linksCreated = 0;

    for (const match of confirmedMatches) {
      const { error } = await supabase.from('social_identity_links').upsert({
        user_id: user.id,
        primary_profile_id: match.suggestedProfileId || null,
        capture_ids: match.identities.map(i => i.captureId),
        platforms: match.identities.map(i => i.platform),
        confidence_score: match.confidence,
        match_reasons: match.matchReasons,
        usernames: match.identities.map(i => ({ platform: i.platform, username: i.username })),
      }, {
        onConflict: 'user_id,capture_ids',
        ignoreDuplicates: true,
      });

      if (!error) linksCreated++;
    }

    // Create activity feed entry for significant discoveries
    if (confirmedMatches.length > 0) {
      await supabase.from('contact_activity_feed').insert({
        user_id: user.id,
        activity_type: 'intelligence',
        activity_subtype: 'identity_link',
        title: `Cross-platform identity discovered`,
        description: `Found ${confirmedMatches.length} cross-platform identity match${confirmedMatches.length > 1 ? 'es' : ''}`,
        importance_score: 7,
        metadata: {
          matchCount: confirmedMatches.length,
          platforms: [...new Set(confirmedMatches.flatMap(m => m.identities.map(i => i.platform)))],
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        identitiesAnalyzed: identities.length,
        matchesFound: matches.length,
        confirmedMatches: confirmedMatches.length,
        linksCreated,
        matches: matches.map(m => ({
          platforms: m.identities.map(i => i.platform),
          usernames: m.identities.map(i => i.username),
          confidence: m.confidence,
          matchReasons: m.matchReasons,
          suggestedProfileId: m.suggestedProfileId,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Link identities error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Linking failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============== Helper Functions ==============

function checkIdentityMatch(a: SocialIdentity, b: SocialIdentity): string[] {
  const reasons: string[] = [];

  // Same display name (high signal)
  if (a.displayName && b.displayName) {
    const nameA = a.displayName.toLowerCase().trim();
    const nameB = b.displayName.toLowerCase().trim();
    if (nameA === nameB) {
      reasons.push('identical_display_name');
    } else if (similarityScore(nameA, nameB) > 0.8) {
      reasons.push('similar_display_name');
    }
  }

  // Same username pattern (medium signal)
  if (a.username && b.username) {
    const usernameA = a.username.toLowerCase().replace(/[._-]/g, '');
    const usernameB = b.username.toLowerCase().replace(/[._-]/g, '');
    if (usernameA === usernameB) {
      reasons.push('identical_username');
    } else if (similarityScore(usernameA, usernameB) > 0.8) {
      reasons.push('similar_username');
    }
  }

  // Same email (very high signal)
  if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
    reasons.push('identical_email');
  }

  // Same website (high signal)
  if (a.website && b.website) {
    const siteA = normalizeUrl(a.website);
    const siteB = normalizeUrl(b.website);
    if (siteA === siteB) {
      reasons.push('identical_website');
    }
  }

  // Similar bio (medium signal)
  if (a.bio && b.bio && a.bio.length > 20 && b.bio.length > 20) {
    if (similarityScore(a.bio.toLowerCase(), b.bio.toLowerCase()) > 0.6) {
      reasons.push('similar_bio');
    }
  }

  // Cross-platform link in bio
  if (a.bio && b.username) {
    if (a.bio.toLowerCase().includes(b.username.toLowerCase())) {
      reasons.push('username_in_bio');
    }
  }
  if (b.bio && a.username) {
    if (b.bio.toLowerCase().includes(a.username.toLowerCase())) {
      reasons.push('username_in_bio');
    }
  }

  return reasons;
}

function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  // Levenshtein distance based similarity
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }
  
  return 1 - (costs[longer.length] / longer.length);
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  }
}

function calculateConfidence(reasons: string[], identities: SocialIdentity[]): number {
  const weights: Record<string, number> = {
    identical_email: 0.95,
    identical_website: 0.85,
    identical_display_name: 0.75,
    identical_username: 0.70,
    similar_display_name: 0.55,
    similar_username: 0.50,
    username_in_bio: 0.60,
    similar_bio: 0.45,
  };

  let totalWeight = 0;
  let maxWeight = 0;

  reasons.forEach(reason => {
    const weight = weights[reason] || 0.3;
    totalWeight += weight;
    maxWeight = Math.max(maxWeight, weight);
  });

  // Combine max weight with average
  const avgWeight = totalWeight / reasons.length;
  let confidence = maxWeight * 0.6 + avgWeight * 0.4;

  // Bonus for multiple strong signals
  if (reasons.length >= 3) confidence += 0.1;
  if (reasons.includes('identical_email') && reasons.length > 1) confidence += 0.05;

  return Math.min(confidence, 0.98);
}

async function confirmMatchWithAI(apiKey: string, match: IdentityMatch): Promise<{ confidence: number; reasons: string[] } | null> {
  try {
    const response = await fetch('https://ai.lovable.dev/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Determine if these social media profiles belong to the same person.

Profiles:
${match.identities.map(i => `
Platform: ${i.platform}
Username: ${i.username}
Display Name: ${i.displayName || 'N/A'}
Bio: ${i.bio?.substring(0, 200) || 'N/A'}
Website: ${i.website || 'N/A'}
`).join('\n---\n')}

Initial match reasons: ${match.matchReasons.join(', ')}

Return JSON:
{
  "samePersonLikelihood": 0.0-1.0,
  "additionalReasons": ["reason1", "reason2"],
  "concerns": ["any doubts"]
}`
        }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    return {
      confidence: result.samePersonLikelihood || match.confidence,
      reasons: result.additionalReasons || [],
    };
  } catch {
    return null;
  }
}

async function findMatchingProfile(supabase: any, userId: string, match: IdentityMatch): Promise<string | null> {
  // Look for existing profile that might match
  const displayNames = match.identities.map(i => i.displayName).filter(Boolean);
  const emails = match.identities.map(i => i.email).filter(Boolean) as string[];

  // Search for email matches in contact_methods table
  if (emails.length > 0) {
    const { data } = await supabase
      .from('contact_methods')
      .select('profile_id, profiles!inner(user_id)')
      .eq('profiles.user_id', userId)
      .eq('contact_type', 'email')
      .in('value', emails)
      .limit(1);
    
    if (data?.[0]) return data[0].profile_id;
  }

  if (displayNames.length > 0) {
    // Try to match by name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('user_id', userId)
      .limit(100);

    if (profiles) {
      for (const displayName of displayNames) {
        if (!displayName) continue;
        const nameParts = displayName.split(' ').filter(Boolean);
        const nameMatch = profiles.find((p: any) => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase();
          return fullName === displayName.toLowerCase() ||
                 (nameParts.length > 0 && p.first_name?.toLowerCase() === nameParts[0].toLowerCase());
        });
        if (nameMatch) return nameMatch.id;
      }
    }
  }

  return null;
}
