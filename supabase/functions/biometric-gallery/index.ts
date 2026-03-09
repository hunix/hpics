/**
 * Biometric Gallery — Phase 4 Edge Function
 *
 * Server-side biometric enrollment, identification, and multi-modal fusion:
 *   - enroll: Store face/voice/gait embedding with quality + liveness checks
 *   - identify: Probe against gallery → top-K matches with confidence
 *   - fuse: Multi-modal score fusion (face 40% + voice 35% + behavioral 25%)
 *   - update: Rolling average template update for incremental enrollment
 *   - privacy: Get/set biometric privacy preferences
 *   - audit: List all biometric data stored for a user
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logLLMObservability, startTimer } from "../_shared/llm-observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ──────────────────────────────────────────────────────────────────────────────
// Enroll Biometric
// ──────────────────────────────────────────────────────────────────────────────

async function enroll(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: Record<string, unknown>,
) {
  const profileId = params.profileId as string;
  const modality = params.modality as string;
  const embedding = params.embedding as number[];
  const qualityScore = (params.qualityScore as number) ?? 0.5;
  const livenessScore = params.livenessScore as number | null;
  const sourceType = (params.sourceType as string) ?? "manual";

  if (!profileId || !modality || !embedding?.length) {
    throw new Error("profileId, modality, and embedding are required");
  }

  if (embedding.length !== 512) {
    throw new Error(`Expected 512-dimensional embedding, got ${embedding.length}`);
  }

  // Check privacy consent
  const { data: privacy } = await supabase
    .from("biometric_privacy_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (modality === "face" && privacy && !(privacy as Record<string, unknown>).face_enrollment_consent) {
    throw new Error("Face enrollment consent not granted. Update privacy settings first.");
  }
  if (modality === "voice" && privacy && !(privacy as Record<string, unknown>).voice_enrollment_consent) {
    throw new Error("Voice enrollment consent not granted. Update privacy settings first.");
  }

  // Check for existing enrollment (same modality, same contact) → update instead
  const { data: existing } = await supabase
    .from("biometric_embeddings")
    .select("id, embedding, update_count")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .eq("modality", modality)
    .eq("is_active", true)
    .single();

  if (existing) {
    // Rolling average update: new_template = (old * count + new) / (count + 1)
    const oldEmb = (existing as Record<string, unknown>).embedding as number[] ?? [];
    const count = ((existing as Record<string, unknown>).update_count as number) ?? 1;
    const updated: number[] = [];
    for (let i = 0; i < 512; i++) {
      updated.push(((oldEmb[i] ?? 0) * count + embedding[i]) / (count + 1));
    }
    // Normalize
    const mag = Math.sqrt(updated.reduce((s, v) => s + v * v, 0));
    const normalized = mag > 0 ? updated.map((v) => v / mag) : updated;

    const { data, error } = await supabase
      .from("biometric_embeddings")
      .update({
        embedding: JSON.stringify(normalized),
        quality_score: Math.max(qualityScore, (existing as Record<string, unknown>).quality_score as number ?? 0),
        confidence: Math.min(1.0, 0.5 + count * 0.05),
        update_count: count + 1,
        updated_at: new Date().toISOString(),
        liveness_verified: livenessScore != null ? livenessScore > 0.5 : false,
        liveness_score: livenessScore,
      })
      .eq("id", (existing as Record<string, unknown>).id)
      .select()
      .single();

    if (error) throw new Error(`Update failed: ${error.message}`);
    return { action: "updated", enrollment: data, update_count: count + 1 };
  }

  // New enrollment
  const { data, error } = await supabase
    .from("biometric_embeddings")
    .insert({
      user_id: userId,
      profile_id: profileId,
      modality,
      embedding: JSON.stringify(embedding),
      embedding_model: modality === "face" ? "arcface_r100" : modality === "voice" ? "ecapa_tdnn" : "gait_resnet",
      quality_score: qualityScore,
      confidence: 0.5,
      source_type: sourceType,
      liveness_verified: livenessScore != null ? livenessScore > 0.5 : false,
      liveness_score: livenessScore,
    })
    .select()
    .single();

  if (error) throw new Error(`Enrollment failed: ${error.message}`);
  return { action: "enrolled", enrollment: data };
}

// ──────────────────────────────────────────────────────────────────────────────
// Identify (probe against gallery)
// ──────────────────────────────────────────────────────────────────────────────

async function identify(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: Record<string, unknown>,
) {
  const modality = (params.modality as string) ?? "all";
  const embedding = params.embedding as number[];
  const threshold = (params.threshold as number) ?? 0.7;
  const maxResults = Math.min((params.maxResults as number) ?? 5, 20);

  if (!embedding?.length || embedding.length !== 512) {
    throw new Error("512-dimensional embedding required");
  }

  // Use the match_biometric RPC
  const { data: matches, error } = await supabase.rpc("match_biometric", {
    query_embedding: JSON.stringify(embedding),
    query_modality: modality,
    match_user_id: userId,
    match_threshold: threshold,
    match_count: maxResults,
  });

  if (error) throw new Error(`Identification failed: ${error.message}`);

  // Log the identification
  const bestMatch = matches?.[0] as Record<string, unknown> | undefined;
  await supabase
    .from("biometric_identifications")
    .insert({
      user_id: userId,
      query_modality: modality,
      query_embedding: JSON.stringify(embedding),
      top_matches: JSON.stringify((matches ?? []).map((m: Record<string, unknown>) => ({
        profile_id: m.profile_id,
        similarity: m.similarity,
        confidence: m.confidence,
        modality: m.modality,
      }))),
      best_match_profile_id: bestMatch?.profile_id as string ?? null,
      best_match_confidence: bestMatch?.similarity as number ?? null,
      source: (params.source as string) ?? "manual",
    })
    .catch(() => null);

  return {
    matches: matches ?? [],
    best_match: bestMatch ?? null,
    total_gallery_queried: matches?.length ?? 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Multi-Modal Fusion
// ──────────────────────────────────────────────────────────────────────────────

async function fuse(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: Record<string, unknown>,
) {
  const profileId = params.profileId as string;
  if (!profileId) throw new Error("profileId required");

  const faceEmbedding = params.faceEmbedding as number[] | undefined;
  const voiceEmbedding = params.voiceEmbedding as number[] | undefined;
  const behavioralScore = (params.behavioralScore as number) ?? null;

  const weights = { face: 0.40, voice: 0.35, behavioral: 0.25 };
  const scores: Record<string, { score: number; weight: number; available: boolean }> = {
    face: { score: 0, weight: weights.face, available: false },
    voice: { score: 0, weight: weights.voice, available: false },
    behavioral: { score: 0, weight: weights.behavioral, available: false },
  };

  // Face matching
  if (faceEmbedding?.length === 512) {
    const { data: faceMatches } = await supabase.rpc("match_biometric", {
      query_embedding: JSON.stringify(faceEmbedding),
      query_modality: "face",
      match_user_id: userId,
      match_threshold: 0.3,
      match_count: 1,
    });
    const faceMatch = (faceMatches as Record<string, unknown>[])?.[0];
    if (faceMatch && faceMatch.profile_id === profileId) {
      scores.face.score = (faceMatch.similarity as number) ?? 0;
      scores.face.available = true;
    }
  }

  // Voice matching
  if (voiceEmbedding?.length === 512) {
    const { data: voiceMatches } = await supabase.rpc("match_biometric", {
      query_embedding: JSON.stringify(voiceEmbedding),
      query_modality: "voice",
      match_user_id: userId,
      match_threshold: 0.3,
      match_count: 1,
    });
    const voiceMatch = (voiceMatches as Record<string, unknown>[])?.[0];
    if (voiceMatch && voiceMatch.profile_id === profileId) {
      scores.voice.score = (voiceMatch.similarity as number) ?? 0;
      scores.voice.available = true;
    }
  }

  // Behavioral entropy
  if (behavioralScore !== null) {
    scores.behavioral.score = behavioralScore / 100;
    scores.behavioral.available = true;
  }

  // Compute weighted fusion (normalize weights for available modalities)
  const availableModalities = Object.values(scores).filter((s) => s.available);
  const totalWeight = availableModalities.reduce((sum, s) => sum + s.weight, 0);

  let compositeScore = 0;
  if (totalWeight > 0) {
    compositeScore = availableModalities.reduce((sum, s) => sum + (s.score * s.weight) / totalWeight, 0);
  }

  const fusionResult = {
    face: scores.face,
    voice: scores.voice,
    behavioral: scores.behavioral,
    composite: compositeScore,
    modalities_used: availableModalities.length,
    fusion_method: "weighted_score",
  };

  // Log fusion result
  await supabase
    .from("biometric_identifications")
    .insert({
      user_id: userId,
      query_modality: "multi_modal",
      top_matches: JSON.stringify([{ profile_id: profileId, similarity: compositeScore }]),
      best_match_profile_id: compositeScore > 0.5 ? profileId : null,
      best_match_confidence: compositeScore,
      fusion_result: JSON.stringify(fusionResult),
      fusion_confidence: compositeScore,
      fusion_method: "weighted_score",
    })
    .catch(() => null);

  return fusionResult;
}

// ──────────────────────────────────────────────────────────────────────────────
// Privacy Settings
// ──────────────────────────────────────────────────────────────────────────────

async function getPrivacy(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from("biometric_privacy_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // Create default settings
    const { data: created } = await supabase
      .from("biometric_privacy_settings")
      .insert({ user_id: userId })
      .select()
      .single();
    return created;
  }
  if (error) throw error;
  return data;
}

async function updatePrivacy(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  settings: Record<string, unknown>,
) {
  // Ensure row exists
  await getPrivacy(supabase, userId);

  const allowed = [
    "face_enrollment_consent", "voice_enrollment_consent",
    "ambient_detection_consent", "federated_learning_consent",
    "store_embeddings_server", "ambient_detection_enabled",
    "ambient_alert_threshold", "embedding_retention_days",
    "max_privacy_epsilon",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in settings) updates[key] = settings[key];
  }

  const { data, error } = await supabase
    .from("biometric_privacy_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────────────────────────────────────
// Audit (what biometric data is stored)
// ──────────────────────────────────────────────────────────────────────────────

async function audit(supabase: ReturnType<typeof createClient>, userId: string) {
  const [embeddings, identifications, privacy] = await Promise.all([
    supabase
      .from("biometric_embeddings")
      .select("id, profile_id, modality, quality_score, confidence, source_type, enrolled_at, update_count, is_active")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("biometric_identifications")
      .select("id, query_modality, best_match_profile_id, best_match_confidence, fusion_method, identified_at")
      .eq("user_id", userId)
      .order("identified_at", { ascending: false })
      .limit(20),
    getPrivacy(supabase, userId),
  ]);

  const byModality: Record<string, number> = {};
  for (const e of (embeddings.data ?? []) as Record<string, unknown>[]) {
    const mod = e.modality as string;
    byModality[mod] = (byModality[mod] ?? 0) + 1;
  }

  return {
    total_embeddings: embeddings.data?.length ?? 0,
    embeddings_by_modality: byModality,
    recent_identifications: identifications.data?.length ?? 0,
    privacy_settings: privacy,
    embeddings: embeddings.data ?? [],
    identifications: (identifications.data ?? []).slice(0, 10),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const timer = startTimer();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result: unknown;

    switch (action) {
      case "enroll":
        result = await enroll(supabase, user.id, params);
        break;
      case "identify":
        result = await identify(supabase, user.id, params);
        break;
      case "fuse":
        result = await fuse(supabase, user.id, params);
        break;
      case "get_privacy":
        result = await getPrivacy(supabase, user.id);
        break;
      case "update_privacy":
        result = await updatePrivacy(supabase, user.id, params);
        break;
      case "audit":
        result = await audit(supabase, user.id);
        break;
      default:
        return new Response(JSON.stringify({
          error: `Unknown action: ${action}`,
          available: ["enroll", "identify", "fuse", "get_privacy", "update_privacy", "audit"],
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logLLMObservability({
      userId: user.id,
      edgeFunction: "biometric-gallery",
      model: "none",
      latencyMs: timer(),
      success: true,
      searchMethod: action,
    }).catch(() => null);

    return new Response(JSON.stringify({ success: true, action, ...result as Record<string, unknown> }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[biometric-gallery] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
