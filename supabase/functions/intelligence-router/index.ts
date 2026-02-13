/**
 * Intelligence Domain Router (v4.0.0)
 * Consolidates ~45 intelligence edge functions.
 * @module intelligence-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('intelligence-router');

function createIntelHandler(analysisType: string, promptTemplate: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return c.json({ error: 'AI not configured' }, 500);

    const profileRes = profileId 
      ? await supabase.from('profiles').select('*').eq('id', profileId).single()
      : { data: null };

    const model = (body.model as string) || 'google/gemini-2.5-flash';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `${promptTemplate}\n\nPROFILE: ${JSON.stringify(profileRes.data)}\nCONTEXT: ${JSON.stringify(body)}` },
          { role: 'user', content: `Execute ${analysisType} for profile ${profileId || 'general'}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return c.json({ error: 'Rate limit exceeded' }, 429);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    let analysis: Record<string, unknown>;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : { raw: content };
    } catch { analysis = { raw: content }; }

    if (profileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId, profile_id: profileId, analysis_type: analysisType,
        result: analysis, generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });
    }

    return c.json({ success: true, profileId, analysisType, analysis, timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/dossier', type: 'dossier', prompt: 'Generate a comprehensive intelligence dossier.' },
  { path: '/intelligence-dossier', type: 'intelligence_dossier', prompt: 'Generate a detailed intelligence dossier with threat assessment.' },
  { path: '/executive-summary', type: 'executive_summary', prompt: 'Generate a concise executive summary of all available intelligence.' },
  { path: '/aggregate-media', type: 'media_aggregation', prompt: 'Aggregate and analyze all media intelligence.' },
  { path: '/aggregate-voice', type: 'voice_aggregation', prompt: 'Aggregate and analyze all voice intelligence.' },
  { path: '/aggregate-contact', type: 'contact_aggregation', prompt: 'Aggregate all contact intelligence into unified assessment.' },
  { path: '/aggregate-social', type: 'social_aggregation', prompt: 'Aggregate social media intelligence.' },
  { path: '/aggregate-bulk', type: 'bulk_aggregation', prompt: 'Process bulk intelligence aggregation.' },
  { path: '/deep-engine', type: 'deep_intelligence', prompt: 'Execute deep intelligence analysis engine.' },
  { path: '/session-runner', type: 'session_runner', prompt: 'Run intelligence session with multi-step analysis.' },
  { path: '/mosaic-fuser', type: 'mosaic_fusion', prompt: 'Fuse multiple intelligence sources into mosaic picture.' },
  { path: '/cross-modal', type: 'cross_modal_synthesis', prompt: 'Synthesize cross-modal intelligence (text, voice, visual).' },
  { path: '/cross-modal-v2', type: 'cross_modal_synthesis_v2', prompt: 'Enhanced cross-modal intelligence synthesis v2.' },
  { path: '/cross-reference', type: 'cross_reference', prompt: 'Cross-reference intelligence from multiple sources.' },
  { path: '/cross-contact', type: 'cross_contact_correlation', prompt: 'Correlate intelligence across contacts.' },
  { path: '/cross-domain', type: 'cross_domain', prompt: 'Correlate intelligence across domains.' },
  { path: '/deep-correlation', type: 'deep_correlation', prompt: 'Map deep correlations across all data sources.' },
  { path: '/cross-patterns', type: 'cross_patterns', prompt: 'Detect cross-cutting patterns in intelligence data.' },
  { path: '/cross-contact-patterns', type: 'cross_contact_patterns', prompt: 'Detect patterns across multiple contacts.' },
  { path: '/anomalies', type: 'anomaly_detection', prompt: 'Detect anomalies in behavioral and communication patterns.' },
  { path: '/communication-anomalies', type: 'communication_anomalies', prompt: 'Detect anomalies in communication patterns.' },
  { path: '/interests', type: 'interest_detection', prompt: 'Detect and map interests from all available data.' },
  { path: '/life-milestones', type: 'life_milestones', prompt: 'Detect significant life milestones and transitions.' },
  { path: '/relationship-lifecycle', type: 'relationship_lifecycle', prompt: 'Map relationship lifecycle stage and trajectory.' },
  { path: '/influence-opportunities', type: 'influence_opportunities', prompt: 'Detect windows of opportunity for influence.' },
  { path: '/proactive-insights', type: 'proactive_insights', prompt: 'Generate proactive intelligence insights.' },
  { path: '/insight-prioritizer', type: 'insight_prioritization', prompt: 'Prioritize intelligence insights by actionability and urgency.' },
  { path: '/save-insight', type: 'save_insight', prompt: 'Save and categorize AI-generated insight.' },
  { path: '/comprehensive-scan', type: 'comprehensive_scan', prompt: 'Execute comprehensive intelligence scan across all sources.' },
  { path: '/orchestrator', type: 'analysis_orchestration', prompt: 'Orchestrate multi-analysis pipeline.' },
  { path: '/action-intelligence', type: 'action_intelligence', prompt: 'Generate actionable intelligence recommendations.' },
  { path: '/action-recommendation', type: 'action_recommendation', prompt: 'Generate specific action recommendations with scripts.' },
  { path: '/ai-agent', type: 'ai_agent', prompt: 'Run AI agent for autonomous intelligence gathering.' },
  { path: '/ai-agent-v2', type: 'ai_agent_v2', prompt: 'Enhanced AI agent v2 with multi-step reasoning.' },
  { path: '/news-correlator', type: 'news_correlation', prompt: 'Correlate contact activity with news events.' },
  { path: '/infer-relationships', type: 'relationship_inference', prompt: 'Infer relationships from communication patterns.' },
  { path: '/infer-social-context', type: 'social_context', prompt: 'Infer social context and dynamics.' },
  { path: '/suggest-followups', type: 'followup_suggestions', prompt: 'Suggest optimal follow-up actions.' },
  { path: '/suggest-gifts', type: 'gift_suggestions', prompt: 'Suggest personalized gift recommendations.' },
  { path: '/suggest-introductions', type: 'introduction_suggestions', prompt: 'Suggest strategic introductions.' },
  { path: '/suggest-meeting-time', type: 'meeting_time', prompt: 'Suggest optimal meeting times.' },
  { path: '/suggest-missing-data', type: 'missing_data', prompt: 'Identify missing data fields to collect.' },
  { path: '/suggest-network-growth', type: 'network_growth', prompt: 'Suggest network growth strategies.' },
  { path: '/suggest-outreach-timing', type: 'outreach_timing', prompt: 'Suggest optimal outreach timing.' },
  { path: '/suggest-groups', type: 'group_suggestions', prompt: 'Suggest contact groupings and categories.' },
];

for (const route of routes) {
  app.post(route.path, createIntelHandler(route.type, route.prompt));
}

// Internal routing from adapter
app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createIntelHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
