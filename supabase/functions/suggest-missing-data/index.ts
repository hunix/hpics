import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId } = await req.json();

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile data
    const [
      { data: profile },
      { data: contactMethods },
      { data: interests },
      { data: communications },
      { data: relationships },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_methods').select('*').eq('profile_id', profileId),
      supabase.from('contact_interests').select('*').eq('profile_id', profileId),
      supabase.from('communications').select('channel, content, subject').eq('profile_id', profileId).limit(20),
      supabase.from('contact_relationships').select('relationship_type, to_profile_id').eq('from_profile_id', profileId),
    ]);

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Analyze existing data to suggest missing fields
    const suggestions: Array<{
      field: string;
      category: string;
      suggestion: string;
      confidence: number;
      source: string;
    }> = [];

    const hasEmail = contactMethods?.some(m => m.contact_type === 'email');
    const hasPhone = contactMethods?.some(m => m.contact_type === 'phone');

    // Basic suggestions based on missing fields
    if (!hasEmail) {
      suggestions.push({
        field: 'email',
        category: 'contact_method',
        suggestion: 'Add an email address for better communication tracking',
        confidence: 0.9,
        source: 'missing_field_detection',
      });
    }

    if (!hasPhone) {
      suggestions.push({
        field: 'phone',
        category: 'contact_method',
        suggestion: 'Add a phone number for direct communication',
        confidence: 0.85,
        source: 'missing_field_detection',
      });
    }

    if (!profile.organization && profile.job_title) {
      suggestions.push({
        field: 'organization',
        category: 'professional',
        suggestion: `Since they have a job title "${profile.job_title}", consider adding their organization`,
        confidence: 0.8,
        source: 'field_correlation',
      });
    }

    if (!profile.job_title && profile.organization) {
      suggestions.push({
        field: 'job_title',
        category: 'professional',
        suggestion: `Since they work at "${profile.organization}", consider adding their job title`,
        confidence: 0.8,
        source: 'field_correlation',
      });
    }

    // Suggest LinkedIn if professional context
    const hasLinkedIn = contactMethods?.some(m => m.contact_type === 'linkedin');
    if (!hasLinkedIn && (profile.organization || profile.job_title)) {
      suggestions.push({
        field: 'linkedin',
        category: 'social',
        suggestion: 'Add LinkedIn profile for professional networking context',
        confidence: 0.75,
        source: 'professional_context',
      });
    }

    // Interest suggestions based on communication content
    if (communications && communications.length > 0 && (!interests || interests.length === 0)) {
      const combinedContent = communications
        .map(c => `${c.subject || ''} ${c.content || ''}`)
        .join(' ')
        .toLowerCase();

      const topicKeywords: Record<string, string[]> = {
        'technology': ['tech', 'software', 'app', 'digital', 'computer', 'programming', 'ai', 'startup'],
        'sports': ['game', 'match', 'team', 'player', 'score', 'fitness', 'workout', 'gym'],
        'travel': ['trip', 'vacation', 'travel', 'flight', 'hotel', 'destination', 'adventure'],
        'food': ['restaurant', 'food', 'dinner', 'lunch', 'recipe', 'cooking', 'cuisine'],
        'music': ['concert', 'music', 'song', 'band', 'album', 'playlist'],
        'movies': ['movie', 'film', 'cinema', 'show', 'series', 'netflix'],
        'business': ['meeting', 'deal', 'project', 'client', 'revenue', 'strategy'],
      };

      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const matches = keywords.filter(kw => combinedContent.includes(kw)).length;
        if (matches >= 2) {
          suggestions.push({
            field: 'interest',
            category: 'interests',
            suggestion: `Based on conversations, they may be interested in ${topic}`,
            confidence: Math.min(0.6 + (matches * 0.1), 0.9),
            source: 'communication_analysis',
          });
        }
      }
    }

    // Relationship type suggestions
    if (!profile.relationship_type || profile.relationship_type === 'other') {
      if (profile.organization) {
        suggestions.push({
          field: 'relationship_type',
          category: 'relationship',
          suggestion: 'Consider setting relationship type to "colleague" or "business" based on organization info',
          confidence: 0.7,
          source: 'organization_context',
        });
      }
    }

    // Avatar suggestion
    if (!profile.avatar_url) {
      suggestions.push({
        field: 'avatar',
        category: 'profile',
        suggestion: 'Add a profile photo for easier recognition',
        confidence: 0.95,
        source: 'missing_field_detection',
      });
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    console.log(`Generated ${suggestions.length} suggestions for profile ${profileId}`);

    return new Response(
      JSON.stringify({
        profileId,
        suggestions: suggestions.slice(0, 10),
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in suggest-missing-data:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
