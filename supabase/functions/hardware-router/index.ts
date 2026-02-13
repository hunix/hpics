/**
 * Hardware Domain Router (v4.0.0)
 * Consolidates ~15 hardware/sensor functions.
 * @module hardware-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('hardware-router');

function createHardwareHandler(handlerType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (LOVABLE_API_KEY && prompt) {
      const model = (body.model as string) || 'google/gemini-2.5-flash';
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `You are a hardware intelligence analyst. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}` },
            { role: 'user', content: `Process ${handlerType}` },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || '{}';
      let result: Record<string, unknown>;
      try { const m = content.match(/\{[\s\S]*\}/); result = m ? JSON.parse(m[0]) : { raw: content }; } catch { result = { raw: content }; }
      return c.json({ success: true, handlerType, result, timestamp: new Date().toISOString() });
    }

    return c.json({ success: true, handlerType, message: 'Hardware operation processed', timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/gateway', type: 'hardware_gateway', prompt: '' },
  { path: '/aerial', type: 'aerial_intelligence', prompt: 'Process aerial intelligence data.' },
  { path: '/sdr', type: 'sdr_intelligence', prompt: 'Process SDR signal intelligence.' },
  { path: '/gopro', type: 'gopro_intelligence', prompt: 'Process GoPro capture intelligence.' },
  { path: '/sensor', type: 'sensor_network', prompt: 'Process sensor network data.' },
  { path: '/rf-signal', type: 'rf_signal', prompt: 'Process RF signal intelligence.' },
  { path: '/mobile-sensor', type: 'mobile_sensor', prompt: 'Process mobile sensor data.' },
  { path: '/device-capture', type: 'device_capture', prompt: 'Process device capture data.' },
  { path: '/device-sync', type: 'device_sync', prompt: '' },
  { path: '/report', type: 'hardware_report', prompt: 'Generate hardware intelligence report.' },
  { path: '/nfc-tap', type: 'nfc_tap', prompt: '' },
  { path: '/location-correlate', type: 'location_correlation', prompt: 'Correlate location with contacts.' },
];

for (const route of routes) {
  app.post(route.path, createHardwareHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createHardwareHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
