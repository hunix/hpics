/**
 * Application Version Management
 * Used for cache busting and version tracking
 * 
 * v3.9.56: AI Model Registry Refresh (May 2026)
 *          - Added 11 new models across AIModelSelector, BulkMetadataGenerator, ModelEfficiencyComparison, aiPricing
 *          - New Google: gemini-3-flash-preview (default), gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite-preview, gemini-3.1-flash-image-preview
 *          - New OpenAI: gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, gpt-5.4-pro, gpt-5.5, gpt-5.5-pro
 *          - Default standardized to google/gemini-3-flash-preview; tiers rebalanced (speed→3.1-flash-lite, balanced→3-flash, quality→3.1-pro/gpt-5.5, extreme→gpt-5.5-pro)
 * v3.9.55: Architecture & Security Audit (May 2026)
 *          - Locked down 90+ SECURITY DEFINER functions: REVOKE PUBLIC/anon, GRANT authenticated only for non-trigger fns
 *          - Fixed mutable search_path on update_updated_at_column
 *          - Tightened service-role write policies on audit/detection/media tables
 *          - face-crops storage bucket now owner-scoped (was public)
 *          - Wired ESLint gates: no-restricted-imports for monolithic types, no-restricted-syntax for direct supabase.functions.invoke
 *          - Linter: 190 → 95 warnings (remaining are intentional authenticated RPC surface, documented in security memory)
 * v3.9.54: Voice Intelligence Pipeline & Task Runner Sync
 *          - Fixed voiceIntel section to pull from voice_insights table (791 analyzed records)
 *          - Added voice_intelligence_aggregate to section data sources
 *          - Synced backend task runner: 44 → 94 tasks (added 50 v7.0/v8.0 engines)
 *          - Updated CoreSectionRenderers to display topics, emotions, stress from voice_insights
 * v3.9.53: Section & Task Count Correction
 *          - Corrected hardcoded counts to actual values
 *          - 124 dossier sections (was incorrectly 161)
 *          - 94 intelligence tasks (was incorrectly 85)
 * v3.9.52: Initial section/task count update (incorrect values)
 * v3.9.20: Dossier Preview UX Improvements
 *          - Added loading screen with progress indicator
 *          - Added formatters for percentages, scores, empty states
 *          - Added dedicated "Cache & Updates" section in Settings
 * v3.9.18: Dossier Preview Page
 *          - Added /dossier-preview/:profileId route
 *          - Integrated view buttons in PDFDossierGenerator, DeepIntelligencePanel
 * v3.9.16: Extended Schema Alignment
 *          - Fixed life_milestones → contact_life_milestones (4 functions)
 *          - Fixed calendar_events → events (2 functions)
 *          - Fixed interaction_history → contact_interaction_notes (3 functions)
 *          - Fixed contact_enrichment_data → contact_observations (1 function)
 * v3.9.15: Schema alignment - Added unique constraints, fixed column mismatches, health checks, auth patterns
 * v3.9.10: Extended Edge Function Schema Alignment Phase 5
 *          - Fixed mosaic-intelligence-fuser: insert → upsert for ai_analyses
 *          - Fixed adversary-profiler: added health check
 *          - Fixed threat-actor-profiler: added health check, dual auth, ai_analyses persistence
 *          - Fixed vulnerability-window-detector: added health check, dual auth, ai_analyses persistence
 *          - Fixed manipulation-vulnerability-assessment: added dual auth pattern
 * v3.9.9: Extended Edge Function Schema Alignment Phase 4
 *         - Fixed ai_analyses insert → upsert: behavioral-dna-sequencer, enhanced-deception-detector
 *         - Fixed pattern-of-life-engine: added health check, dual auth, ai_analyses persistence,
 *           fixed table reference interaction_history → contact_interaction_notes
 *         - Fixed elicitation-engine: added health check, dual auth, ai_analyses persistence
 *         - Fixed nlp-hypnotic-patterns: added health check, dual auth, ai_analyses persistence
 *         - Fixed generate-playbook: added health check, dual auth, ai_analyses persistence
 * v3.9.8: Extended Edge Function Schema Alignment Phase 3
 *         - Fixed ai_analyses persistence: insert → upsert for idempotency
 *           (coercion-resistance-assessor, existential-leverage-calculator, network-exploitation-mapper)
 *         - Added health check + ai_analyses persistence to sacred-values-mapper
 *         - Added health check + ai_analyses persistence to choice-architecture-optimizer
 *         - Added dual auth pattern (user token + service role) to sacred-values-mapper
 * v3.9.7: Extended Edge Function Schema Alignment Phase 2
 *         - Fixed shadow-network-analyzer: interaction_history → contact_interaction_notes
 *         - Added ai_analyses persistence to 10 additional functions:
 *           personality-dna-extractor, gottman-relationship-analyzer, family-systems-analyzer,
 *           breaking-point-calculator, betrayal-likelihood-scorer, identity-destabilization-engine,
 *           cult-tactics-engine, dependency-orchestrator
 * v3.9.6: Extended Edge Function Schema Alignment
 *         - Fixed analyze-influence-profile: interaction_notes → contact_interaction_notes
 *         - Fixed power-network-analyzer: name → first_name/last_name, company → organization
 *         - Fixed temporal-fusion-transformer: interaction_history → contact_interaction_notes
 *         - Fixed predict-behavioral-scenarios: interaction_history → contact_interaction_notes
 *         - Fixed predict-relationship-trajectory: interaction_history → contact_interaction_notes
 *         - Fixed manipulation-vulnerability-assessment: analysis_type alignment
 *         - Added ai_analyses persistence to 6 more functions
 * v3.9.5: Comprehensive Edge Function Schema Alignment
 *         - Fixed table references: life_milestones → contact_life_milestones (mosaic-intelligence-fuser, precognitive-pattern-engine)
 *         - Fixed table references: voice_analyses → vocal_analyses, facial_emotion_analyses → facial_analyses (unified-data-fusion)
 *         - Fixed table references: relationships → contact_relationships (sectionDataSources.ts)
 *         - Added ai_analyses persistence to 6 functions: precognitive-pattern-engine, quantum-cognition-engine,
 *           reality-consensus-engine, narrative-control-engine, memetic-propagation-engine, semantic-warfare-engine
 *         - Fixed analysis type alignment: reality_testing → reality_consensus, precognitive_pattern → precognitive_patterns
 *         - Added health check to semantic-warfare-engine
 * v3.9.4: Edge Function Data Persistence Fix - Resolved disabled sections issue
 * v3.9.3: Analysis Type Alignment - Fixed section data source mapping to match edge function outputs
 * v3.9.2: Enterprise Session Recovery - Fixed edge function bugs causing session deadlock
 * v3.9.1: Force cache purge to fix stale route caching on /dossier-intelligence
 * v3.9.0: DDD Barrel Export Compliance - IDE performance optimization
 * v3.8.9: Schema Remediation - Fixed 13 edge functions with contact_observations column mismatches
 */
export const APP_VERSION = '3.9.56';
export const BUILD_TIMESTAMP = new Date().toISOString();

// Versions that require forced cache clear when upgrading FROM (never include current version!)
export const FORCE_CLEAR_VERSIONS = ['3.9.55', '3.9.54', '3.9.53', '3.9.52', '3.9.51', '3.9.50', '3.9.38', '3.9.35', '3.9.34', '3.9.20', '3.9.19', '3.9.18', '3.9.17', '3.9.16', '3.9.15', '3.9.14', '3.9.13', '3.9.12', '3.9.11', '3.9.10', '3.9.9', '3.9.8', '3.9.7', '3.9.6', '3.9.5', '3.9.4', '3.9.3', '3.9.2', '3.9.1', '3.9.0', '3.8.9', '3.8.8', '3.8.7', '3.8.6', '3.8.5', '3.8.4', '3.8.3', '3.8.2', '3.8.1', '3.8.0', '3.7.7', '3.7.6', '3.7.5', '3.7.4', '3.7.3', '3.7.2', '3.7.1', '3.7.0', '3.6.1', '3.6.0', '3.5.0'];

// Cache key for tracking chunk errors
const CHUNK_ERROR_KEY = 'chunk_error_count';
const CHUNK_ERROR_TIMESTAMP = 'chunk_error_timestamp';
const MAX_CHUNK_ERRORS = 2;
const CHUNK_ERROR_WINDOW_MS = 60000; // 1 minute

// Version check utilities
export function getStoredVersion(): string | null {
  try {
    return localStorage.getItem('app_version');
  } catch {
    return null;
  }
}

export function setStoredVersion(version: string): void {
  try {
    localStorage.setItem('app_version', version);
  } catch {
    console.warn('Failed to store app version');
  }
}

export function isVersionMismatch(): boolean {
  const stored = getStoredVersion();
  return stored !== null && stored !== APP_VERSION;
}

/**
 * Track chunk loading errors and trigger cache clear if threshold reached
 */
export function trackChunkError(): boolean {
  try {
    const now = Date.now();
    const lastTimestamp = parseInt(localStorage.getItem(CHUNK_ERROR_TIMESTAMP) || '0', 10);
    let errorCount = parseInt(localStorage.getItem(CHUNK_ERROR_KEY) || '0', 10);
    
    // Reset count if outside time window
    if (now - lastTimestamp > CHUNK_ERROR_WINDOW_MS) {
      errorCount = 0;
    }
    
    errorCount++;
    localStorage.setItem(CHUNK_ERROR_KEY, String(errorCount));
    localStorage.setItem(CHUNK_ERROR_TIMESTAMP, String(now));
    
    console.log(`[AppVersion] Chunk error tracked: ${errorCount}/${MAX_CHUNK_ERRORS}`);
    
    // Return true if we should trigger cache clear
    return errorCount >= MAX_CHUNK_ERRORS;
  } catch {
    return false;
  }
}

export function clearChunkErrorTracking(): void {
  try {
    localStorage.removeItem(CHUNK_ERROR_KEY);
    localStorage.removeItem(CHUNK_ERROR_TIMESTAMP);
  } catch {
    // Ignore
  }
}

export async function clearAllCaches(): Promise<void> {
  console.log('[AppVersion] Clearing all caches...');
  
  // Clear Service Worker caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`[AppVersion] Cleared ${cacheNames.length} cache(s)`);
    } catch (err) {
      console.warn('[AppVersion] Failed to clear caches:', err);
    }
  }
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log(`[AppVersion] Unregistered ${registrations.length} service worker(s)`);
    } catch (err) {
      console.warn('[AppVersion] Failed to unregister service workers:', err);
    }
  }
  
  // Clear chunk error tracking
  clearChunkErrorTracking();
}

export async function forceAppUpdate(): Promise<void> {
  console.log('[AppVersion] Forcing app update...');
  await clearAllCaches();
  setStoredVersion(APP_VERSION);
  
  // Force reload from server with cache bust
  const url = new URL(window.location.href);
  url.searchParams.set('_v', APP_VERSION);
  window.location.href = url.toString();
}

/**
 * Automatic cache bust on chunk error detection
 * Call this when a chunk loading error is detected
 */
export async function handleChunkLoadingError(error: Error): Promise<boolean> {
  const errorMsg = error.message.toLowerCase();
  const isChunkError = 
    errorMsg.includes('failed to fetch dynamically imported module') ||
    errorMsg.includes('loading chunk') ||
    errorMsg.includes('loading css chunk') ||
    errorMsg.includes('syntax error') ||
    errorMsg.includes('unexpected token');
  
  if (!isChunkError) return false;
  
  console.log('[AppVersion] Chunk loading error detected:', error.message);
  
  // Track the error and check if we should clear caches
  const shouldClear = trackChunkError();
  
  if (shouldClear) {
    console.log('[AppVersion] Chunk error threshold reached, forcing cache clear...');
    await forceAppUpdate();
    return true;
  }
  
  return false;
}
