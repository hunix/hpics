/**
 * multilingual-ner — extract entities from text in any language.
 *
 * Strategy: call a Hugging Face inference endpoint for an XLM-R-based NER
 * model (default: Davlan/xlm-roberta-large-ner-hrl, covers 10 languages).
 * If HF returns nothing useful or the API key is missing, fall back to a
 * small LLM prompt that mimics the same output shape. The fallback handles
 * arbitrary languages without per-language model swapping.
 *
 * POST /             { text, language?, model? }
 *                    -> { entities: [{ text, type, start, end, score, lang }], language, source }
 *
 * Env:
 *   HF_API_TOKEN     Hugging Face access token (optional)
 *   HF_NER_MODEL     override the default NER model
 *   LOVABLE_API_KEY  used by the LLM fallback
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const HF_DEFAULT_MODEL = 'Davlan/xlm-roberta-large-ner-hrl';
const HF_BASE = 'https://api-inference.huggingface.co/models';
const AI_BASE_URL = 'https://ai.gateway.lovable.dev/v1';

type EntityType = 'PER' | 'ORG' | 'LOC' | 'MISC' | 'DATE' | 'EMAIL' | 'PHONE' | 'URL' | 'OTHER';

interface Entity {
  text: string;
  type: EntityType;
  start: number;
  end: number;
  score: number;
  lang?: string;
}

// HF token-classification output (aggregation_strategy=simple)
interface HFEntity {
  entity_group?: string;
  entity?: string;
  word: string;
  score: number;
  start: number;
  end: number;
}

function normalizeType(raw: string | undefined): EntityType {
  if (!raw) return 'OTHER';
  const u = raw.toUpperCase().replace(/^[BI]-/, '');
  if (['PER', 'PERSON'].includes(u)) return 'PER';
  if (['ORG', 'ORGANISATION', 'ORGANIZATION'].includes(u)) return 'ORG';
  if (['LOC', 'LOCATION', 'GPE'].includes(u)) return 'LOC';
  if (u === 'DATE') return 'DATE';
  if (u === 'EMAIL') return 'EMAIL';
  if (u === 'PHONE') return 'PHONE';
  if (u === 'URL') return 'URL';
  if (u === 'MISC') return 'MISC';
  return 'OTHER';
}

async function callHF(text: string, model: string): Promise<Entity[] | null> {
  const token = Deno.env.get('HF_API_TOKEN');
  if (!token) return null;
  const res = await fetch(`${HF_BASE}/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text, parameters: { aggregation_strategy: 'simple' } }),
  });
  if (!res.ok) {
    console.warn('[multilingual-ner] HF error', res.status);
    return null;
  }
  const raw = await res.json() as HFEntity[] | { error?: string };
  if (!Array.isArray(raw)) return null;
  return raw.map(e => ({
    text:  e.word.replace(/^##/, ''),
    type:  normalizeType(e.entity_group ?? e.entity),
    start: e.start,
    end:   e.end,
    score: typeof e.score === 'number' ? e.score : 0,
  }));
}

const LLM_PROMPT = `Extract every named entity from the input text. The text may
be in any language (Arabic, Chinese, Russian, Greek, Hebrew, etc. all OK).
Return STRICT JSON:
{
  "language": "<ISO 639-1 code>",
  "entities": [
    {"text": "...", "type": "PER|ORG|LOC|DATE|EMAIL|PHONE|URL|MISC", "start": <int>, "end": <int>, "score": <0..1>}
  ]
}
- start/end are character offsets in the ORIGINAL input.
- One entry per surface form (don't merge cross-references).
- Only output JSON.`;

async function callLLM(text: string, model: string): Promise<{ entities: Entity[]; language: string } | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: LLM_PROMPT },
        { role: 'user',   content: text },
      ],
    }),
  });
  if (!res.ok) {
    console.warn('[multilingual-ner] LLM error', res.status);
    return null;
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]) as { language?: string; entities?: Array<Partial<Entity>> };
    const entities: Entity[] = (parsed.entities ?? [])
      .filter((e): e is Required<Pick<Entity, 'text'>> & Partial<Entity> => typeof e.text === 'string')
      .map(e => ({
        text:  e.text!,
        type:  normalizeType(e.type as string),
        start: typeof e.start === 'number' ? e.start : -1,
        end:   typeof e.end   === 'number' ? e.end   : -1,
        score: typeof e.score === 'number' ? e.score : 0.5,
      }));
    return { entities, language: parsed.language ?? 'und' };
  } catch (err) {
    console.warn('[multilingual-ner] parse error', err);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('multilingual-ner');
  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const body = await req.json().catch(() => ({})) as { text?: string; language?: string; model?: string };
  const auth = await validateAuth(req, body as Record<string, unknown>);
  if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
  if (!body.text || typeof body.text !== 'string') return errorResponse('text required', 400);
  if (body.text.length > 20_000) return errorResponse('text too long (max 20k chars)', 413);

  const hfModel = Deno.env.get('HF_NER_MODEL') ?? HF_DEFAULT_MODEL;

  // Try HF first; if it returns ≥1 entity, prefer it (faster + cheaper).
  const hf = await callHF(body.text, hfModel);
  if (hf && hf.length > 0) {
    return jsonResponse({
      success: true,
      source: 'hf',
      model: hfModel,
      language: body.language ?? 'auto',
      entities: hf,
    });
  }

  // LLM fallback handles low-resource languages or when HF is unconfigured.
  const llm = await callLLM(body.text, body.model ?? 'google/gemini-2.5-flash');
  if (llm) {
    return jsonResponse({
      success: true,
      source: 'llm',
      model: body.model ?? 'google/gemini-2.5-flash',
      language: llm.language,
      entities: llm.entities,
    });
  }

  return errorResponse('no NER backend available (configure HF_API_TOKEN or LOVABLE_API_KEY)', 503);
});
