import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsSource {
  name: string;
  credibility: number;
  fetchFn: (query: string, apiKey?: string) => Promise<RawNewsItem[]>;
}

interface RawNewsItem {
  title: string;
  content?: string;
  url?: string;
  publishedAt?: string;
  source: string;
}

interface ProcessedNewsItem {
  title: string;
  content?: string;
  summary?: string;
  source_name: string;
  source_url?: string;
  published_at?: string;
  entities: any[];
  sectors: string[];
  regions: string[];
  topics: string[];
  tickers: string[];
  sentiment_score: number;
  sentiment_label: string;
  sentiment_confidence: number;
  source_credibility_score: number;
  impact_score: number;
  urgency_level: string;
}

// Source credibility scores (0-1)
const SOURCE_CREDIBILITY: Record<string, number> = {
  'Reuters': 0.95,
  'Bloomberg': 0.93,
  'WSJ': 0.90,
  'Financial Times': 0.92,
  'AP News': 0.94,
  'BBC': 0.88,
  'CNBC': 0.82,
  'The Economist': 0.91,
  'NewsAPI': 0.75,
  'Tavily': 0.80,
  'default': 0.70,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, query, topics, sectors, regions, profileId, limit = 50 } = await req.json();

    switch (action) {
      case 'fetch_news':
        return await fetchAndProcessNews(supabase, user.id, query, topics, sectors, regions, limit);
      
      case 'correlate_news':
        return await correlateNews(supabase, user.id);
      
      case 'generate_signals':
        return await generateSignals(supabase, user.id);
      
      case 'track_geopolitical':
        return await trackGeopoliticalEvents(supabase, user.id);
      
      case 'snapshot_sentiment':
        return await snapshotSentiment(supabase, user.id);
      
      case 'correlate_contacts':
        return await correlateWithContacts(supabase, user.id, profileId);
      
      case 'full_pipeline':
        // Run the complete intelligence pipeline
        await fetchAndProcessNews(supabase, user.id, query, topics, sectors, regions, limit);
        await correlateNews(supabase, user.id);
        await generateSignals(supabase, user.id);
        await trackGeopoliticalEvents(supabase, user.id);
        await snapshotSentiment(supabase, user.id);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Full intelligence pipeline completed' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Economic intelligence engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchAndProcessNews(
  supabase: any,
  userId: string,
  query?: string,
  topics?: string[],
  sectors?: string[],
  regions?: string[],
  limit: number = 50
) {
  const newsApiKey = Deno.env.get('NEWS_API_KEY');
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const allNews: RawNewsItem[] = [];
  
  // Build search query
  const searchQuery = query || buildSearchQuery(topics, sectors, regions);
  
  // Fetch from NewsAPI if available
  if (newsApiKey) {
    try {
      const newsApiResponse = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&pageSize=${limit}&language=en`,
        { headers: { 'X-Api-Key': newsApiKey } }
      );
      const newsApiData = await newsApiResponse.json();
      if (newsApiData.articles) {
        allNews.push(...newsApiData.articles.map((a: any) => ({
          title: a.title,
          content: a.content || a.description,
          url: a.url,
          publishedAt: a.publishedAt,
          source: a.source?.name || 'NewsAPI',
        })));
      }
    } catch (e) {
      console.error('NewsAPI fetch error:', e);
    }
  }
  
  // Fetch from Tavily if available
  if (tavilyApiKey) {
    try {
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: searchQuery,
          search_depth: 'advanced',
          include_answer: true,
          max_results: Math.min(limit, 20),
        }),
      });
      const tavilyData = await tavilyResponse.json();
      if (tavilyData.results) {
        allNews.push(...tavilyData.results.map((r: any) => ({
          title: r.title,
          content: r.content,
          url: r.url,
          publishedAt: new Date().toISOString(),
          source: 'Tavily',
        })));
      }
    } catch (e) {
      console.error('Tavily fetch error:', e);
    }
  }
  
  if (allNews.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No news sources available or no results found',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  // Process news with AI
  const processedNews = await processNewsWithAI(allNews, lovableApiKey);
  
  // Store in database
  const { data, error } = await supabase
    .from('news_intelligence_items')
    .insert(processedNews.map(item => ({
      user_id: userId,
      ...item,
      processing_status: 'completed',
      processed_at: new Date().toISOString(),
    })))
    .select();
  
  if (error) {
    console.error('Error storing news:', error);
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    count: data?.length || 0,
    items: data 
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function processNewsWithAI(news: RawNewsItem[], apiKey?: string): Promise<ProcessedNewsItem[]> {
  if (!apiKey || news.length === 0) {
    // Return basic processing without AI
    return news.map(item => ({
      title: item.title,
      content: item.content,
      source_name: item.source,
      source_url: item.url,
      published_at: item.publishedAt,
      entities: [],
      sectors: [],
      regions: [],
      topics: [],
      tickers: [],
      sentiment_score: 0,
      sentiment_label: 'neutral',
      sentiment_confidence: 0.5,
      source_credibility_score: SOURCE_CREDIBILITY[item.source] || SOURCE_CREDIBILITY['default'],
      impact_score: 0.5,
      urgency_level: 'normal',
    }));
  }
  
  const processed: ProcessedNewsItem[] = [];
  
  // Process in batches of 5
  for (let i = 0; i < news.length; i += 5) {
    const batch = news.slice(i, i + 5);
    
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a financial news analyst. Analyze each news item and extract:
1. Entities (companies, people, organizations, locations)
2. Affected sectors (technology, energy, finance, healthcare, etc.)
3. Affected regions (USA, Europe, Asia, Middle East, etc.)
4. Topics (war, politics, economy, earnings, regulations, etc.)
5. Stock tickers mentioned
6. Sentiment score (-1 to +1)
7. Market impact score (0 to 1)
8. Urgency level (critical, high, normal, low)`
            },
            {
              role: 'user',
              content: `Analyze these news items:\n${JSON.stringify(batch.map(n => ({ title: n.title, content: n.content?.substring(0, 500) })))}`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'analyze_news_batch',
              description: 'Analyze a batch of news items',
              parameters: {
                type: 'object',
                properties: {
                  analyses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        index: { type: 'number' },
                        entities: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' } } } },
                        sectors: { type: 'array', items: { type: 'string' } },
                        regions: { type: 'array', items: { type: 'string' } },
                        topics: { type: 'array', items: { type: 'string' } },
                        tickers: { type: 'array', items: { type: 'string' } },
                        sentiment_score: { type: 'number' },
                        impact_score: { type: 'number' },
                        urgency_level: { type: 'string' },
                        summary: { type: 'string' }
                      },
                      required: ['index', 'entities', 'sectors', 'regions', 'topics', 'sentiment_score', 'impact_score', 'urgency_level']
                    }
                  }
                },
                required: ['analyses']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'analyze_news_batch' } }
        }),
      });
      
      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall) {
        const analyses = JSON.parse(toolCall.function.arguments).analyses;
        
        for (const analysis of analyses) {
          const original = batch[analysis.index];
          if (original) {
            processed.push({
              title: original.title,
              content: original.content,
              summary: analysis.summary,
              source_name: original.source,
              source_url: original.url,
              published_at: original.publishedAt,
              entities: analysis.entities || [],
              sectors: analysis.sectors || [],
              regions: analysis.regions || [],
              topics: analysis.topics || [],
              tickers: analysis.tickers || [],
              sentiment_score: analysis.sentiment_score,
              sentiment_label: analysis.sentiment_score > 0.2 ? 'positive' : analysis.sentiment_score < -0.2 ? 'negative' : 'neutral',
              sentiment_confidence: 0.85,
              source_credibility_score: SOURCE_CREDIBILITY[original.source] || SOURCE_CREDIBILITY['default'],
              impact_score: analysis.impact_score,
              urgency_level: analysis.urgency_level,
            });
          }
        }
      }
    } catch (e) {
      console.error('AI processing error:', e);
      // Fall back to basic processing for this batch
      for (const item of batch) {
        processed.push({
          title: item.title,
          content: item.content,
          source_name: item.source,
          source_url: item.url,
          published_at: item.publishedAt,
          entities: [],
          sectors: [],
          regions: [],
          topics: [],
          tickers: [],
          sentiment_score: 0,
          sentiment_label: 'neutral',
          sentiment_confidence: 0.5,
          source_credibility_score: SOURCE_CREDIBILITY[item.source] || SOURCE_CREDIBILITY['default'],
          impact_score: 0.5,
          urgency_level: 'normal',
        });
      }
    }
  }
  
  return processed;
}

function buildSearchQuery(topics?: string[], sectors?: string[], regions?: string[]): string {
  const parts: string[] = [];
  
  if (topics?.length) {
    parts.push(topics.join(' OR '));
  }
  if (sectors?.length) {
    parts.push(sectors.join(' OR '));
  }
  if (regions?.length) {
    parts.push(regions.join(' OR '));
  }
  
  if (parts.length === 0) {
    return 'finance market economy investment stocks crypto';
  }
  
  return parts.join(' ');
}

async function correlateNews(supabase: any, userId: string) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  // Get recent uncorrelated news (last 24 hours)
  const { data: recentNews, error } = await supabase
    .from('news_intelligence_items')
    .select('*')
    .eq('user_id', userId)
    .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('fetched_at', { ascending: false })
    .limit(100);
  
  if (error || !recentNews?.length) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No news to correlate',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  // Group by topics using AI
  if (!lovableApiKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'AI API key required for correlation' 
    }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a news correlation analyst. Group related news items by topic and identify:
1. Topic clusters (news about the same event/topic)
2. Conflicting narratives between sources
3. Validated facts (reported by multiple credible sources)
4. Disputed claims (contradictions between sources)`
          },
          {
            role: 'user',
            content: `Correlate these news items:\n${JSON.stringify(recentNews.map((n: any) => ({
              id: n.id,
              title: n.title,
              source: n.source_name,
              topics: n.topics,
              sentiment: n.sentiment_score
            })))}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_correlations',
            description: 'Create news correlations',
            parameters: {
              type: 'object',
              properties: {
                correlations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      topic_summary: { type: 'string' },
                      news_ids: { type: 'array', items: { type: 'string' } },
                      sources: { type: 'array', items: { type: 'string' } },
                      narrative_consistency: { type: 'number' },
                      conflicting_claims: { type: 'array', items: { type: 'object', properties: { claim1: { type: 'string' }, claim2: { type: 'string' } } } },
                      validated_facts: { type: 'array', items: { type: 'string' } },
                      disputed_claims: { type: 'array', items: { type: 'string' } },
                      consensus_sentiment: { type: 'number' },
                      combined_impact_score: { type: 'number' }
                    },
                    required: ['topic_summary', 'news_ids', 'sources', 'narrative_consistency']
                  }
                }
              },
              required: ['correlations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_correlations' } }
      }),
    });
    
    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      const correlations = JSON.parse(toolCall.function.arguments).correlations;
      
      const toInsert = correlations.map((c: any) => ({
        user_id: userId,
        topic_hash: btoa(c.topic_summary.substring(0, 50)),
        topic_summary: c.topic_summary,
        news_item_ids: c.news_ids,
        source_count: c.sources.length,
        sources: c.sources,
        correlation_confidence: Math.min(c.sources.length / 5, 1),
        narrative_consistency: c.narrative_consistency,
        conflicting_claims: c.conflicting_claims || [],
        validated_facts: c.validated_facts || [],
        disputed_claims: c.disputed_claims || [],
        consensus_sentiment: c.consensus_sentiment,
        combined_impact_score: c.combined_impact_score,
        first_reported_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      
      const { data, error: insertError } = await supabase
        .from('news_correlations')
        .insert(toInsert)
        .select();
      
      if (insertError) {
        console.error('Error inserting correlations:', insertError);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        count: data?.length || 0 
      }), {
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Correlation error:', e);
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Correlation failed' 
  }), {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function generateSignals(supabase: any, userId: string) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  // Get recent correlations
  const { data: correlations, error } = await supabase
    .from('news_correlations')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('combined_impact_score', { ascending: false })
    .limit(20);
  
  if (error || !correlations?.length || !lovableApiKey) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No correlations to generate signals from',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a quantitative investment analyst. Based on news correlations, generate trading/investment signals:
1. Identify assets affected by the news (stocks, crypto, commodities, forex)
2. Determine signal type (buy, sell, hold, watch, avoid)
3. Estimate expected direction and magnitude
4. Assess risk level and provide stop-loss suggestions
5. Set time horizon (immediate, short <1week, medium 1-4weeks, long >1month)`
          },
          {
            role: 'user',
            content: `Generate investment signals from these news correlations:\n${JSON.stringify(correlations)}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_signals',
            description: 'Generate investment signals',
            parameters: {
              type: 'object',
              properties: {
                signals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      correlation_id: { type: 'string' },
                      signal_type: { type: 'string', enum: ['buy', 'sell', 'hold', 'watch', 'avoid'] },
                      asset_class: { type: 'string', enum: ['stocks', 'crypto', 'commodities', 'forex', 'bonds'] },
                      asset_identifier: { type: 'string' },
                      sector: { type: 'string' },
                      signal_strength: { type: 'number' },
                      confidence_score: { type: 'number' },
                      expected_direction: { type: 'string', enum: ['up', 'down', 'volatile'] },
                      expected_magnitude: { type: 'string', enum: ['small', 'medium', 'large', 'extreme'] },
                      time_horizon: { type: 'string', enum: ['immediate', 'short', 'medium', 'long'] },
                      expected_roi_low: { type: 'number' },
                      expected_roi_high: { type: 'number' },
                      risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'extreme'] },
                      risk_factors: { type: 'array', items: { type: 'string' } },
                      stop_loss_pct: { type: 'number' },
                      reasoning: { type: 'string' }
                    },
                    required: ['signal_type', 'asset_class', 'signal_strength', 'confidence_score', 'expected_direction', 'risk_level', 'time_horizon']
                  }
                }
              },
              required: ['signals']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_signals' } }
      }),
    });
    
    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      const signals = JSON.parse(toolCall.function.arguments).signals;
      
      const toInsert = signals.map((s: any) => ({
        user_id: userId,
        correlation_id: s.correlation_id,
        signal_type: s.signal_type,
        asset_class: s.asset_class,
        asset_identifier: s.asset_identifier,
        sector: s.sector,
        signal_strength: s.signal_strength,
        confidence_score: s.confidence_score,
        source_count: 1,
        expected_direction: s.expected_direction,
        expected_magnitude: s.expected_magnitude,
        time_horizon: s.time_horizon,
        expected_roi_low: s.expected_roi_low,
        expected_roi_high: s.expected_roi_high,
        risk_level: s.risk_level,
        risk_factors: s.risk_factors || [],
        stop_loss_suggestion: s.stop_loss_pct,
        supporting_news: [{ reasoning: s.reasoning }],
        status: 'active',
        valid_until: new Date(Date.now() + (s.time_horizon === 'immediate' ? 24 : s.time_horizon === 'short' ? 7 * 24 : 30 * 24) * 60 * 60 * 1000).toISOString(),
      }));
      
      const { data, error: insertError } = await supabase
        .from('news_signals')
        .insert(toInsert)
        .select();
      
      if (insertError) {
        console.error('Error inserting signals:', insertError);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        signals: data 
      }), {
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Signal generation error:', e);
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Signal generation failed' 
  }), {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function trackGeopoliticalEvents(supabase: any, userId: string) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  // Get recent news with geopolitical topics
  const { data: geoNews, error } = await supabase
    .from('news_intelligence_items')
    .select('*')
    .eq('user_id', userId)
    .overlaps('topics', ['war', 'conflict', 'politics', 'sanctions', 'election', 'coup', 'trade_war'])
    .gte('fetched_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .limit(50);
  
  if (error || !geoNews?.length || !lovableApiKey) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No geopolitical news to track',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a geopolitical analyst. Identify and track geopolitical events from news:
1. Event type (war, election, sanctions, trade_dispute, coup, natural_disaster)
2. Status (developing, ongoing, escalating, de-escalating, resolved)
3. Affected regions and countries
4. Key actors (leaders, organizations, countries)
5. Market implications (affected sectors, commodities, currencies)
6. Investment opportunities and risks`
          },
          {
            role: 'user',
            content: `Identify geopolitical events from this news:\n${JSON.stringify(geoNews.map((n: any) => ({
              title: n.title,
              summary: n.summary,
              regions: n.regions,
              topics: n.topics
            })))}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'track_events',
            description: 'Track geopolitical events',
            parameters: {
              type: 'object',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      event_name: { type: 'string' },
                      event_type: { type: 'string' },
                      status: { type: 'string' },
                      severity_level: { type: 'string' },
                      regions: { type: 'array', items: { type: 'string' } },
                      countries: { type: 'array', items: { type: 'string' } },
                      summary: { type: 'string' },
                      key_actors: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' } } } },
                      affected_sectors: { type: 'array', items: { type: 'object', properties: { sector: { type: 'string' }, impact: { type: 'string' } } } },
                      affected_commodities: { type: 'array', items: { type: 'object', properties: { commodity: { type: 'string' }, impact: { type: 'string' } } } },
                      investment_implications: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, asset: { type: 'string' }, reasoning: { type: 'string' } } } },
                      opportunity_score: { type: 'number' },
                      risk_score: { type: 'number' }
                    },
                    required: ['event_name', 'event_type', 'status', 'regions', 'countries']
                  }
                }
              },
              required: ['events']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'track_events' } }
      }),
    });
    
    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      const events = JSON.parse(toolCall.function.arguments).events;
      
      // Upsert events (update existing or insert new)
      for (const event of events) {
        const { data: existing } = await supabase
          .from('geopolitical_events')
          .select('id')
          .eq('user_id', userId)
          .ilike('event_name', `%${event.event_name.substring(0, 20)}%`)
          .single();
        
        if (existing) {
          await supabase
            .from('geopolitical_events')
            .update({
              user_id: userId,
              event_name: event.event_name,
              event_type: event.event_type,
              status: event.status,
              severity_level: event.severity_level,
              regions: event.regions,
              countries: event.countries,
              summary: event.summary,
              key_actors: event.key_actors || [],
              affected_sectors: event.affected_sectors || [],
              affected_commodities: event.affected_commodities || [],
              investment_implications: event.investment_implications || [],
              opportunity_score: event.opportunity_score,
              risk_score: event.risk_score,
              news_item_count: geoNews.length,
              last_news_at: new Date().toISOString(),
              monitoring_priority: event.severity_level === 'critical' ? 'high' : 'normal',
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('geopolitical_events')
            .insert({
              user_id: userId,
              event_name: event.event_name,
              event_type: event.event_type,
              status: event.status,
              severity_level: event.severity_level,
              regions: event.regions,
              countries: event.countries,
              summary: event.summary,
              key_actors: event.key_actors || [],
              affected_sectors: event.affected_sectors || [],
              affected_commodities: event.affected_commodities || [],
              investment_implications: event.investment_implications || [],
              opportunity_score: event.opportunity_score,
              risk_score: event.risk_score,
              news_item_count: geoNews.length,
              last_news_at: new Date().toISOString(),
              monitoring_priority: event.severity_level === 'critical' ? 'high' : 'normal',
              started_at: new Date().toISOString(),
            });
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        count: events.length 
      }), {
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Geopolitical tracking error:', e);
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Geopolitical tracking failed' 
  }), {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function snapshotSentiment(supabase: any, userId: string) {
  // Get recent news for sentiment aggregation
  const { data: recentNews, error } = await supabase
    .from('news_intelligence_items')
    .select('*')
    .eq('user_id', userId)
    .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  if (error || !recentNews?.length) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No news for sentiment snapshot',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  // Aggregate sentiments
  const sectorSentiments: Record<string, { sum: number; count: number }> = {};
  const regionalSentiments: Record<string, { sum: number; count: number }> = {};
  
  let totalSentiment = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const item of recentNews) {
    totalSentiment += item.sentiment_score || 0;
    if ((item.sentiment_score || 0) > 0.2) positiveCount++;
    if ((item.sentiment_score || 0) < -0.2) negativeCount++;
    
    for (const sector of (item.sectors || [])) {
      if (!sectorSentiments[sector]) sectorSentiments[sector] = { sum: 0, count: 0 };
      sectorSentiments[sector].sum += item.sentiment_score || 0;
      sectorSentiments[sector].count++;
    }
    
    for (const region of (item.regions || [])) {
      if (!regionalSentiments[region]) regionalSentiments[region] = { sum: 0, count: 0 };
      regionalSentiments[region].sum += item.sentiment_score || 0;
      regionalSentiments[region].count++;
    }
  }
  
  const overallSentiment = totalSentiment / recentNews.length;
  const fearGreed = (overallSentiment + 1) / 2; // Convert -1 to +1 scale to 0 to 1
  
  const snapshot = {
    user_id: userId,
    snapshot_at: new Date().toISOString(),
    granularity: 'daily',
    overall_sentiment: overallSentiment,
    overall_fear_greed: fearGreed,
    sector_sentiments: Object.fromEntries(
      Object.entries(sectorSentiments).map(([k, v]) => [k, v.sum / v.count])
    ),
    regional_sentiments: Object.fromEntries(
      Object.entries(regionalSentiments).map(([k, v]) => [k, v.sum / v.count])
    ),
    news_volume: recentNews.length,
    positive_news_pct: (positiveCount / recentNews.length) * 100,
    negative_news_pct: (negativeCount / recentNews.length) * 100,
    source_count: new Set(recentNews.map((n: any) => n.source_name)).size,
  };
  
  const { data, error: insertError } = await supabase
    .from('market_sentiment_snapshots')
    .insert(snapshot)
    .select()
    .single();
  
  if (insertError) {
    console.error('Snapshot insert error:', insertError);
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    snapshot: data 
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function correlateWithContacts(supabase: any, userId: string, profileId?: string) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  // Get contacts with company info
  const contactsQuery = supabase
    .from('profiles')
    .select('id, full_name, company, job_title, industry, location')
    .eq('user_id', userId);
  
  if (profileId) {
    contactsQuery.eq('id', profileId);
  }
  
  const { data: contacts, error: contactsError } = await contactsQuery.limit(50);
  
  if (contactsError || !contacts?.length) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No contacts to correlate',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  // Get recent news
  const { data: news, error: newsError } = await supabase
    .from('news_intelligence_items')
    .select('*')
    .eq('user_id', userId)
    .gte('fetched_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .limit(100);
  
  if (newsError || !news?.length || !lovableApiKey) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No news to correlate with contacts',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a relationship intelligence analyst. Find correlations between news and contacts:
1. Match news about a contact's company, industry, or location
2. Predict how news might affect the contact's behavior
3. Suggest actions (reach out, avoid, offer help)
4. Generate conversation starters based on relevant news`
          },
          {
            role: 'user',
            content: `Find correlations between these contacts and news:
Contacts: ${JSON.stringify(contacts)}
News: ${JSON.stringify(news.map((n: any) => ({
              id: n.id,
              title: n.title,
              entities: n.entities,
              sectors: n.sectors,
              regions: n.regions,
              sentiment: n.sentiment_label
            })))}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_correlations',
            description: 'Create contact-news correlations',
            parameters: {
              type: 'object',
              properties: {
                correlations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      profile_id: { type: 'string' },
                      news_id: { type: 'string' },
                      correlation_type: { type: 'string' },
                      correlation_strength: { type: 'number' },
                      matched_entities: { type: 'array', items: { type: 'object' } },
                      impact_on_contact: { type: 'string' },
                      predicted_behaviors: { type: 'array', items: { type: 'string' } },
                      recommended_actions: { type: 'array', items: { type: 'string' } },
                      conversation_starters: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['profile_id', 'news_id', 'correlation_type', 'correlation_strength']
                  }
                }
              },
              required: ['correlations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_correlations' } }
      }),
    });
    
    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      const correlations = JSON.parse(toolCall.function.arguments).correlations;
      
      const toInsert = correlations.map((c: any) => ({
        user_id: userId,
        profile_id: c.profile_id,
        news_item_id: c.news_id,
        correlation_type: c.correlation_type,
        correlation_strength: c.correlation_strength,
        matched_entities: c.matched_entities || [],
        impact_on_contact: c.impact_on_contact,
        predicted_behaviors: c.predicted_behaviors || [],
        recommended_actions: c.recommended_actions?.map((a: string) => ({ action: a })) || [],
        conversation_starters: c.conversation_starters || [],
      }));
      
      const { data, error: insertError } = await supabase
        .from('contact_news_correlations')
        .insert(toInsert)
        .select();
      
      if (insertError) {
        console.error('Insert correlations error:', insertError);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        count: data?.length || 0 
      }), {
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Contact correlation error:', e);
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Contact correlation failed' 
  }), {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
