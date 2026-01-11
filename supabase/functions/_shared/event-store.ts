/**
 * Event Store Utilities for Centralized AI Analysis System (CAAS)
 * Provides immutable, hash-chained event sourcing for all analysis operations
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

export interface AnalysisEvent {
  id?: string;
  user_id: string;
  profile_id?: string;
  event_type: AnalysisEventType;
  event_version?: number;
  source_type?: SourceType;
  source_id?: string;
  source_registry_id?: string;
  source_hash?: string;
  source_metadata?: Record<string, unknown>;
  analysis_type: AnalysisType;
  analysis_subtype?: string;
  analysis_model?: string;
  analysis_version?: string;
  raw_result: Record<string, unknown>;
  confidence_score?: number;
  key_insights?: string[];
  tags?: string[];
  entities_mentioned?: Record<string, unknown>;
  processing_duration_ms?: number;
  cost_cents?: number;
  tokens_used?: number;
}

export type AnalysisEventType = 
  | 'analysis_created'
  | 'insight_added'
  | 'pattern_detected'
  | 'correlation_found'
  | 'enrichment_applied'
  | 'validation_completed'
  | 'aggregate_rebuilt';

export type SourceType = 
  | 'media'
  | 'document'
  | 'message'
  | 'voice'
  | 'capture'
  | 'meeting'
  | 'import';

export type AnalysisType = 
  | 'psychological'
  | 'linguistic'
  | 'behavioral'
  | 'biometric'
  | 'facial'
  | 'voice'
  | 'comprehensive'
  | 'correlation'
  | 'enrichment';

export interface SourceAssetRegistration {
  user_id: string;
  asset_type: SourceType;
  asset_id: string;
  original_filename?: string;
  original_mime_type?: string;
  content_hash?: string;
  file_size_bytes?: number;
  metadata?: Record<string, unknown>;
}

export interface EventStoreResult {
  success: boolean;
  event_id?: string;
  sequence_number?: number;
  error?: string;
}

/**
 * Creates a Supabase client for event store operations
 */
export function createEventStoreClient(): AnySupabase {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Registers a source asset in the registry (idempotent)
 * This preserves metadata even if the original asset is later deleted
 */
export async function registerSourceAsset(
  supabase: AnySupabase,
  registration: SourceAssetRegistration
): Promise<{ registry_id: string; is_new: boolean }> {
  // Check if already registered
  const { data: existing } = await supabase
    .from('source_asset_registry')
    .select('id')
    .eq('user_id', registration.user_id)
    .eq('asset_type', registration.asset_type)
    .eq('asset_id', registration.asset_id)
    .maybeSingle();

  if (existing) {
    // Update last analyzed timestamp
    await supabase
      .from('source_asset_registry')
      .update({ 
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    return { registry_id: existing.id, is_new: false };
  }

  // Create new registration
  const { data, error } = await supabase
    .from('source_asset_registry')
    .insert({
      ...registration,
      first_seen_at: new Date().toISOString(),
      last_analyzed_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to register source asset: ${error.message}`);
  }

  return { registry_id: data.id, is_new: true };
}

/**
 * Appends an immutable event to the analysis event log
 * Hash is computed automatically by database trigger
 */
export async function appendAnalysisEvent(
  supabase: AnySupabase,
  event: AnalysisEvent
): Promise<EventStoreResult> {
  try {
    const { data, error } = await supabase
      .from('analysis_events')
      .insert({
        user_id: event.user_id,
        profile_id: event.profile_id,
        event_type: event.event_type,
        event_version: event.event_version || 1,
        source_type: event.source_type,
        source_id: event.source_id,
        source_registry_id: event.source_registry_id,
        source_hash: event.source_hash,
        source_metadata: event.source_metadata || {},
        analysis_type: event.analysis_type,
        analysis_subtype: event.analysis_subtype,
        analysis_model: event.analysis_model,
        analysis_version: event.analysis_version,
        raw_result: event.raw_result,
        confidence_score: event.confidence_score,
        key_insights: event.key_insights,
        tags: event.tags,
        entities_mentioned: event.entities_mentioned,
        processing_duration_ms: event.processing_duration_ms,
        cost_cents: event.cost_cents,
        tokens_used: event.tokens_used
      })
      .select('id, sequence_number')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true, 
      event_id: data.id, 
      sequence_number: data.sequence_number 
    };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Gets the latest aggregate state for a profile
 */
export async function getAggregate(
  supabase: AnySupabase,
  userId: string,
  profileId: string,
  aggregateType: AnalysisType
): Promise<{ state: Record<string, unknown>; version: number; needs_rebuild: boolean } | null> {
  const { data, error } = await supabase
    .from('analysis_aggregates')
    .select('current_state, version, needs_rebuild')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('aggregate_type', aggregateType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const d = data as { current_state: unknown; version: number; needs_rebuild: boolean };
  return {
    state: d.current_state as Record<string, unknown>,
    version: d.version,
    needs_rebuild: d.needs_rebuild
  };
}

/**
 * Triggers aggregate rebuild via database function
 */
export async function triggerAggregateRebuild(
  supabase: AnySupabase,
  userId: string,
  profileId: string,
  aggregateType: AnalysisType
): Promise<{ success: boolean; event_count?: number; duration_ms?: number }> {
  try {
    const { data } = await supabase.rpc('rebuild_analysis_aggregate', {
      p_user_id: userId,
      p_profile_id: profileId,
      p_aggregate_type: aggregateType
    });
    const d = data as { success?: boolean; event_count?: number; duration_ms?: number } | null;
    return {
      success: d?.success || false,
      event_count: d?.event_count,
      duration_ms: d?.duration_ms
    };
  } catch {
    return { success: false };
  }
}

/**
 * Creates a snapshot of the current aggregate state
 */
export async function createSnapshot(
  supabase: AnySupabase,
  aggregateId: string,
  userId: string,
  profileId: string,
  aggregateType: string,
  snapshotType: 'periodic' | 'milestone' | 'user_requested' | 'pre_deletion' = 'periodic'
): Promise<string | null> {
  // Get current aggregate state
  const { data: aggregate } = await supabase
    .from('analysis_aggregates')
    .select('current_state, last_event_sequence, total_events')
    .eq('id', aggregateId)
    .single();

  if (!aggregate) return null;
  const agg = aggregate as { current_state: unknown; last_event_sequence: number; total_events: number };

  // Get last snapshot
  const { data: lastSnapshot } = await supabase
    .from('analysis_snapshots')
    .select('snapshot_sequence, event_count_at_snapshot')
    .eq('aggregate_id', aggregateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ls = lastSnapshot as { event_count_at_snapshot?: number } | null;
  const eventsSinceLast = agg.total_events - (ls?.event_count_at_snapshot || 0);

  const { data, error } = await supabase
    .from('analysis_snapshots')
    .insert({
      aggregate_id: aggregateId,
      user_id: userId,
      profile_id: profileId,
      aggregate_type: aggregateType,
      snapshot_sequence: agg.last_event_sequence,
      snapshot_data: agg.current_state,
      snapshot_type: snapshotType,
      event_count_at_snapshot: agg.total_events,
      events_since_last_snapshot: eventsSinceLast
    })
    .select('id')
    .single();

  return error ? null : (data as { id: string }).id;
}

/**
 * Marks an asset as deleted while preserving all analysis
 */
export async function markAssetDeleted(
  supabase: AnySupabase,
  userId: string,
  assetType: SourceType,
  assetId: string,
  reason?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('source_asset_registry')
    .update({
      deleted_at: new Date().toISOString(),
      deletion_reason: reason || 'Source asset removed',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('asset_type', assetType)
    .eq('asset_id', assetId);

  return !error;
}

/**
 * Gets analysis event history for a profile
 */
export async function getEventHistory(
  supabase: AnySupabase,
  userId: string,
  profileId: string,
  options: {
    limit?: number;
    offset?: number;
    analysisTypes?: AnalysisType[];
    includeDeleted?: boolean;
  } = {}
): Promise<AnalysisEvent[]> {
  let query = supabase
    .from('analysis_events')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .order('sequence_number', { ascending: false });

  if (!options.includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  if (options.analysisTypes?.length) {
    query = query.in('analysis_type', options.analysisTypes);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get event history:', error);
    return [];
  }

  return data as AnalysisEvent[];
}

/**
 * Verifies hash chain integrity for audit purposes
 */
export async function verifyEventChain(
  supabase: AnySupabase,
  userId: string,
  profileId?: string,
  startSequence?: number,
  endSequence?: number
): Promise<{ valid: boolean; broken_at?: number; checked_count: number }> {
  let query = supabase
    .from('analysis_events')
    .select('sequence_number, event_hash, previous_hash')
    .eq('user_id', userId)
    .order('sequence_number', { ascending: true });

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  if (startSequence) {
    query = query.gte('sequence_number', startSequence);
  }

  if (endSequence) {
    query = query.lte('sequence_number', endSequence);
  }

  const { data: events, error } = await query;

  if (error || !events?.length) {
    return { valid: true, checked_count: 0 };
  }

  let previousHash: string | null = null;
  
  for (const event of events) {
    if (previousHash !== null && event.previous_hash !== previousHash) {
      return { 
        valid: false, 
        broken_at: event.sequence_number, 
        checked_count: events.indexOf(event) 
      };
    }
    previousHash = event.event_hash;
  }

  return { valid: true, checked_count: events.length };
}
