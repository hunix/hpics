import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeepAnalysisRequest {
  captureId: string;
  analysisMode?: 'full' | 'entities' | 'content' | 'relationships' | 'behavioral';
  forceReanalysis?: boolean;
}

interface EntityExtraction {
  people: Array<{ name: string; context: string; frequency: number; linkedProfileId?: string }>;
  organizations: Array<{ name: string; type?: string; context: string }>;
  products: Array<{ name: string; category?: string; context: string }>;
  events: Array<{ name: string; date?: string; context: string }>;
  locations: Array<{ name: string; type?: string; context: string }>;
}

interface ContentIntelligence {
  themes: Array<{ theme: string; confidence: number; examples: string[] }>;
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral' | 'mixed';
    score: number;
    byTheme: Record<string, number>;
  };
  communicationStyle: {
    tone: string[];
    formality: 'casual' | 'professional' | 'mixed';
    personality: string[];
    engagement: 'high' | 'medium' | 'low';
  };
  keyQuotes: Array<{ quote: string; context: string; significance: string }>;
  languagePatterns: {
    averageLength: number;
    vocabularyRichness: number;
    emojiUsage: number;
    hashtagUsage: number;
  };
}

interface RelationshipMapping {
  frequentMentions: Array<{ username: string; count: number; context: string; relationshipType?: string }>;
  collaborators: Array<{ username: string; collaborationType: string; frequency: number }>;
  communities: Array<{ name: string; engagement: number; topics: string[] }>;
  networkStrength: {
    score: number;
    topConnections: string[];
    networkType: 'tight-knit' | 'broad' | 'mixed';
  };
}

interface BehavioralInsights {
  postingPatterns: {
    frequency: string;
    bestTimes: string[];
    bestDays: string[];
    consistency: number;
  };
  engagementPatterns: {
    responseRate: number;
    responseTime: string;
    initiatesConversations: boolean;
    preferredContentTypes: string[];
  };
  interests: Array<{ topic: string; score: number; evidence: string[] }>;
  personality: {
    traits: string[];
    mbtiEstimate?: string;
    enneagramEstimate?: string;
    confidence: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'deep-analyze-capture', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_AI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
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

    const { captureId, analysisMode = 'full', forceReanalysis = false }: DeepAnalysisRequest = await req.json();

    if (!captureId) {
      return new Response(
        JSON.stringify({ error: 'captureId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the capture
    const { data: capture, error: fetchError } = await supabase
      .from('device_captures')
      .select('*')
      .eq('id', captureId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !capture) {
      return new Response(
        JSON.stringify({ error: 'Capture not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already analyzed
    if (capture.ai_analysis?.deepAnalysis && !forceReanalysis) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already analyzed',
          analysis: capture.ai_analysis.deepAnalysis,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deep analyzing capture ${captureId} with mode: ${analysisMode}`);

    // Get AI config from platform settings
    const aiConfig = await getAIConfig(supabase, user.id);

    const extractedData = capture.extracted_data || {};
    const platform = extractedData.platform || capture.source_app || 'unknown';
    const posts = extractedData.posts || extractedData.rawData?.posts || [];
    const profile = extractedData.profile || extractedData;

    // Prepare content for analysis
    const contentForAnalysis = prepareContentForAnalysis(profile, posts);

    let analysis: any = {};

    // Run analysis passes based on mode
    if (analysisMode === 'full' || analysisMode === 'entities') {
      analysis.entities = await runEntityExtraction(lovableApiKey, platform, contentForAnalysis, aiConfig.speedModel);
    }

    if (analysisMode === 'full' || analysisMode === 'content') {
      analysis.content = await runContentIntelligence(lovableApiKey, platform, contentForAnalysis, aiConfig.speedModel);
    }

    if (analysisMode === 'full' || analysisMode === 'relationships') {
      analysis.relationships = await runRelationshipMapping(lovableApiKey, platform, contentForAnalysis, aiConfig.speedModel);
    }

    if (analysisMode === 'full' || analysisMode === 'behavioral') {
      analysis.behavioral = await runBehavioralInsights(lovableApiKey, platform, contentForAnalysis, posts, aiConfig.defaultModel);
    }

    // Link detected entities to existing profiles
    if (analysis.entities?.people) {
      analysis.entities.people = await linkEntitiesToProfiles(
        supabase, 
        user.id, 
        analysis.entities.people
      );
    }

    // Generate summary and recommendations
    if (analysisMode === 'full') {
      analysis.summary = await generateAnalysisSummary(lovableApiKey, analysis, profile, aiConfig.qualityModel);
    }

    // Update capture with analysis
    const { error: updateError } = await supabase
      .from('device_captures')
      .update({
        ai_analysis: {
          ...(capture.ai_analysis || {}),
          deepAnalysis: analysis,
          deepAnalyzedAt: new Date().toISOString(),
          analysisMode,
        },
        status: 'analyzed',
      })
      .eq('id', captureId);

    if (updateError) {
      console.error('Failed to update capture:', updateError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      function_name: 'deep-analyze-capture',
      model_name: aiConfig.speedModel,
      provider: 'google',
      estimated_cost_cents: 5,
      status: 'completed',
      profile_id: capture.profile_id,
    });

    const duration = Date.now() - startTime;
    console.log(`Deep analysis completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        captureId,
        analysis,
        duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Deep analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============== Analysis Functions ==============

function prepareContentForAnalysis(profile: any, posts: any[]): string {
  const parts: string[] = [];
  
  if (profile.bio) parts.push(`Bio: ${profile.bio}`);
  if (profile.displayName) parts.push(`Display Name: ${profile.displayName}`);
  if (profile.location) parts.push(`Location: ${profile.location}`);
  if (profile.website) parts.push(`Website: ${profile.website}`);
  
  if (posts.length > 0) {
    parts.push(`\nRecent Posts (${posts.length}):`);
    posts.slice(0, 20).forEach((post, i) => {
      const content = post.content || post.caption || post.text || '';
      if (content) {
        parts.push(`[${i + 1}] ${content.substring(0, 500)}`);
        if (post.likes) parts.push(`   Likes: ${post.likes}`);
        if (post.comments) parts.push(`   Comments: ${post.comments}`);
      }
    });
  }
  
  return parts.join('\n');
}

async function runEntityExtraction(apiKey: string, platform: string, content: string, model: string): Promise<EntityExtraction> {
  const response = await fetch('https://ai.lovable.dev/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: `Analyze this ${platform} profile content and extract all entities.

Return JSON:
{
  "people": [{ "name": "...", "context": "how they're mentioned", "frequency": number }],
  "organizations": [{ "name": "...", "type": "company/brand/org", "context": "..." }],
  "products": [{ "name": "...", "category": "...", "context": "..." }],
  "events": [{ "name": "...", "date": "if mentioned", "context": "..." }],
  "locations": [{ "name": "...", "type": "city/country/venue", "context": "..." }]
}

Content:
${content.substring(0, 8000)}`
      }],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) return { people: [], organizations: [], products: [], events: [], locations: [] };

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { people: [], organizations: [], products: [], events: [], locations: [] };
  } catch {
    return { people: [], organizations: [], products: [], events: [], locations: [] };
  }
}

async function runContentIntelligence(apiKey: string, platform: string, content: string, model: string): Promise<ContentIntelligence> {
  const response = await fetch('https://ai.lovable.dev/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: `Analyze the content intelligence of this ${platform} profile.

Return JSON:
{
  "themes": [{ "theme": "...", "confidence": 0.0-1.0, "examples": ["quote1", "quote2"] }],
  "sentiment": {
    "overall": "positive|negative|neutral|mixed",
    "score": -1.0 to 1.0,
    "byTheme": { "theme1": score, ... }
  },
  "communicationStyle": {
    "tone": ["informative", "humorous", "passionate", etc.],
    "formality": "casual|professional|mixed",
    "personality": ["extroverted", "analytical", "creative", etc.],
    "engagement": "high|medium|low"
  },
  "keyQuotes": [{ "quote": "...", "context": "...", "significance": "why it matters" }],
  "languagePatterns": {
    "averageLength": words per post,
    "vocabularyRichness": 0.0-1.0,
    "emojiUsage": emojis per post,
    "hashtagUsage": hashtags per post
  }
}

Content:
${content.substring(0, 8000)}`
      }],
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    return {
      themes: [],
      sentiment: { overall: 'neutral', score: 0, byTheme: {} },
      communicationStyle: { tone: [], formality: 'mixed', personality: [], engagement: 'medium' },
      keyQuotes: [],
      languagePatterns: { averageLength: 0, vocabularyRichness: 0, emojiUsage: 0, hashtagUsage: 0 },
    };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {} as ContentIntelligence;
  } catch {
    return {} as ContentIntelligence;
  }
}

async function runRelationshipMapping(apiKey: string, platform: string, content: string, model: string): Promise<RelationshipMapping> {
  const response = await fetch('https://ai.lovable.dev/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: `Map the relationships evident in this ${platform} profile.

Return JSON:
{
  "frequentMentions": [{ "username": "@...", "count": number, "context": "...", "relationshipType": "friend/colleague/brand/etc" }],
  "collaborators": [{ "username": "@...", "collaborationType": "co-creator/sponsor/etc", "frequency": number }],
  "communities": [{ "name": "...", "engagement": 0-10, "topics": ["..."] }],
  "networkStrength": {
    "score": 0-100,
    "topConnections": ["@user1", "@user2"],
    "networkType": "tight-knit|broad|mixed"
  }
}

Content:
${content.substring(0, 8000)}`
      }],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    return {
      frequentMentions: [],
      collaborators: [],
      communities: [],
      networkStrength: { score: 0, topConnections: [], networkType: 'mixed' },
    };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {} as RelationshipMapping;
  } catch {
    return {} as RelationshipMapping;
  }
}

async function runBehavioralInsights(apiKey: string, platform: string, content: string, posts: any[], model: string): Promise<BehavioralInsights> {
  // Calculate posting patterns from timestamps
  const timestamps = posts
    .filter(p => p.timestamp)
    .map(p => new Date(p.timestamp));
  
  const dayDistribution: Record<string, number> = {};
  const hourDistribution: Record<number, number> = {};
  
  timestamps.forEach(t => {
    const day = t.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = t.getHours();
    dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
  });
  
  const bestDays = Object.entries(dayDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => day);
    
  const bestHours = Object.entries(hourDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  const response = await fetch('https://ai.lovable.dev/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: `Analyze behavioral patterns from this ${platform} profile.

Return JSON:
{
  "postingPatterns": {
    "frequency": "daily|few times a week|weekly|sporadic",
    "bestTimes": ${JSON.stringify(bestHours)},
    "bestDays": ${JSON.stringify(bestDays)},
    "consistency": 0.0-1.0
  },
  "engagementPatterns": {
    "responseRate": 0.0-1.0,
    "responseTime": "quick|moderate|slow",
    "initiatesConversations": true|false,
    "preferredContentTypes": ["photos", "videos", "text", etc.]
  },
  "interests": [{ "topic": "...", "score": 0-10, "evidence": ["posts about..."] }],
  "personality": {
    "traits": ["creative", "analytical", etc.],
    "mbtiEstimate": "INFP" or null,
    "enneagramEstimate": "Type 4" or null,
    "confidence": 0.0-1.0
  }
}

Content (${posts.length} posts):
${content.substring(0, 8000)}`
      }],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    return {
      postingPatterns: { frequency: 'unknown', bestTimes: bestHours, bestDays, consistency: 0 },
      engagementPatterns: { responseRate: 0, responseTime: 'unknown', initiatesConversations: false, preferredContentTypes: [] },
      interests: [],
      personality: { traits: [], confidence: 0 },
    };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {} as BehavioralInsights;
  } catch {
    return {} as BehavioralInsights;
  }
}

async function linkEntitiesToProfiles(supabase: any, userId: string, people: any[]): Promise<any[]> {
  if (!people || people.length === 0) return [];

  const names = people.map(p => p.name).filter(Boolean);
  
  // Search for matching profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('user_id', userId)
    .limit(100);

  if (!profiles) return people;

  return people.map(person => {
    const match = profiles.find((p: any) => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase();
      return fullName === person.name.toLowerCase() ||
             (p.first_name && person.name.toLowerCase().includes(p.first_name.toLowerCase()));
    });
    
    return match ? { ...person, linkedProfileId: match.id } : person;
  });
}

async function generateAnalysisSummary(apiKey: string, analysis: any, profile: any, model: string): Promise<any> {
  const response = await fetch('https://ai.lovable.dev/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: `Generate a comprehensive summary from this social profile analysis.

Analysis Data:
${JSON.stringify(analysis, null, 2).substring(0, 6000)}

Return JSON:
{
  "executiveSummary": "2-3 sentence overview",
  "keyInsights": ["insight 1", "insight 2", ...],
  "suggestedActions": ["action 1", "action 2", ...],
  "riskFactors": ["any concerns or red flags"],
  "opportunities": ["potential opportunities for engagement"],
  "compatibilityScore": 0-100 (how valuable this contact might be),
  "confidenceLevel": "high|medium|low"
}`
      }],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}
