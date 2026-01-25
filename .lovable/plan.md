

# Cross-System Voice Analysis Flagging & Status Sync

## Problem Summary

When voice analysis completes (via `useVoiceBulkAnalysis`), results are saved to `voice_insights` table but the source `media` table is **not updated**. This causes:

1. **Media Analysis Hub shows audio files as "pending"** - It checks `m.ai_metadata IS NULL` (line 183)
2. **No cross-system tracking** - Voice analysis status isn't reflected in `media.completed_analysis_modes`
3. **Risk of re-analysis** - Users might accidentally re-analyze already-processed files from Media Hub

---

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      VOICE ANALYSIS COMPLETION                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  useVoiceBulkAnalysis.ts                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  1. Process audio file with Whisper                          │   │
│  │  2. Save to voice_insights table                             │   │
│  │  3. ✅ NEW: Sync status to media table if source='media'     │   │
│  │     - Update completed_analysis_modes += 'voice_transcription'│   │
│  │     - Update ai_generation_status = 'completed' (if first)   │   │
│  │     - Update last_analysis_at = now()                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  analyze-voice-comprehensive (Edge Function)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Same pattern: After voice_insights insert, sync to media    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Already Exists)

The `media` table already has these columns (no migration needed):

| Column | Type | Purpose |
|--------|------|---------|
| `ai_metadata` | JSONB | Stores AI analysis results |
| `ai_generation_status` | TEXT | `pending` / `running` / `completed` / `failed` |
| `completed_analysis_modes` | TEXT[] | Array of completed modes |
| `last_analysis_at` | TIMESTAMPTZ | Last analysis timestamp |

**Existing analysis modes in production:**
- `mosaic_metadata`, `face_intelligence`, `scene_intelligence`, `lifestyle_profiling`, `document_extraction`, `relationship_mapping`, `security_scan`

**New mode to add:**
- `voice_transcription` - For Whisper/ElevenLabs transcription
- `voice_psychology` - For psychological voice analysis (optional, cloud-only)

---

## Technical Changes

### File 1: `src/hooks/useVoiceBulkAnalysis.ts`

**Add helper function to sync media table after voice analysis:**

```typescript
// After processLocalRecording or cloud analysis succeeds
const syncMediaAnalysisStatus = async (
  recording: VoiceRecording,
  analysisModes: string[]
): Promise<void> => {
  // Only sync if source is 'media' table (not voice_recording_sessions)
  if (recording.source !== 'media') return;

  try {
    // Fetch existing completed modes
    const { data: existing } = await supabase
      .from('media')
      .select('completed_analysis_modes')
      .eq('id', recording.id)
      .single();

    const existingModes = existing?.completed_analysis_modes || [];
    const allModes = [...new Set([...existingModes, ...analysisModes])];

    // Update media record
    await supabase
      .from('media')
      .update({
        completed_analysis_modes: allModes,
        last_analysis_at: new Date().toISOString(),
        ai_generation_status: 'completed',
      })
      .eq('id', recording.id);

    console.log(`[VoiceBulkAnalysis] Synced media ${recording.id} with modes: ${allModes.join(', ')}`);
  } catch (error) {
    console.warn('[VoiceBulkAnalysis] Failed to sync media status:', error);
    // Non-fatal - continue processing
  }
};
```

**Update `processLocalRecording` to call sync after success:**

```typescript
// After voice_insights upsert succeeds
if (!insertError && recording.source === 'media') {
  await syncMediaAnalysisStatus(recording, ['voice_transcription']);
}
```

**Update cloud/hybrid processing to also sync:**

```typescript
// After successful cloud analysis
if (recording.source === 'media') {
  const modes = ['voice_transcription'];
  if (analysisOptions.vocalPsychology) modes.push('voice_psychology');
  if (analysisOptions.contentIntelligence) modes.push('voice_content_intelligence');
  await syncMediaAnalysisStatus(recording, modes);
}
```

### File 2: `supabase/functions/analyze-voice-comprehensive/index.ts`

**Add media sync after Step 4 (voice_insights insert):**

```typescript
// Step 4.5: Sync to media table if source is media
if (sourceType === 'media' && sourceId) {
  try {
    const { data: existing } = await supabase
      .from('media')
      .select('completed_analysis_modes')
      .eq('id', sourceId)
      .single();

    const existingModes = existing?.completed_analysis_modes || [];
    const newModes = ['voice_transcription'];
    if (options.vocalPsychology) newModes.push('voice_psychology');
    if (options.contentIntelligence) newModes.push('voice_content_intelligence');
    
    const allModes = [...new Set([...existingModes, ...newModes])];

    await supabase
      .from('media')
      .update({
        completed_analysis_modes: allModes,
        last_analysis_at: new Date().toISOString(),
        ai_generation_status: 'completed',
      })
      .eq('id', sourceId);

    console.log(`[VoiceComprehensive] Synced media ${sourceId} with modes: ${allModes.join(', ')}`);
  } catch (syncError) {
    console.warn('[VoiceComprehensive] Media sync failed:', syncError);
    // Non-fatal - insight was already saved
  }
}
```

### File 3: `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

**Enhance the "hasVoiceInsights" badge to also check media.completed_analysis_modes:**

The current implementation already checks `voice_insights.source_id`, which is correct. No changes needed here, but we should add a visual indicator showing the sync status.

**Add a note about cross-system sync:**

```tsx
{session?.status === 'completed' && (
  <p className="text-xs text-muted-foreground mt-1">
    ✓ Analysis status synced to Media Hub
  </p>
)}
```

---

## Analysis Mode Naming Convention

To maintain consistency with existing modes:

| Mode | Description | When Added |
|------|-------------|------------|
| `voice_transcription` | Whisper/Scribe transcription | Local or cloud transcription |
| `voice_psychology` | Psychological voice analysis | Cloud with vocalPsychology=true |
| `voice_content_intelligence` | Content extraction from audio | Cloud with contentIntelligence=true |
| `voice_biometrics` | Voice signature analysis | Cloud with voiceBiometrics=true |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Add `syncMediaAnalysisStatus` helper, call after successful processing |
| `supabase/functions/analyze-voice-comprehensive/index.ts` | Add Step 4.5 to sync media table after voice_insights insert |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Add sync confirmation message |

---

## Expected Behavior After Implementation

1. **Local Analysis**: When you process 6 WhatsApp audio files locally:
   - Each file's `voice_insights` record is created
   - Each file's `media.completed_analysis_modes` gets `['voice_transcription']`
   - Each file's `media.ai_generation_status` becomes `'completed'`
   - Media Hub no longer shows these as "pending"

2. **Cloud Analysis**: Same behavior, plus additional modes like `voice_psychology`

3. **Re-analysis Prevention**: The `hasVoiceInsights` check (via `voice_insights.source_id`) already prevents duplicates in Voice Hub. Now Media Hub will also respect the `completed_analysis_modes` array.

---

## Restart Guidance

Since your previous analysis didn't save any data (0 records in `voice_insights`), you should:

1. **Wait for this implementation to be deployed**
2. **Publish the updated code**
3. **Run the analysis again on the published site**
4. **Watch the console for `[VoiceBulkAnalysis]` sync logs**

