// Deep Research Agent
// Multi-hop research agent that builds comprehensive dossiers

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchStep {
  type: 'search' | 'scrape' | 'extract' | 'analyze';
  query: string;
  result: any;
  timestamp: string;
}

interface ResearchDossier {
  subject: string;
  summary: string;
  keyFindings: string[];
  sources: { url: string; title: string; relevance: number }[];
  timeline: { date: string; event: string }[];
  connections: { name: string; relationship: string; confidence: number }[];
  riskFactors: string[];
  opportunities: string[];
  researchSteps: ResearchStep[];
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

    const { profileId, subjectName, subjectCompany, researchDepth = 'standard' } = await req.json();

    if (!subjectName) throw new Error('Subject name is required');

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) throw new Error('Firecrawl API key not configured');

    const researchSteps: ResearchStep[] = [];
    const dossier = await conductDeepResearch(
      subjectName,
      subjectCompany,
      researchDepth,
      firecrawlKey,
      researchSteps
    );

    // Synthesize findings with AI
    const synthesizedDossier = await synthesizeWithAI(dossier, researchSteps, supabase, user.id);

    // Store enrichment job record
    await supabase.from('enrichment_jobs').insert({
      user_id: user.id,
      profile_id: profileId,
      job_type: 'deep_research',
      status: 'completed',
      source_config: { subjectName, subjectCompany, researchDepth },
      result: synthesizedDossier,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      dossier: synthesizedDossier,
      stepsExecuted: researchSteps.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Deep research error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function conductDeepResearch(
  name: string,
  company: string | null,
  depth: string,
  apiKey: string,
  steps: ResearchStep[]
): Promise<Partial<ResearchDossier>> {
  const sources: any[] = [];
  const findings: string[] = [];
  const connections: any[] = [];
  const timeline: any[] = [];

  // Step 1: Initial search for the person
  const personSearch = await firecrawlSearch(`"${name}" ${company || ''} professional`, apiKey);
  steps.push({ type: 'search', query: `Person search: ${name}`, result: personSearch, timestamp: new Date().toISOString() });

  if (personSearch?.data) {
    sources.push(...(personSearch.data.slice(0, 5).map((r: any) => ({
      url: r.url,
      title: r.title,
      relevance: r.score || 0.5
    }))));
  }

  // Step 2: LinkedIn search
  const linkedInSearch = await firecrawlSearch(`site:linkedin.com "${name}" ${company || ''}`, apiKey);
  steps.push({ type: 'search', query: 'LinkedIn search', result: linkedInSearch, timestamp: new Date().toISOString() });

  // Step 3: If company provided, research the company
  if (company) {
    const companySearch = await firecrawlSearch(`"${company}" company news recent`, apiKey);
    steps.push({ type: 'search', query: `Company search: ${company}`, result: companySearch, timestamp: new Date().toISOString() });

    if (companySearch?.data) {
      sources.push(...(companySearch.data.slice(0, 3).map((r: any) => ({
        url: r.url,
        title: r.title,
        relevance: (r.score || 0.5) * 0.8
      }))));
    }

    // Step 4: Leadership and org structure
    const leadershipSearch = await firecrawlSearch(`"${company}" leadership team executives`, apiKey);
    steps.push({ type: 'search', query: 'Leadership search', result: leadershipSearch, timestamp: new Date().toISOString() });
  }

  // Step 5: Deep research - scrape top sources
  if (depth === 'deep' || depth === 'comprehensive') {
    const topSources = sources.slice(0, 3);
    for (const source of topSources) {
      try {
        const scraped = await firecrawlScrape(source.url, apiKey);
        steps.push({ type: 'scrape', query: source.url, result: { success: true }, timestamp: new Date().toISOString() });
        
        if (scraped?.data?.markdown) {
          // Extract key information
          const extracted = extractKeyInfo(scraped.data.markdown, name);
          findings.push(...extracted.findings);
          timeline.push(...extracted.events);
          connections.push(...extracted.mentions);
        }
      } catch (error) {
        console.error('Scrape error:', error);
      }
    }
  }

  // Step 6: News and press releases
  const newsSearch = await firecrawlSearch(`"${name}" ${company || ''} news announcement 2024 2025`, apiKey);
  steps.push({ type: 'search', query: 'News search', result: newsSearch, timestamp: new Date().toISOString() });

  if (newsSearch?.data) {
    for (const item of newsSearch.data.slice(0, 5)) {
      if (item.publishedDate) {
        timeline.push({ date: item.publishedDate, event: item.title });
      }
    }
  }

  // Step 7: Social presence (if comprehensive)
  if (depth === 'comprehensive') {
    const socialSearch = await firecrawlSearch(`"${name}" twitter OR x.com OR instagram`, apiKey);
    steps.push({ type: 'search', query: 'Social media search', result: socialSearch, timestamp: new Date().toISOString() });
  }

  return {
    subject: name,
    keyFindings: [...new Set(findings)],
    sources: sources.slice(0, 15),
    timeline: timeline.slice(0, 20),
    connections: connections.slice(0, 10),
    researchSteps: steps
  };
}

async function firecrawlSearch(query: string, apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, limit: 10 })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

async function firecrawlScrape(url: string, apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, formats: ['markdown'], waitFor: 2000 })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
}

function extractKeyInfo(content: string, targetName: string): { findings: string[]; events: any[]; mentions: any[] } {
  const findings: string[] = [];
  const events: any[] = [];
  const mentions: any[] = [];

  // Extract sentences mentioning the target
  const sentences = content.split(/[.!?]+/);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(targetName.toLowerCase())) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 500) {
        findings.push(trimmed);
      }
    }
  }

  // Extract dates and events
  const datePattern = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi;
  const dateMatches = content.match(datePattern) || [];
  for (const date of dateMatches.slice(0, 5)) {
    const context = content.substring(content.indexOf(date) - 50, content.indexOf(date) + 150);
    events.push({ date, event: context.trim() });
  }

  // Extract mentions of other people
  const namePattern = /(?:Mr\.|Mrs\.|Ms\.|Dr\.)?\s*[A-Z][a-z]+\s+[A-Z][a-z]+/g;
  const nameMatches = content.match(namePattern) || [];
  const uniqueNames = [...new Set(nameMatches)].filter(n => n !== targetName);
  for (const name of uniqueNames.slice(0, 10)) {
    mentions.push({ name: name.trim(), relationship: 'mentioned together', confidence: 0.5 });
  }

  return { findings: findings.slice(0, 10), events, mentions };
}

async function synthesizeWithAI(dossier: Partial<ResearchDossier>, steps: ResearchStep[], supabase: any, userId: string): Promise<ResearchDossier> {
  const startTime = Date.now();
  
  // Get AI config from platform settings
  const aiConfig = await getAIConfig(supabase, userId);

  const prompt = `Synthesize the following research into a comprehensive intelligence dossier.

Subject: ${dossier.subject}

Sources Found (${dossier.sources?.length || 0}):
${JSON.stringify(dossier.sources?.slice(0, 10), null, 2)}

Key Findings:
${dossier.keyFindings?.join('\n') || 'None'}

Timeline Events:
${JSON.stringify(dossier.timeline?.slice(0, 10), null, 2)}

Connections:
${JSON.stringify(dossier.connections, null, 2)}

Create a synthesized dossier with:
1. Executive summary (2-3 sentences)
2. Key findings (5-10 bullet points)
3. Risk factors (if any)
4. Opportunities (for engagement)
5. Recommended next steps

Format as JSON:
{
  "summary": "...",
  "keyFindings": ["..."],
  "riskFactors": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."]
}`;

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiConfig.qualityModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: aiConfig.temperature,
        max_tokens: 2000
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'deep-research-agent',
      model_name: aiConfig.qualityModel,
      provider: 'google',
      estimated_cost_cents: 2,
      response_time_ms: Date.now() - startTime,
      status: 'success'
    });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const synthesis = JSON.parse(jsonMatch[0]);
      return {
        ...dossier,
        summary: synthesis.summary,
        keyFindings: synthesis.keyFindings || dossier.keyFindings || [],
        riskFactors: synthesis.riskFactors || [],
        opportunities: synthesis.opportunities || [],
        researchSteps: steps
      } as ResearchDossier;
    }
  } catch (error) {
    console.error('AI synthesis error:', error);
  }

  return {
    ...dossier,
    summary: `Research dossier for ${dossier.subject}`,
    riskFactors: [],
    opportunities: [],
    researchSteps: steps
  } as ResearchDossier;
}
