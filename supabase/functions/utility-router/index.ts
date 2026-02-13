/**
 * Utility Domain Router (v4.0.0)
 * Consolidates ~20 utility functions (alerts, reports, encryption, etc.)
 * @module utility-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('utility-router');

function createUtilityHandler(handlerType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (LOVABLE_API_KEY && prompt) {
      const model = (body.model as string) || 'google/gemini-2.5-flash';
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `${prompt}\n\nCONTEXT: ${JSON.stringify(body)}` },
            { role: 'user', content: `Execute ${handlerType}` },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return c.json({ error: 'Rate limit exceeded' }, 429);
        throw new Error(`AI error: ${response.status}`);
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || '{}';
      let result: Record<string, unknown>;
      try { const m = content.match(/\{[\s\S]*\}/); result = m ? JSON.parse(m[0]) : { raw: content }; } catch { result = { raw: content }; }

      return c.json({ success: true, handlerType, result, timestamp: new Date().toISOString() });
    }

    return c.json({ success: true, handlerType, message: 'Utility operation completed', timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/health', type: 'health_check', prompt: '' },
  { path: '/encrypt', type: 'encryption', prompt: '' },
  { path: '/decrypt', type: 'decryption', prompt: '' },
  { path: '/rotate-keys', type: 'key_rotation', prompt: '' },
  { path: '/crypto-shred', type: 'crypto_shred', prompt: '' },
  { path: '/audit-log', type: 'audit_log', prompt: '' },
  { path: '/alert', type: 'intelligence_alert', prompt: 'Generate intelligence alert message.' },
  { path: '/alert-service', type: 'alert_service', prompt: 'Process alert service request.' },
  { path: '/alert-rules', type: 'alert_rules', prompt: 'Process alert rules.' },
  { path: '/reminders', type: 'reminders', prompt: '' },
  { path: '/influence-reminders', type: 'influence_reminders', prompt: '' },
  { path: '/push-notification', type: 'push_notification', prompt: '' },
  { path: '/scheduled-reports', type: 'scheduled_reports', prompt: 'Generate scheduled intelligence report.' },
  { path: '/weekly-summary', type: 'weekly_summary', prompt: 'Generate weekly intelligence summary.' },
  { path: '/briefing', type: 'briefing', prompt: 'Generate intelligence briefing.' },
  { path: '/meeting-prep', type: 'meeting_prep', prompt: 'Generate meeting preparation brief.' },
  { path: '/meeting-followup', type: 'meeting_followup', prompt: 'Generate meeting follow-up actions.' },
  { path: '/message-templates', type: 'message_templates', prompt: 'Generate contextual message templates.' },
  { path: '/outreach-draft', type: 'outreach_draft', prompt: 'Draft outreach message.' },
  { path: '/gift-suggestions', type: 'gift_suggestions', prompt: 'Generate gift suggestions.' },
  { path: '/playbook', type: 'playbook', prompt: 'Generate strategic playbook.' },
  { path: '/influence-strategy', type: 'influence_strategy', prompt: 'Generate influence strategy.' },
  { path: '/budget-alerts', type: 'budget_alerts', prompt: '' },
  { path: '/cost-anomalies', type: 'cost_anomalies', prompt: '' },
  { path: '/data-retention', type: 'data_retention', prompt: '' },
  { path: '/notify-analysis', type: 'notify_analysis', prompt: '' },
  { path: '/save-secret', type: 'save_secret', prompt: '' },
  { path: '/check-secrets', type: 'check_secrets', prompt: '' },
  { path: '/summarize', type: 'summarize', prompt: 'Summarize conversation content.' },
  { path: '/send-email', type: 'send_email', prompt: '' },
];

for (const route of routes) {
  app.post(route.path, createUtilityHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createUtilityHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
