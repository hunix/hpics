// Monitor Web Mentions
// Tracks online mentions of contacts and their companies

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MentionResult {
  url: string;
  title: string;
  snippet: string;
  source: string;
  publishedDate: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { profileId, action = 'check' } = await req.json();
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) throw new Error('Firecrawl API key not configured');

    if (action === 'check_all') {
      // Check all active monitoring jobs
      const results = await checkAllMonitoringJobs(supabase, user.id, firecrawlKey);
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!profileId) throw new Error('Profile ID required');

    // Get profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization')
      .eq('id', profileId)
      .single();

    if (!profile) throw new Error('Profile not found');

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    // Get or create monitoring job
    let { data: job } = await supabase
      .from('web_monitoring_jobs')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      const searchQueries = buildSearchQueries(fullName, profile.organization);
      const { data: newJob } = await supabase
        .from('web_monitoring_jobs')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          search_queries: searchQueries,
          frequency_hours: 24,
          is_active: true,
          last_run: new Date().toISOString()
        })
        .select()
        .single();
      job = newJob;
    }

    // Execute search
    const mentions = await searchForMentions(job.search_queries || [fullName], firecrawlKey);
    
    // Get previous results for comparison
    const { data: prevResults } = await supabase
      .from('web_monitoring_results')
      .select('url')
      .eq('job_id', job.id)
      .order('detected_at', { ascending: false })
      .limit(100);

    const previousUrls = new Set(prevResults?.map(r => r.url) || []);
    const newMentions = mentions.filter(m => !previousUrls.has(m.url));

    // Store new mentions
    if (newMentions.length > 0) {
      const resultsToInsert = newMentions.map(m => ({
        user_id: user.id,
        job_id: job.id,
        profile_id: profileId,
        url: m.url,
        title: m.title,
        snippet: m.snippet,
        source_domain: new URL(m.url).hostname,
        published_at: m.publishedDate,
        sentiment: m.sentiment,
        relevance_score: m.relevanceScore,
        is_new: true,
        detected_at: new Date().toISOString()
      }));

      await supabase.from('web_monitoring_results').insert(resultsToInsert);

      // Create alerts for significant new mentions
      for (const mention of newMentions.filter(m => m.relevanceScore > 0.7)) {
        await supabase.from('surveillance_alerts').insert({
          user_id: user.id,
          profile_id: profileId,
          alert_type: 'web_mention',
          severity: mention.sentiment === 'negative' ? 'high' : 'medium',
          title: `New web mention: ${mention.title.slice(0, 100)}`,
          description: mention.snippet,
          source_data: mention,
          is_read: false
        });
      }
    }

    // Update job
    await supabase
      .from('web_monitoring_jobs')
      .update({ last_run: new Date().toISOString(), last_results: mentions })
      .eq('id', job.id);

    return new Response(JSON.stringify({
      success: true,
      totalMentions: mentions.length,
      newMentions: newMentions.length,
      mentions: mentions.slice(0, 20)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Web monitoring error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSearchQueries(name: string, company: string | null): string[] {
  const queries = [`"${name}"`];
  if (company) {
    queries.push(`"${name}" "${company}"`);
    queries.push(`"${company}" news announcement`);
  }
  return queries;
}

async function searchForMentions(queries: string[], apiKey: string): Promise<MentionResult[]> {
  const allResults: MentionResult[] = [];

  for (const query of queries) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, limit: 20 })
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data?.data) {
        for (const item of data.data) {
          allResults.push({
            url: item.url,
            title: item.title || '',
            snippet: item.description || item.content?.slice(0, 300) || '',
            source: new URL(item.url).hostname,
            publishedDate: item.publishedDate || null,
            sentiment: analyzeSentiment(item.description || item.content || ''),
            relevanceScore: item.score || 0.5
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase();
  const positiveWords = ['success', 'growth', 'award', 'achieve', 'innovation', 'excellent', 'breakthrough'];
  const negativeWords = ['lawsuit', 'scandal', 'fail', 'crisis', 'layoff', 'fraud', 'controversy'];

  let score = 0;
  for (const word of positiveWords) {
    if (lower.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) score--;
  }

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

async function checkAllMonitoringJobs(supabase: any, userId: string, apiKey: string): Promise<any[]> {
  const { data: jobs } = await supabase
    .from('web_monitoring_jobs')
    .select('*, profiles(first_name, last_name, organization)')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!jobs || jobs.length === 0) return [];

  const results = [];
  for (const job of jobs.slice(0, 10)) { // Limit to 10 jobs
    const profile = job.profiles;
    const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    const queries = job.search_queries || [name];
    
    const mentions = await searchForMentions(queries, apiKey);
    results.push({
      profileId: job.profile_id,
      name,
      mentionsFound: mentions.length,
      topMentions: mentions.slice(0, 5)
    });

    await supabase
      .from('web_monitoring_jobs')
      .update({ last_run: new Date().toISOString() })
      .eq('id', job.id);
  }

  return results;
}
