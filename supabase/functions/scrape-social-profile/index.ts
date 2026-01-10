import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialProfileData {
  platform: string;
  username: string;
  displayName?: string;
  bio?: string;
  profilePicUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  website?: string;
  location?: string;
  category?: string;
  recentPosts?: Array<{
    content?: string;
    likes?: number;
    comments?: number;
    date?: string;
    mediaType?: string;
  }>;
  highlights?: string[];
  linkedAccounts?: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      profileUrl, 
      platform,
      profileId,
      captureId,
      includeRecentPosts = true,
      maxPosts = 10
    } = await req.json();

    if (!profileUrl) {
      return new Response(JSON.stringify({ error: 'Profile URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[scrape-social-profile] Scraping ${profileUrl} for user ${user.id}`);

    // Detect platform from URL
    const detectedPlatform = platform || detectPlatform(profileUrl);
    
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ 
        error: 'Firecrawl not configured. Please connect Firecrawl in Settings → Connectors.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update capture status if provided
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({ status: 'processing', processing_started_at: new Date().toISOString() })
        .eq('id', captureId);
    }

    // Use Firecrawl to scrape the profile page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: profileUrl,
        formats: ['markdown', 'html', 'screenshot'],
        onlyMainContent: false,
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error('[scrape-social-profile] Firecrawl error:', errText);
      throw new Error(`Firecrawl scraping failed: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot;

    console.log(`[scrape-social-profile] Scraped ${markdown.length} chars of content`);

    // Use AI to extract structured profile data from the scraped content
    const extractionPrompt = `Analyze this ${detectedPlatform} profile page content and extract structured data.

PAGE CONTENT:
${markdown.substring(0, 15000)}

EXTRACT THE FOLLOWING DATA:
- Username/handle
- Display name
- Bio/description
- Followers count
- Following count
- Posts/threads count
- Is verified (blue check)
- Is private account
- Website link if any
- Location if mentioned
- Category/type (personal, business, creator)
- Recent posts (up to ${maxPosts}): content preview, likes, comments, date
- Story highlights names
- Any linked accounts mentioned

Return as JSON with these exact fields:
{
  "platform": "${detectedPlatform}",
  "username": "",
  "displayName": "",
  "bio": "",
  "followersCount": null,
  "followingCount": null,
  "postsCount": null,
  "isVerified": false,
  "isPrivate": false,
  "website": "",
  "location": "",
  "category": "",
  "recentPosts": [],
  "highlights": [],
  "linkedAccounts": [],
  "confidence": 0.0-1.0
}`;

    const model = selectModel('balanced', 'google');
    
    const aiResponse = await callAI({
      model,
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert at extracting structured data from social media profiles. Be accurate and only include data you can clearly identify.' 
        },
        { role: 'user', content: extractionPrompt }
      ],
      userId: user.id,
      functionName: 'scrape-social-profile',
      profileId,
      temperature: 0.2,
      maxTokens: 4000,
      metadata: { platform: detectedPlatform, url: profileUrl }
    });

    const extractedData = parseAIJson<SocialProfileData>(aiResponse.content, {
      platform: detectedPlatform,
      username: '',
      confidence: 0.3
    });

    // Store screenshot if available
    let screenshotUrl: string | undefined;
    if (screenshot) {
      try {
        const screenshotBuffer = Uint8Array.from(atob(screenshot), c => c.charCodeAt(0));
        const fileName = `social-profiles/${user.id}/${Date.now()}-${detectedPlatform}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, screenshotBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.warn('[scrape-social-profile] Screenshot storage failed:', e);
      }
    }

    // Update device capture with results
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({
          status: 'review',
          extracted_data: extractedData,
          confidence_score: extractedData.confidence,
          processing_completed_at: new Date().toISOString(),
          file_urls: screenshotUrl ? [screenshotUrl] : [],
          ai_analysis: {
            model: aiResponse.model,
            tokensUsed: aiResponse.totalTokens,
            costCents: aiResponse.costCents,
            rawContentLength: markdown.length,
          }
        })
        .eq('id', captureId);
    }

    // Log device sync
    await supabase.from('device_sync_log').insert({
      user_id: user.id,
      device_id: `web-scraper-${Date.now()}`,
      device_type: 'web_scraper',
      sync_type: 'screenshot',
      metadata: {
        platform: detectedPlatform,
        url: profileUrl,
        username: extractedData.username,
        postsScraped: extractedData.recentPosts?.length || 0,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      platform: detectedPlatform,
      data: extractedData,
      screenshotUrl,
      rawContentLength: markdown.length,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[scrape-social-profile] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to scrape profile' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('threads.net')) return 'threads';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return 'facebook';
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('youtube.com')) return 'youtube';
  if (lowerUrl.includes('github.com')) return 'github';
  return 'unknown';
}
