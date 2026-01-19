import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  try {
    const body = await req.clone().json();
    if (body?.healthCheck === true) {
      return new Response(JSON.stringify({ ok: true, function: 'aggregate-media-intelligence', timestamp: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch { /* not JSON or no body - continue normally */ }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    let userId: string;
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Session expired' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    } catch {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, tier = 'standard' } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all analyzed media for this contact
    const allMedia: any[] = [];
    let offset = 0;
    const batchSize = 500;

    while (true) {
      const { data, error } = await supabase
        .from('media')
        .select('id, ai_metadata, mime_type, created_at, caption')
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .eq('ai_generation_status', 'completed')
        .not('ai_metadata', 'is', null)
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allMedia.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }

    console.log(`Aggregating intelligence from ${allMedia.length} analyzed media files`);

    // Extract and aggregate intelligence from all media
    const peopleNetwork: Map<string, { count: number; contexts: string[] }> = new Map();
    const locations: Map<string, { count: number; dates: string[] }> = new Map();
    const activities: Map<string, number> = new Map();
    const interests: Map<string, number> = new Map();
    const emotions: { date: string; emotion: string; intensity: number }[] = [];
    const wealthIndicators: string[] = [];
    const professionCues: string[] = [];
    const redFlags: string[] = [];
    const certainties: string[] = [];
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    for (const media of allMedia) {
      const metadata = media.ai_metadata;
      if (!metadata) continue;

      const mediaDate = new Date(media.created_at);
      if (!earliestDate || mediaDate < earliestDate) earliestDate = mediaDate;
      if (!latestDate || mediaDate > latestDate) latestDate = mediaDate;

      // People detection
      if (metadata.people?.faces) {
        for (const face of metadata.people.faces) {
          const key = face.estimated_age_range && face.estimated_gender 
            ? `${face.estimated_gender}_${face.estimated_age_range}`
            : 'unknown';
          const existing = peopleNetwork.get(key) || { count: 0, contexts: [] };
          existing.count++;
          if (metadata.activity_analysis?.event_type) {
            existing.contexts.push(metadata.activity_analysis.event_type);
          }
          peopleNetwork.set(key, existing);
        }
      }

      // Location extraction
      if (metadata.location_analysis) {
        const loc = metadata.location_analysis;
        const locationKey = loc.city_suggested || loc.country_suggested || loc.environment || 'unknown';
        if (locationKey !== 'unknown') {
          const existing = locations.get(locationKey) || { count: 0, dates: [] };
          existing.count++;
          existing.dates.push(media.created_at);
          locations.set(locationKey, existing);
        }
      }

      // Activities
      if (metadata.activity_analysis?.primary_activity) {
        const activity = metadata.activity_analysis.primary_activity;
        activities.set(activity, (activities.get(activity) || 0) + 1);
      }
      if (metadata.activity_analysis?.hobbies_indicated) {
        for (const hobby of metadata.activity_analysis.hobbies_indicated) {
          interests.set(hobby, (interests.get(hobby) || 0) + 1);
        }
      }

      // Interests from intelligence section
      if (metadata.intelligence?.interests_revealed) {
        for (const interest of metadata.intelligence.interests_revealed) {
          interests.set(interest, (interests.get(interest) || 0) + 1);
        }
      }

      // Wealth indicators
      if (metadata.intelligence?.wealth_indicators) {
        wealthIndicators.push(...metadata.intelligence.wealth_indicators);
      }
      if (metadata.objects?.luxury_items) {
        wealthIndicators.push(...metadata.objects.luxury_items);
      }

      // Profession cues
      if (metadata.intelligence?.profession_cues) {
        professionCues.push(...metadata.intelligence.profession_cues);
      }

      // Emotional state from faces
      if (metadata.people?.faces) {
        for (const face of metadata.people.faces) {
          if (face.emotion) {
            emotions.push({
              date: media.created_at,
              emotion: face.emotion,
              intensity: face.is_primary_subject ? 1.0 : 0.5
            });
          }
        }
      }

      // Content flags for red flags
      if (metadata.content_flags?.is_sensitive) {
        redFlags.push(`Sensitive content detected in ${metadata.content_flags.sensitivity_type?.join(', ') || 'media'}`);
      }
    }

    // Build certainties from high-count patterns
    const topActivities = Array.from(activities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [activity, count] of topActivities) {
      if (count >= 5) {
        certainties.push(`Frequently engages in: ${activity} (${count} occurrences)`);
      }
    }

    const topLocations = Array.from(locations.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
    
    for (const [location, data] of topLocations) {
      if (data.count >= 3) {
        certainties.push(`Regular presence at: ${location} (${data.count} media files)`);
      }
    }

    // Build aggregation result
    const aggregationResult = {
      generated_at: new Date().toISOString(),
      tier,
      media_analyzed: allMedia.length,
      
      people_network: {
        unique_people: peopleNetwork.size,
        demographics: Array.from(peopleNetwork.entries()).map(([key, data]) => ({
          demographic: key,
          count: data.count,
          contexts: [...new Set(data.contexts)].slice(0, 5)
        }))
      },
      
      location_timeline: {
        unique_locations: locations.size,
        date_range: earliestDate && latestDate 
          ? `${earliestDate.toLocaleDateString()} - ${latestDate.toLocaleDateString()}`
          : null,
        locations: Array.from(locations.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .map(([name, data]) => ({
            name,
            count: data.count,
            first_seen: data.dates.sort()[0],
            last_seen: data.dates.sort().reverse()[0]
          }))
      },
      
      activity_patterns: Array.from(activities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([activity, count]) => ({ activity, count })),
      
      interests: Array.from(interests.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([interest]) => interest),
      
      emotional_profile: {
        emotions_detected: emotions.length,
        emotion_distribution: emotions.reduce((acc, e) => {
          acc[e.emotion] = (acc[e.emotion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      
      wealth_lifestyle: {
        indicators: [...new Set(wealthIndicators)].slice(0, 10),
        profession_cues: [...new Set(professionCues)].slice(0, 10)
      },
      
      temporal_analysis: {
        earliest_media: earliestDate?.toISOString(),
        latest_media: latestDate?.toISOString(),
        date_range: earliestDate && latestDate
          ? `${Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))} days`
          : null
      },
      
      certainties,
      red_flags: [...new Set(redFlags)],
      yellow_flags: [] as string[]
    };

    // Store the aggregation result
    const { error: updateError } = await supabase
      .from('ai_analyses')
      .upsert({
        user_id: userId,
        profile_id: profileId,
        analysis_type: 'media_intelligence_aggregation',
        result: aggregationResult,
        generated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,profile_id,analysis_type'
      });

    if (updateError) {
      console.error('Error storing aggregation:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      aggregation: aggregationResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Aggregation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
