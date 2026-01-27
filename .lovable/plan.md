
# Voice Intelligence Pipeline & Task Runner Sync Plan

## Summary

This plan fixes three critical gaps in the intelligence pipeline:

1. **Voice Intelligence Section** pulls from `voice_recording_sessions` (empty recordings) instead of `voice_insights` (791 analyzed records for Mona)
2. **Voice Intelligence Aggregate** analysis type is produced by the edge function but never consumed by the dossier
3. **Backend Task Runner** is out of sync - only has 44 tasks while frontend defines 94 tasks, missing all v7.0 and v8.0 engines

## Technical Details

### Issue 1: voiceIntel Section Uses Wrong Data Source

**Current State:**
- `useDossierData.ts` line 185: `supabase.from('voice_recording_sessions').select('*')`
- `sectionDataSources.ts` line 55: `voiceIntel: { type: 'table', table: 'voice_recording_sessions' }`

**Problem:**
The analyzed voice data is stored in `voice_insights` table (791 records for Mona), not in `voice_recording_sessions` which only contains raw recording session metadata.

### Issue 2: Missing Voice Intelligence Aggregate

**Current State:**
- `aggregate-voice-intelligence` edge function (line 239) stores results as `analysis_type: 'voice_intelligence_aggregate'`
- This analysis type is NOT queried in `useDossierData.ts`
- This analysis type is NOT mapped in `sectionDataSources.ts`

### Issue 3: Backend Task Runner Missing v7.0/v8.0 Tasks

**Current State in `intelligence-session-runner/index.ts`:**
| Priority | Category | Tasks |
|----------|----------|-------|
| 1-6 | Core through Fusion | 30 tasks |
| 7 | Defense Operations (v5.0) | 10 tasks |
| 8 | Advanced Fusion (v5.0) | 4 tasks |
| **TOTAL** | | **44 tasks** |

**Missing from Backend Runner:**
| Priority | Category | Tasks |
|----------|----------|-------|
| 9 | v6.0 Advanced Intelligence | 5 tasks |
| 10 | v7.0 Extreme Intelligence | 12 tasks |
| 11 | v8.0 Counter-Intelligence | 8 tasks |
| 12 | v8.0 Psychological Warfare | 10 tasks |
| 13 | v8.0 Biometric & Network | 8 tasks |
| 14 | v8.0 Doctrine & Advanced | 7 tasks |
| **TOTAL MISSING** | | **50 tasks** |

**Note:** The frontend `useIntelligenceGeneration.ts` already has all 94 tasks properly defined. The backend runner needs to be synced.

---

## Files to Modify

### 1. `src/components/reports/hooks/useDossierData.ts`

**Changes:**
- Line 17: Add `voiceInsightsData: any[];` to interface
- Line 155: Add `voiceIntelAggregateData: any[];` to interface
- Line 185: Change query from `voice_recording_sessions` to `voice_insights` with full field selection
- Add new query for `voice_intelligence_aggregate` from `ai_analyses` table
- Update return object to include both data sources

### 2. `src/components/reports/sections/sectionDataSources.ts`

**Changes:**
- Line 55: Change `voiceIntel` source from `voice_recording_sessions` to `voice_insights`
- Add new mapping for `voiceIntelAggregate: { type: 'ai_analyses', analysisType: 'voice_intelligence_aggregate' }`

### 3. `src/components/reports/sections/renderers/CoreSectionRenderers.ts`

**Changes:**
- Lines 355-400: Update `renderVoiceIntel` to consume `voice_insights` data structure:
  - Read from `data.voiceInsightsData` instead of `data.voiceData`
  - Extract fields: `full_transcription`, `topics_discussed`, `sentiment_timeline`, `keywords`, `speakers`
  - Display aggregated emotional/stress patterns from the insight records
  - Add support for voice_intelligence_aggregate display

### 4. `supabase/functions/intelligence-session-runner/index.ts`

**Changes:**
Add all missing tasks to `INTELLIGENCE_TASKS` array (lines 72-78):

```typescript
// v6.0 Advanced Intelligence (Priority 9) - 5 tasks
{ name: 'Relationship Half-Life', edgeFunction: 'relationship-half-life-calculator', analysisType: 'relationship_half_life', category: 'intelligence', priority: 9, complexity: 'complex' },
{ name: 'Automated Red Team', edgeFunction: 'automated-red-team-engine', analysisType: 'automated_red_team', category: 'warfare', priority: 9, complexity: 'extreme' },
{ name: 'Multi-Party Deception', edgeFunction: 'multi-party-deception-detector', analysisType: 'multi_party_deception', category: 'warfare', priority: 9, complexity: 'extreme' },
{ name: 'Zero-Day Anomaly', edgeFunction: 'zero-day-anomaly-detector', analysisType: 'zero_day_anomaly', category: 'intelligence', priority: 9, complexity: 'complex' },
{ name: 'Hypergame Theory', edgeFunction: 'hypergame-theory-engine', analysisType: 'hypergame_theory', category: 'intelligence', priority: 9, complexity: 'extreme' },

// v7.0 Extreme Intelligence (Priority 10) - 12 tasks
{ name: 'Subvocalization Detection', edgeFunction: 'subvocalization-detector', analysisType: 'subvocalization_detection', category: 'voice', priority: 10, complexity: 'complex' },
{ name: 'Audio Burst Analysis', edgeFunction: 'audio-burst-analyzer', analysisType: 'audio_burst_mental_state', category: 'voice', priority: 10, complexity: 'complex' },
{ name: 'IIO Attribution', edgeFunction: 'iio-attribution-engine', analysisType: 'iio_attribution', category: 'warfare', priority: 10, complexity: 'extreme' },
{ name: 'Reflexive Control', edgeFunction: 'reflexive-control-detector', analysisType: 'reflexive_control', category: 'warfare', priority: 10, complexity: 'extreme' },
{ name: 'Cognitive Effect', edgeFunction: 'cognitive-effect-orchestrator', analysisType: 'cognitive_effect', category: 'warfare', priority: 10, complexity: 'complex' },
{ name: 'Theory of Mind', edgeFunction: 'kallisti-theory-of-mind', analysisType: 'adversary_mental_model', category: 'intelligence', priority: 10, complexity: 'extreme' },
{ name: 'Collective Behavior', edgeFunction: 'collective-behavior-predictor', analysisType: 'collective_behavior', category: 'intelligence', priority: 10, complexity: 'complex' },
{ name: 'Stylometric Analysis', edgeFunction: 'stylometric-analyzer', analysisType: 'stylometric_fingerprint', category: 'intelligence', priority: 10, complexity: 'standard' },
{ name: 'Dark2Clear', edgeFunction: 'dark2clear-deanonymization', analysisType: 'surface_identity_bridge', category: 'intelligence', priority: 10, complexity: 'extreme' },
{ name: 'Gated Bio Fusion', edgeFunction: 'gated-biological-fusion', analysisType: 'gated_bio_fusion', category: 'fusion', priority: 10, complexity: 'complex' },
{ name: 'TAS-Com Community', edgeFunction: 'tas-com-community-detector', analysisType: 'tas_com_community', category: 'network', priority: 10, complexity: 'complex' },
{ name: 'Biometric Retention', edgeFunction: 'migration5-biometric-tracker', analysisType: 'biometric_retention', category: 'fusion', priority: 10, complexity: 'light' },

// v8.0 Counter-Intelligence (Priority 11) - 8 tasks
{ name: 'Draco Deception Orchestrator', edgeFunction: 'draco-deception-orchestrator', analysisType: 'draco_deception', category: 'warfare', priority: 11, complexity: 'extreme' },
{ name: 'Sentient Intent Analyzer', edgeFunction: 'sentient-intent-analyzer', analysisType: 'sentient_intent', category: 'intelligence', priority: 11, complexity: 'extreme' },
{ name: 'Insider Threat Matrix', edgeFunction: 'insider-threat-matrix-engine', analysisType: 'insider_threat_matrix', category: 'warfare', priority: 11, complexity: 'complex' },
{ name: 'Bayesian Intention Predictor', edgeFunction: 'bayesian-intention-predictor', analysisType: 'bayesian_intention', category: 'intelligence', priority: 11, complexity: 'complex' },
{ name: 'Red Team Adversary Simulator', edgeFunction: 'red-team-adversary-simulator', analysisType: 'red_team_simulation', category: 'warfare', priority: 11, complexity: 'extreme' },
{ name: 'SEMAFOR Forgery Detector', edgeFunction: 'semafor-forgery-detector', analysisType: 'semafor_forgery', category: 'intelligence', priority: 11, complexity: 'standard' },
{ name: 'Epistemic Vulnerability Scanner', edgeFunction: 'epistemic-vulnerability-scanner', analysisType: 'epistemic_vulnerability', category: 'intelligence', priority: 11, complexity: 'standard' },
{ name: 'Cognitive IW Detector', edgeFunction: 'cognitive-iw-detector', analysisType: 'cognitive_iw', category: 'warfare', priority: 11, complexity: 'complex' },

// v8.0 Psychological Warfare (Priority 12) - 10 tasks
{ name: 'Psychoagent Cascade Predictor', edgeFunction: 'psychoagent-cascade-predictor', analysisType: 'psychoagent_cascade', category: 'psychological', priority: 12, complexity: 'extreme' },
{ name: 'Affective Manipulation Detector', edgeFunction: 'affective-manipulation-detector', analysisType: 'affective_manipulation', category: 'psychological', priority: 12, complexity: 'complex' },
{ name: 'Hyperpersonalization Engine', edgeFunction: 'hyperpersonalization-engine', analysisType: 'hyperpersonalization', category: 'psychological', priority: 12, complexity: 'complex' },
{ name: 'Computational Persuasion', edgeFunction: 'computational-persuasion-engine', analysisType: 'computational_persuasion', category: 'psychological', priority: 12, complexity: 'complex' },
{ name: 'Synthetic Memory Generator', edgeFunction: 'synthetic-memory-generator', analysisType: 'synthetic_memory', category: 'psychological', priority: 12, complexity: 'extreme' },
{ name: 'PreMem Belief Modifier', edgeFunction: 'premem-belief-modifier', analysisType: 'premem_belief', category: 'psychological', priority: 12, complexity: 'extreme' },
{ name: 'Linguistic Stress Detector', edgeFunction: 'linguistic-stress-detector', analysisType: 'linguistic_stress', category: 'voice', priority: 12, complexity: 'standard' },
{ name: 'Memory Anchor Generator', edgeFunction: 'memory-anchor-generator', analysisType: 'memory_anchor', category: 'psychological', priority: 12, complexity: 'complex' },
{ name: 'Emotional Contagion Modeler', edgeFunction: 'emotional-contagion-modeler', analysisType: 'emotional_contagion', category: 'intelligence', priority: 12, complexity: 'complex' },
{ name: 'Sacred Value Predictor', edgeFunction: 'sacred-value-predictor', analysisType: 'sacred_value_prediction', category: 'psychological', priority: 12, complexity: 'complex' },

// v8.0 Biometric & Network (Priority 13) - 8 tasks
{ name: 'Pupillometry Analyzer', edgeFunction: 'pupillometry-analyzer', analysisType: 'pupillometry', category: 'biometric', priority: 13, complexity: 'standard' },
{ name: 'Thermal Stress Detector', edgeFunction: 'thermal-stress-detector', analysisType: 'thermal_stress', category: 'biometric', priority: 13, complexity: 'standard' },
{ name: 'Attention Multimodal Fuser', edgeFunction: 'attention-multimodal-fuser', analysisType: 'attention_multimodal', category: 'fusion', priority: 13, complexity: 'complex' },
{ name: 'Keystroke Dynamics Analyzer', edgeFunction: 'keystroke-dynamics-analyzer', analysisType: 'keystroke_dynamics', category: 'biometric', priority: 13, complexity: 'standard' },
{ name: 'Sheaf Neural Influence Mapper', edgeFunction: 'sheaf-neural-influence-mapper', analysisType: 'sheaf_influence', category: 'network', priority: 13, complexity: 'extreme' },
{ name: 'CTDG Link Predictor', edgeFunction: 'ctdg-link-predictor', analysisType: 'ctdg_link', category: 'network', priority: 13, complexity: 'complex' },
{ name: 'Cascade Virality Predictor', edgeFunction: 'cascade-virality-predictor', analysisType: 'cascade_virality', category: 'network', priority: 13, complexity: 'complex' },
{ name: 'Network Resilience Analyzer', edgeFunction: 'network-resilience-analyzer', analysisType: 'network_resilience', category: 'network', priority: 13, complexity: 'standard' },

// v8.0 Doctrine & Advanced (Priority 14) - 7 tasks
{ name: 'Gaze Pattern Analyzer', edgeFunction: 'gaze-pattern-analyzer', analysisType: 'gaze_pattern', category: 'biometric', priority: 14, complexity: 'standard' },
{ name: 'Micro-Expression Timeline', edgeFunction: 'micro-expression-timeline', analysisType: 'micro_expression_timeline', category: 'biometric', priority: 14, complexity: 'complex' },
{ name: 'Voice Stress Correlator', edgeFunction: 'voice-stress-correlator', analysisType: 'voice_stress_correlation', category: 'voice', priority: 14, complexity: 'standard' },
{ name: 'Social Graph Predictor', edgeFunction: 'social-graph-predictor', analysisType: 'social_graph_prediction', category: 'network', priority: 14, complexity: 'complex' },
{ name: 'Influence Campaign Optimizer', edgeFunction: 'influence-campaign-optimizer', analysisType: 'influence_campaign_optimization', category: 'warfare', priority: 14, complexity: 'extreme' },
{ name: 'Counter-Narrative Generator', edgeFunction: 'counter-narrative-generator', analysisType: 'counter_narrative', category: 'warfare', priority: 14, complexity: 'complex' },
{ name: 'Predictive Doctrine Engine', edgeFunction: 'predictive-doctrine-engine', analysisType: 'predictive_doctrine', category: 'warfare', priority: 14, complexity: 'extreme' },

// Voice Intelligence Aggregate (Priority 15) - 1 task
{ name: 'Voice Intelligence Aggregate', edgeFunction: 'aggregate-voice-intelligence', analysisType: 'voice_intelligence_aggregate', category: 'fusion', priority: 15, complexity: 'standard' },
```

### 5. `src/lib/appVersion.ts`

**Changes:**
- Bump `APP_VERSION` to `3.9.54`
- Add `3.9.53` to `FORCE_CLEAR_VERSIONS`
- Add changelog entry for voice pipeline and task sync fixes

---

## Implementation Order

1. Update `useDossierData.ts` - Add voice_insights query and voice_intelligence_aggregate
2. Update `sectionDataSources.ts` - Fix voiceIntel mapping
3. Update `CoreSectionRenderers.ts` - Refactor renderVoiceIntel to use new data structure
4. Update `intelligence-session-runner/index.ts` - Add 50 missing tasks + 1 voice aggregate task
5. Bump version in `appVersion.ts`
6. Deploy edge function

---

## Data Migration Note

**For Mona Abu Azab specifically:**
After implementing these changes, you should:
1. Run the "Generate Full Package" - this will now execute all 94 tasks including the new voice intelligence aggregate
2. The 791 voice insights already analyzed will be aggregated and displayed in the dossier
3. No need to re-analyze the 600+ audio files - the insights are already in the database

---

## Expected Outcome

After implementation:
- Voice Intelligence section will show data from `voice_insights` (791 records for Mona)
- Voice Intelligence Aggregate will be included in dossier generation
- Backend runner will execute all 94 tasks (was 44)
- Full sync between frontend task definitions and backend execution
- New v7.0/v8.0 engines will run during full package generation
