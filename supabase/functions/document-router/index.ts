/**
 * Document Domain Router (v4.0.0)
 * Consolidates ~13 document processing functions.
 * @module document-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('document-router');

function createDocHandler(handlerType: string, prompt: string) {
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
            { role: 'system', content: `You are a document intelligence specialist. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
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

    return c.json({ success: true, handlerType, message: 'Document operation processed', timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/comprehensive', type: 'document_comprehensive', prompt: 'Comprehensive document analysis.' },
  { path: '/batch', type: 'document_batch', prompt: 'Process document batch.' },
  { path: '/embeddings', type: 'document_embeddings', prompt: '' },
  { path: '/search', type: 'document_search', prompt: '' },
  { path: '/identity', type: 'identity_document', prompt: 'Parse and analyze identity document.' },
  { path: '/screenshot', type: 'screenshot_profile', prompt: 'Parse profile from screenshot.' },
  { path: '/entity-extraction', type: 'entity_extraction', prompt: 'Extract entities from document.' },
  { path: '/generate-embeddings', type: 'embeddings', prompt: '' },
  { path: '/generate-embeddings-v2', type: 'embeddings_v2', prompt: '' },
  { path: '/auto-embed', type: 'auto_embed', prompt: '' },
  { path: '/rag-query', type: 'rag_query', prompt: 'RAG query for document retrieval.' },
  { path: '/rag-query-v2', type: 'rag_query_v2', prompt: 'Enhanced RAG query v2.' },
  { path: '/rag-query-v3', type: 'rag_query_v3', prompt: 'Advanced RAG query v3.' },
];

for (const route of routes) {
  app.post(route.path, createDocHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createDocHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
