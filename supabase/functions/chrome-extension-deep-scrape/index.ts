import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      platform,
      profileUrl,
      scrapedData,
      scrapeType = 'comprehensive',
      userId 
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Process scraped data with AI for deep analysis
    const systemPrompt = `You are a social media intelligence processor. Analyze the scraped profile data and extract:
    
    1. IDENTITY INTELLIGENCE:
    - Full name variants
    - Username patterns
    - Bio keywords and interests
    - Profile picture analysis description
    - Verification status
    - Account age indicators
    
    2. BEHAVIORAL FINGERPRINT:
    - Posting frequency patterns
    - Peak activity times
    - Content type preferences
    - Engagement patterns
    - Hashtag usage patterns
    - Mention patterns
    
    3. NETWORK INTELLIGENCE:
    - Follower/following ratio analysis
    - Key connections visible
    - Interaction patterns with others
    - Community affiliations
    - Influencer relationships
    
    4. CONTENT INTELLIGENCE:
    - Topic interests from posts
    - Sentiment patterns
    - Language patterns
    - Media preferences
    - Story/highlight themes
    
    5. TEMPORAL PATTERNS:
    - Activity schedule
    - Content timing patterns
    - Engagement response times
    - Posting consistency
    
    6. CROSS-PLATFORM INDICATORS:
    - Links to other platforms
    - Username consistency
    - Cross-posting patterns
    - Multi-platform presence signals
    
    Return JSON with structure:
    {
      "identity": {
        "displayName": string,
        "username": string,
        "nameVariants": string[],
        "bioKeywords": string[],
        "interests": string[],
        "verified": boolean,
        "accountAgeEstimate": string,
        "profileImageDescription": string
      },
      "behavioralFingerprint": {
        "postingFrequency": string,
        "peakActivityTimes": string[],
        "contentPreferences": string[],
        "engagementStyle": string,
        "hashtagPatterns": string[],
        "mentionBehavior": string
      },
      "networkIntelligence": {
        "followerCount": number,
        "followingCount": number,
        "ffRatioAnalysis": string,
        "keyConnections": [{ "username": string, "relationship": string }],
        "communityAffiliations": string[],
        "influenceScore": number
      },
      "contentIntelligence": {
        "topTopics": string[],
        "sentimentProfile": string,
        "languagePatterns": string[],
        "mediaPreferences": string[],
        "storyThemes": string[]
      },
      "temporalPatterns": {
        "typicalActiveHours": string[],
        "postingSchedule": string,
        "responseLatency": string,
        "consistencyScore": number
      },
      "crossPlatformLinks": {
        "linkedPlatforms": string[],
        "usernameConsistency": boolean,
        "crossPostingDetected": boolean
      },
      "intelligenceSummary": string,
      "confidenceScore": number,
      "dataQuality": string
    }`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Platform: ${platform}\nProfile URL: ${profileUrl}\nScrape Type: ${scrapeType}\n\nScraped Data:\n${JSON.stringify(scrapedData, null, 2)}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let processedIntelligence;
    try {
      processedIntelligence = JSON.parse(content);
    } catch {
      processedIntelligence = { rawAnalysis: content, parseError: true };
    }

    // Store the scraped data for future reference
    if (userId) {
      await supabase.from('social_scrape_cache').upsert({
        user_id: userId,
        platform,
        profile_url: profileUrl,
        scraped_data: scrapedData,
        processed_intelligence: processedIntelligence,
        scrape_type: scrapeType,
        scraped_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,profile_url'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      platform,
      profileUrl,
      intelligence: processedIntelligence,
      rawDataPreserved: true,
      processedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chrome extension deep scrape error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
