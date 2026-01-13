import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactPrediction {
  profileId: string;
  profileName: string;
  prediction: string;
  type: 'followup' | 'decay_risk' | 'opportunity' | 'timing';
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  suggestedAction: string;
  suggestedChannel?: string;
  suggestedDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth header for getClaims
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = claimsData.claims.sub as string;
    } catch (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = { id: userId };
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const predictions: ContactPrediction[] = [];

    // Fetch relevant data
    const [
      { data: profiles },
      { data: communications },
      { data: events },
      { data: interactionNotes },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, is_favorite')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('communications')
        .select('profile_id, occurred_at, channel, sentiment_score')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false }),
      supabase
        .from('events')
        .select('profile_id, event_date, event_type, title')
        .eq('user_id', user.id)
        .gte('event_date', now.toISOString()),
      supabase
        .from('contact_interaction_notes')
        .select('profile_id, promises_made, follow_up_needed, follow_up_date')
        .eq('user_id', user.id)
        .eq('follow_up_needed', true),
    ]);

    // Build communication patterns map
    const commPatterns = new Map<string, {
      lastContact: Date;
      averageGapDays: number;
      preferredChannel: string;
      recentSentiment: number;
      contactCount: number;
    }>();

    if (communications) {
      const groupedComms = new Map<string, typeof communications>();
      for (const comm of communications) {
        const existing = groupedComms.get(comm.profile_id) || [];
        groupedComms.set(comm.profile_id, [...existing, comm]);
      }

      for (const [profileId, comms] of groupedComms) {
        if (comms.length < 2) continue;

        const sorted = comms.sort((a, b) => 
          new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
        );

        // Calculate average gap between communications
        let totalGap = 0;
        for (let i = 0; i < sorted.length - 1 && i < 10; i++) {
          const gap = new Date(sorted[i].occurred_at).getTime() - 
                      new Date(sorted[i + 1].occurred_at).getTime();
          totalGap += gap;
        }
        const avgGapDays = totalGap / (Math.min(sorted.length - 1, 10) * 24 * 60 * 60 * 1000);

        // Find preferred channel
        const channelCounts = new Map<string, number>();
        for (const c of comms.slice(0, 10)) {
          channelCounts.set(c.channel, (channelCounts.get(c.channel) || 0) + 1);
        }
        let preferredChannel = 'email';
        let maxCount = 0;
        for (const [channel, count] of channelCounts) {
          if (count > maxCount) {
            maxCount = count;
            preferredChannel = channel;
          }
        }

        // Recent sentiment
        const recentWithSentiment = comms.slice(0, 5).filter(c => c.sentiment_score !== null);
        const avgSentiment = recentWithSentiment.length > 0
          ? recentWithSentiment.reduce((sum, c) => sum + (c.sentiment_score || 0.5), 0) / recentWithSentiment.length
          : 0.5;

        commPatterns.set(profileId, {
          lastContact: new Date(sorted[0].occurred_at),
          averageGapDays: avgGapDays,
          preferredChannel,
          recentSentiment: avgSentiment,
          contactCount: comms.length,
        });
      }
    }

    // Generate predictions for each profile
    for (const profile of profiles || []) {
      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
      const pattern = commPatterns.get(profile.id);

      if (pattern) {
        const daysSinceContact = Math.floor(
          (now.getTime() - pattern.lastContact.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Predict follow-up need based on pattern
        if (daysSinceContact > pattern.averageGapDays * 1.5) {
          const overdueDays = Math.floor(daysSinceContact - pattern.averageGapDays);
          predictions.push({
            profileId: profile.id,
            profileName: name,
            prediction: `Based on your pattern, you typically contact ${name} every ${Math.round(pattern.averageGapDays)} days. It's been ${daysSinceContact} days.`,
            type: 'followup',
            priority: overdueDays > pattern.averageGapDays ? 'high' : 'medium',
            confidence: Math.min(0.7 + (pattern.contactCount * 0.02), 0.95),
            suggestedAction: `Reach out via ${pattern.preferredChannel}`,
            suggestedChannel: pattern.preferredChannel,
            suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Decay risk based on sentiment trend
        if (pattern.recentSentiment < 0.4 && pattern.contactCount >= 5) {
          predictions.push({
            profileId: profile.id,
            profileName: name,
            prediction: `Recent communications with ${name} show declining sentiment (${Math.round(pattern.recentSentiment * 100)}%).`,
            type: 'decay_risk',
            priority: pattern.recentSentiment < 0.3 ? 'high' : 'medium',
            confidence: 0.75,
            suggestedAction: 'Schedule a positive touchpoint to improve relationship health',
            suggestedChannel: pattern.preferredChannel,
          });
        }
      }

      // Check for unfulfilled promises
      const notes = interactionNotes?.filter(n => n.profile_id === profile.id) || [];
      for (const note of notes) {
        if (note.promises_made && note.promises_made.length > 0) {
          predictions.push({
            profileId: profile.id,
            profileName: name,
            prediction: `You have ${note.promises_made.length} pending promise(s) to ${name}`,
            type: 'followup',
            priority: 'high',
            confidence: 0.95,
            suggestedAction: `Complete: ${note.promises_made[0]}`,
            suggestedDate: note.follow_up_date || undefined,
          });
        }
      }
    }

    // Sort by priority and confidence
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    predictions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    console.log(`Generated ${predictions.length} predictions for user ${user.id}`);

    return new Response(
      JSON.stringify({
        predictions: predictions.slice(0, 20),
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in predict-contact-needs:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
