import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callSecureAI } from "../_shared/secure-ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchSuggestion {
  email: string;
  profileId: string | null;
  profileName: string | null;
  confidence: number;
  reason: string;
  isNewContact: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'match-emails-to-contacts', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json().catch(() => ({}));
    const { batchSize = 50, useAI = true } = body;

    console.log(`[match-emails-to-contacts] Starting matching for user: ${userId}`);

    // Get unmatched email threads with their messages to extract sender emails
    const { data: unmatchedThreads, error: threadsError } = await supabase
      .from('email_threads')
      .select(`
        id, 
        subject,
        email_messages (
          sender_email
        )
      `)
      .eq('user_id', userId)
      .is('profile_id', null)
      .limit(batchSize);

    if (threadsError) {
      throw threadsError;
    }

    if (!unmatchedThreads || unmatchedThreads.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No unmatched threads found',
        matched: 0,
        suggestions: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get unique email addresses from unmatched threads via their messages
    const allEmails = new Set<string>();
    for (const thread of unmatchedThreads) {
      const messages = thread.email_messages || [];
      for (const msg of messages) {
        const email = msg.sender_email;
        if (email && !email.includes('noreply') && !email.includes('no-reply')) {
          allEmails.add(email.toLowerCase());
        }
      }
    }

    console.log(`[match-emails-to-contacts] Found ${allEmails.size} unique email addresses`);

    // Get all contacts with their email methods - scoped to current user via profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        contact_methods (
          contact_type,
          value
        )
      `)
      .eq('user_id', userId);

    // Build comprehensive matching index
    const emailToProfile = new Map<string, { id: string; name: string }>();
    const nameVariations = new Map<string, { id: string; name: string }[]>();
    const domainToProfiles = new Map<string, { id: string; name: string }[]>();

    for (const profile of profiles || []) {
      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      const nameLower = name.toLowerCase();
      
      // Index by email - use contact_type not method_type
      for (const method of profile.contact_methods || []) {
        if (method.contact_type === 'email' && method.value) {
          emailToProfile.set(method.value.toLowerCase(), { id: profile.id, name });
          
          // Index by domain
          const domain = method.value.split('@')[1];
          if (domain) {
            const existing = domainToProfiles.get(domain) || [];
            existing.push({ id: profile.id, name });
            domainToProfiles.set(domain, existing);
          }
        }
      }
      
      // Index by name variations
      if (name) {
        const existing = nameVariations.get(nameLower) || [];
        existing.push({ id: profile.id, name });
        nameVariations.set(nameLower, existing);
        
        // Also index first name and last name separately
        if (profile.first_name) {
          const firstName = profile.first_name.toLowerCase();
          const existingFirst = nameVariations.get(firstName) || [];
          existingFirst.push({ id: profile.id, name });
          nameVariations.set(firstName, existingFirst);
        }
      }
    }

    const suggestions: MatchSuggestion[] = [];
    let autoMatchedCount = 0;

    // Process each unmatched email
    for (const emailAddr of allEmails) {
      // 1. Direct email match
      const directMatch = emailToProfile.get(emailAddr);
      if (directMatch) {
        suggestions.push({
          email: emailAddr,
          profileId: directMatch.id,
          profileName: directMatch.name,
          confidence: 1.0,
          reason: 'Exact email match',
          isNewContact: false,
        });
        autoMatchedCount++;
        continue;
      }

      // 2. Extract name from email
      const localPart = emailAddr.split('@')[0];
      const possibleName = localPart
        .replace(/[._-]/g, ' ')
        .replace(/\d+/g, '')
        .trim()
        .toLowerCase();

      // 3. Name-based fuzzy matching
      if (possibleName.length > 2) {
        const nameMatches = nameVariations.get(possibleName);
        if (nameMatches && nameMatches.length === 1) {
          suggestions.push({
            email: emailAddr,
            profileId: nameMatches[0].id,
            profileName: nameMatches[0].name,
            confidence: 0.7,
            reason: `Name matches: "${possibleName}"`,
            isNewContact: false,
          });
          continue;
        } else if (nameMatches && nameMatches.length > 1) {
          // Multiple matches - suggest all
          for (const match of nameMatches.slice(0, 3)) {
            suggestions.push({
              email: emailAddr,
              profileId: match.id,
              profileName: match.name,
              confidence: 0.5,
              reason: `Possible name match: "${possibleName}" (multiple candidates)`,
              isNewContact: false,
            });
          }
          continue;
        }
      }

      // 4. Domain-based matching (for corporate emails)
      const domain = emailAddr.split('@')[1];
      const domainMatches = domainToProfiles.get(domain);
      if (domainMatches && domainMatches.length > 0) {
        // Suggest same-organization contacts
        for (const match of domainMatches.slice(0, 2)) {
          suggestions.push({
            email: emailAddr,
            profileId: match.id,
            profileName: match.name,
            confidence: 0.3,
            reason: `Same organization domain: ${domain}`,
            isNewContact: false,
          });
        }
        continue;
      }

      // 5. No match found - suggest creating new contact
      suggestions.push({
        email: emailAddr,
        profileId: null,
        profileName: null,
        confidence: 0,
        reason: 'No matching contact found',
        isNewContact: true,
      });
    }

    // Use AI for enhanced matching on ambiguous cases if enabled
    if (useAI) {
      const ambiguousSuggestions = suggestions.filter(
        s => s.confidence > 0 && s.confidence < 0.8
      );

      if (ambiguousSuggestions.length > 0 && ambiguousSuggestions.length <= 20) {
        try {
          const aiResponse = await callSecureAI({
            messages: [
              {
                role: 'system',
                content: `You are analyzing email addresses to match them with contact profiles. 
                  For each email-profile pair, determine if they likely refer to the same person.
                  Consider name similarity, domain patterns, and common email conventions.
                  Return a JSON array of objects with: email, profileId (or null), adjustedConfidence (0-1), reasoning.`,
              },
              {
                role: 'user',
                content: JSON.stringify(ambiguousSuggestions.map(s => ({
                  email: s.email,
                  suggestedProfile: s.profileName,
                  profileId: s.profileId,
                  currentConfidence: s.confidence,
                  reason: s.reason,
                }))),
              },
            ],
            userId,
            functionName: 'match-emails-to-contacts',
            maskPII: true,
            sensitivityLevel: 'high',
          });

          // Parse AI response and update suggestions
          try {
            const aiAdjustments = JSON.parse(aiResponse.content);
            for (const adjustment of aiAdjustments) {
              const existing = suggestions.find(s => s.email === adjustment.email);
              if (existing && adjustment.adjustedConfidence !== undefined) {
                existing.confidence = adjustment.adjustedConfidence;
                existing.reason = adjustment.reasoning || existing.reason;
              }
            }
          } catch {
            console.warn('[match-emails-to-contacts] Failed to parse AI response');
          }
        } catch (aiError) {
          console.error('[match-emails-to-contacts] AI matching failed:', aiError);
          // Continue without AI enhancement
        }
      }
    }

    // Auto-apply high-confidence matches
    const highConfidenceMatches = suggestions.filter(s => s.confidence >= 0.9 && s.profileId);
    for (const match of highConfidenceMatches) {
      // Find threads with messages from this email and update profile_id
      for (const thread of unmatchedThreads) {
        const messages = thread.email_messages || [];
        const hasMatch = messages.some((m: any) => 
          m.sender_email?.toLowerCase() === match.email
        );
        if (hasMatch) {
          await supabase
            .from('email_threads')
            .update({ profile_id: match.profileId })
            .eq('id', thread.id);
        }
      }
    }

    console.log(`[match-emails-to-contacts] Found ${suggestions.length} suggestions, auto-matched ${autoMatchedCount}`);

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: allEmails.size,
      autoMatched: highConfidenceMatches.length,
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      requiresReview: suggestions.filter(s => s.confidence > 0 && s.confidence < 0.9).length,
      newContacts: suggestions.filter(s => s.isNewContact).length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[match-emails-to-contacts] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
