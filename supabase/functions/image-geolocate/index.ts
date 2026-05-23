/**
 * image-geolocate — infer latitude/longitude from an image.
 *
 * Strategy:
 *   1. If the image has EXIF GPS, return it immediately (free, exact).
 *   2. Otherwise call an LLM with vision capability to produce a best-guess
 *      country / city / coordinates with a confidence score. The model is
 *      prompted to behave like a GeoGuessr player: identify language on
 *      signs, vegetation, road markings, license-plate patterns, etc.
 *
 * POST /            { mediaId?: string, imageUrl?: string, profileId?: string }
 *
 * Persists results to image_geolocations (best_guess + alternatives).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const AI_BASE_URL = 'https://ai.gateway.lovable.dev/v1';
const VISION_MODEL_DEFAULT = 'google/gemini-2.5-pro';

interface GeolocResult {
  source: 'exif' | 'vision_model';
  best_guess: {
    label: string;
    country: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
    confidence: number; // 0..1
    reasoning: string | null;
  };
  alternatives: Array<{
    label: string;
    lat: number | null;
    lng: number | null;
    confidence: number;
  }>;
}

async function resolveImageUrl(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: { mediaId?: string; imageUrl?: string },
): Promise<{ url: string; mediaRow?: Record<string, unknown> } | null> {
  if (body.imageUrl) return { url: body.imageUrl };
  if (!body.mediaId) return null;
  const { data } = await supabase
    .from('media')
    .select('id, storage_url, file_url, exif_data, user_id')
    .eq('id', body.mediaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  const url = (data.storage_url as string) || (data.file_url as string);
  return url ? { url, mediaRow: data as Record<string, unknown> } : null;
}

function extractExifGps(media: Record<string, unknown> | undefined): { lat: number; lng: number } | null {
  if (!media) return null;
  const exif = media.exif_data as Record<string, unknown> | undefined;
  if (!exif) return null;
  const lat = Number((exif.gps_latitude  ?? exif.latitude  ?? (exif.gps as Record<string, unknown> | undefined)?.latitude));
  const lng = Number((exif.gps_longitude ?? exif.longitude ?? (exif.gps as Record<string, unknown> | undefined)?.longitude));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

const VISION_PROMPT = `You are a geolocation expert (think GeoGuessr world champion).
Inspect the image and produce a best-guess location plus up to 3 alternatives.
Use cues like: language on signs, road markings, license plate format and color,
vegetation, building style, sky/lighting, mountain shapes, utility-pole style.

Respond as STRICT JSON with this shape:
{
  "best_guess": {
    "label": "<human-readable place, e.g. 'Lisbon, Portugal'>",
    "country": "<ISO country name or null>",
    "city":    "<city or null>",
    "lat":     <number or null>,
    "lng":     <number or null>,
    "confidence": <0..1>,
    "reasoning": "<one-paragraph chain of evidence>"
  },
  "alternatives": [
    { "label": "...", "lat": <num|null>, "lng": <num|null>, "confidence": <0..1> }
  ]
}
Return ONLY the JSON, no preamble.`;

async function callVisionModel(imageUrl: string, model: string): Promise<GeolocResult['best_guess'] & { alternatives: GeolocResult['alternatives'] }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: VISION_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Identify the location of this image.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ]},
      ],
    }),
  });
  if (!res.ok) throw new Error(`vision model error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : { best_guess: null, alternatives: [] };
  return {
    label:      parsed.best_guess?.label ?? 'unknown',
    country:    parsed.best_guess?.country ?? null,
    city:       parsed.best_guess?.city ?? null,
    lat:        typeof parsed.best_guess?.lat === 'number' ? parsed.best_guess.lat : null,
    lng:        typeof parsed.best_guess?.lng === 'number' ? parsed.best_guess.lng : null,
    confidence: typeof parsed.best_guess?.confidence === 'number' ? parsed.best_guess.confidence : 0.3,
    reasoning:  parsed.best_guess?.reasoning ?? null,
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 5) : [],
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('image-geolocate');
  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const body = await req.json().catch(() => ({})) as { mediaId?: string; imageUrl?: string; profileId?: string; model?: string };
  const auth = await validateAuth(req, body as Record<string, unknown>);
  if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  const resolved = await resolveImageUrl(supabase, auth.userId, body);
  if (!resolved) return errorResponse('mediaId or imageUrl required (and must belong to caller)', 400);

  let result: GeolocResult;

  const exifGps = extractExifGps(resolved.mediaRow);
  if (exifGps) {
    result = {
      source: 'exif',
      best_guess: {
        label: 'EXIF GPS', country: null, city: null,
        lat: exifGps.lat, lng: exifGps.lng,
        confidence: 0.99, reasoning: 'Exact coordinates from image EXIF.',
      },
      alternatives: [],
    };
  } else {
    try {
      const guess = await callVisionModel(resolved.url, body.model || VISION_MODEL_DEFAULT);
      result = {
        source: 'vision_model',
        best_guess: {
          label: guess.label, country: guess.country, city: guess.city,
          lat: guess.lat, lng: guess.lng,
          confidence: guess.confidence, reasoning: guess.reasoning,
        },
        alternatives: guess.alternatives,
      };
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'vision model failed', 502);
    }
  }

  await supabase.from('image_geolocations').insert({
    user_id:      auth.userId,
    profile_id:   body.profileId ?? null,
    media_id:     body.mediaId ?? null,
    source:       result.source,
    label:        result.best_guess.label,
    country:      result.best_guess.country,
    city:         result.best_guess.city,
    lat:          result.best_guess.lat,
    lng:          result.best_guess.lng,
    confidence:   result.best_guess.confidence,
    reasoning:    result.best_guess.reasoning,
    alternatives: result.alternatives,
  });

  return jsonResponse({ success: true, ...result });
});
