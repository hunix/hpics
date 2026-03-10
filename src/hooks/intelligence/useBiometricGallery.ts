/**
 * useBiometricGallery — Phase 4 Hooks
 *
 * Biometric enrollment, identification, multi-modal fusion, and privacy:
 *   - Enroll face/voice embeddings
 *   - Identify probes against gallery
 *   - Multi-modal fusion scoring
 *   - Privacy settings management
 *   - Audit trail
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─────────────────────────────────────────────── Types ────────────────────────

export interface BiometricEmbedding {
  id: string;
  profile_id: string;
  modality: string;
  quality_score: number;
  confidence: number;
  source_type: string;
  enrolled_at: string;
  update_count: number;
  is_active: boolean;
}

export interface BiometricMatch {
  id: string;
  profile_id: string;
  modality: string;
  similarity: number;
  confidence: number;
  quality_score: number;
  enrolled_at: string;
}

export interface FusionResult {
  face: { score: number; weight: number; available: boolean };
  voice: { score: number; weight: number; available: boolean };
  behavioral: { score: number; weight: number; available: boolean };
  composite: number;
  modalities_used: number;
  fusion_method: string;
}

export interface BiometricPrivacy {
  face_enrollment_consent: boolean;
  voice_enrollment_consent: boolean;
  ambient_detection_consent: boolean;
  federated_learning_consent: boolean;
  store_embeddings_server: boolean;
  ambient_detection_enabled: boolean;
  ambient_alert_threshold: number;
  embedding_retention_days: number;
  max_privacy_epsilon: number;
  current_privacy_spent: number;
}

export interface BiometricAudit {
  total_embeddings: number;
  embeddings_by_modality: Record<string, number>;
  recent_identifications: number;
  privacy_settings: BiometricPrivacy;
  embeddings: BiometricEmbedding[];
  identifications: Array<Record<string, unknown>>;
}

// ─────────────────────────────────────────────── Helper ───────────────────────

async function invokeBiometric(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("biometric-gallery", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─────────────────────────────────────────────── Hooks ────────────────────────

/** Enroll a biometric template (face/voice/gait) for a contact. */
export function useEnrollBiometric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      profileId: string;
      modality: string;
      embedding: number[];
      qualityScore?: number;
      livenessScore?: number;
      sourceType?: string;
    }) => invokeBiometric({ action: "enroll", ...params }),
    onSuccess: (data, vars) => {
      const action = data.action === "updated" ? "updated" : "enrolled";
      toast.success(`Biometric ${action} (${vars.modality})`);
      qc.invalidateQueries({ queryKey: ["biometric-audit"] });
      qc.invalidateQueries({ queryKey: ["biometric-gallery", vars.profileId] });
    },
    onError: (err) => toast.error(`Enrollment failed: ${err.message}`),
  });
}

/** Identify a probe against the biometric gallery. */
export function useIdentifyBiometric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      embedding: number[];
      modality?: string;
      threshold?: number;
      maxResults?: number;
    }) => invokeBiometric({ action: "identify", ...params }),
    onSuccess: (data) => {
      const best = data.best_match as BiometricMatch | null;
      if (best) {
        toast.success(`Match: ${Math.round((best.similarity ?? 0) * 100)}% confidence`);
      } else {
        toast.info("No biometric match found");
      }
      qc.invalidateQueries({ queryKey: ["biometric-audit"] });
    },
  });
}

/** Multi-modal fusion scoring. */
export function useBiometricFusion() {
  return useMutation({
    mutationFn: (params: {
      profileId: string;
      faceEmbedding?: number[];
      voiceEmbedding?: number[];
      behavioralScore?: number;
    }) => invokeBiometric({ action: "fuse", ...params }),
    onSuccess: (data) => {
      toast.success(`Fusion: ${Math.round((data.composite ?? 0) * 100)}% composite`);
    },
  });
}

/** Get biometric privacy settings. */
export function useBiometricPrivacy() {
  return useQuery<BiometricPrivacy>({
    queryKey: ["biometric-privacy"],
    queryFn: async () => {
      const data = await invokeBiometric({ action: "get_privacy" });
      return data as unknown as BiometricPrivacy;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Update biometric privacy settings. */
export function useUpdateBiometricPrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<BiometricPrivacy>) =>
      invokeBiometric({ action: "update_privacy", ...settings }),
    onSuccess: () => {
      toast.success("Privacy settings updated");
      qc.invalidateQueries({ queryKey: ["biometric-privacy"] });
    },
  });
}

/** Get biometric audit trail. */
export function useBiometricAudit() {
  return useQuery<BiometricAudit>({
    queryKey: ["biometric-audit"],
    queryFn: async () => {
      const data = await invokeBiometric({ action: "audit" });
      return data as unknown as BiometricAudit;
    },
    staleTime: 1000 * 60,
  });
}

/** Gallery for a specific contact. */
export function useContactBiometrics(profileId: string | undefined) {
  return useQuery<BiometricEmbedding[]>({
    queryKey: ["biometric-gallery", profileId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("biometric_embeddings")
        .select("id, profile_id, modality, quality_score, confidence, source_type, enrolled_at, update_count, is_active")
        .eq("profile_id", profileId!)
        .eq("is_active", true)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BiometricEmbedding[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Combined hook for the BiometricStudio page. */
export function useBiometricStudio(profileId: string | undefined) {
  const audit = useBiometricAudit();
  const privacy = useBiometricPrivacy();
  const gallery = useContactBiometrics(profileId);
  const enroll = useEnrollBiometric();
  const identify = useIdentifyBiometric();
  const fusion = useBiometricFusion();
  const updatePrivacy = useUpdateBiometricPrivacy();

  return {
    audit: audit.data,
    privacy: privacy.data,
    gallery: gallery.data ?? [],
    isLoading: audit.isLoading || privacy.isLoading,
    enroll,
    identify,
    fusion,
    updatePrivacy,
  };
}
