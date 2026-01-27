import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize phone numbers for matching
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

// Normalize email for matching
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Normalize names for fuzzy matching
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function nameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return 1;
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 0;
  const distance = levenshtein(n1, n2);
  return 1 - (distance / maxLen);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { profile_id, full_scan } = await req.json();

    // Fetch profiles to analyze
    let profilesToAnalyze: any[] = [];
    if (profile_id) {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, job_title')
        .eq('id', profile_id)
        .eq('user_id', user.id);
      profilesToAnalyze = data || [];
    } else if (full_scan) {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, job_title')
        .eq('user_id', user.id);
      profilesToAnalyze = data || [];
    }

    const newLinks: any[] = [];
    const newCrossRefs: any[] = [];

    for (const profile of profilesToAnalyze) {
      // Fetch contact methods
      const { data: contactMethods } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('profile_id', profile.id);

      // Index phones and emails
      for (const method of contactMethods || []) {
        if (method.contact_type === 'phone' && method.value) {
          const normalized = normalizePhone(method.value);
          newCrossRefs.push({
            profile_id: profile.id,
            reference_type: 'phone',
            reference_value: method.value,
            normalized_value: normalized,
            source: 'contact_methods',
            confidence: 1.0,
            user_id: user.id
          });
        }
        if (method.contact_type === 'email' && method.value) {
          const normalized = normalizeEmail(method.value);
          const domain = normalized.split('@')[1];
          newCrossRefs.push({
            profile_id: profile.id,
            reference_type: 'email',
            reference_value: method.value,
            normalized_value: normalized,
            source: 'contact_methods',
            confidence: 1.0,
            user_id: user.id
          });
          // Also index domain
          if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
            newCrossRefs.push({
              profile_id: profile.id,
              reference_type: 'email_domain',
              reference_value: domain,
              normalized_value: domain,
              source: 'contact_methods',
              confidence: 0.8,
              user_id: user.id
            });
          }
        }
      }

      // Index name variations
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      if (fullName) {
        newCrossRefs.push({
          profile_id: profile.id,
          reference_type: 'name',
          reference_value: fullName,
          normalized_value: normalizeName(fullName),
          source: 'profile',
          confidence: 1.0,
          user_id: user.id
        });
      }

      // Index organization
      if (profile.organization) {
        newCrossRefs.push({
          profile_id: profile.id,
          reference_type: 'company',
          reference_value: profile.organization,
          normalized_value: profile.organization.toLowerCase().trim(),
          source: 'profile',
          confidence: 1.0,
          user_id: user.id
        });
      }
    }

    // Upsert cross references
    if (newCrossRefs.length > 0) {
      await supabase.from('cross_references').upsert(newCrossRefs, {
        onConflict: 'profile_id,reference_type,reference_value,user_id',
        ignoreDuplicates: true
      });
    }

    // Find entity links based on matching cross references
    const { data: allRefs } = await supabase
      .from('cross_references')
      .select('*')
      .eq('user_id', user.id);

    // Group by normalized value
    const refsByValue: Record<string, any[]> = {};
    for (const ref of allRefs || []) {
      const key = `${ref.reference_type}:${ref.normalized_value}`;
      if (!refsByValue[key]) refsByValue[key] = [];
      refsByValue[key].push(ref);
    }

    // Create entity links for matching references
    for (const [key, refs] of Object.entries(refsByValue)) {
      if (refs.length > 1) {
        // Multiple profiles share this reference
        for (let i = 0; i < refs.length; i++) {
          for (let j = i + 1; j < refs.length; j++) {
            if (refs[i].profile_id !== refs[j].profile_id) {
              const [refType] = key.split(':');
              newLinks.push({
                source_type: 'profile',
                source_id: refs[i].profile_id,
                target_type: 'profile',
                target_id: refs[j].profile_id,
                link_type: refType === 'email_domain' ? 'organization' : 'identity',
                confidence_score: Math.min(refs[i].confidence, refs[j].confidence),
                evidence: { 
                  matching_reference: key, 
                  source_ref: refs[i].reference_value,
                  target_ref: refs[j].reference_value
                },
                user_id: user.id
              });
            }
          }
        }
      }
    }

    // Upsert entity links
    if (newLinks.length > 0) {
      await supabase.from('entity_links').upsert(newLinks, {
        onConflict: 'source_type,source_id,target_type,target_id,user_id',
        ignoreDuplicates: false
      });
    }

    console.log(`[CROSS-REF] Analyzed ${profilesToAnalyze.length} profiles, created ${newCrossRefs.length} refs, ${newLinks.length} links`);

    return new Response(JSON.stringify({
      success: true,
      profiles_analyzed: profilesToAnalyze.length,
      cross_references_created: newCrossRefs.length,
      entity_links_created: newLinks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cross-reference analysis error:', error);
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
