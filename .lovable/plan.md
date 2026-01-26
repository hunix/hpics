

# Fix Voice Analysis - Transcriptions Not Being Saved

## Problem Summary

Based on database and code analysis, I identified **three critical issues**:

1. **Column Name Mismatch** - The upsert to `voice_insights` uses wrong column names
2. **Silent Failures** - Errors are logged but processing continues as "successful"
3. **UI State Stuck** - Session detection logic prevents list re-enabling

## Root Cause Analysis

### Issue 1: Column Name Mismatch

The `voice_insights` table has different column names than what the code expects:

| Code Uses | Table Actually Has | Effect |
|-----------|-------------------|--------|
| `transcription_text` | `full_transcription` | Upsert fails |
| `transcription_chunks` | `transcription_with_timestamps` | Upsert fails |
| `overall_sentiment` | (does not exist) | Upsert fails |
| `processing_method` | `ai_model_used` | Upsert fails |

**Evidence from database:**
```sql
-- Table columns show:
full_transcription         -- NOT transcription_text
transcription_with_timestamps  -- NOT transcription_chunks
ai_model_used              -- NOT processing_method
-- NO overall_sentiment column
```

**Evidence from code (line 630-645):**
```typescript
await supabase.from('voice_insights').upsert({
  transcription_text: result.transcription.text,      // ❌ Wrong column
  transcription_chunks: result.transcription.chunks,  // ❌ Wrong column
  overall_sentiment: result.sentiment?.label,         // ❌ Column doesn't exist
  processing_method: 'local_whisper_turbo',           // ❌ Wrong column
  // ...
});
```

### Issue 2: Silent Failure

The insert error is logged but processing continues as successful:
```typescript
if (insertError) {
  console.error('[VoiceBulkAnalysis] Failed to save insights:', insertError);
}
// ← Processing continues, returns success: true
return { success: true, processingTimeMs: result.totalProcessingMs };
```

### Issue 3: Session State Not Clearing

- After completion, `session.status = 'completed'` but UI still shows disabled
- The "Start New" button is available but checkboxes remain disabled
- `isRunning` check at line 236 should return `false` when `status === 'completed'`
- **Actual issue**: The `interruptedSession` detection logic detects a "stuck" session on page refresh

## Solution Plan

### Phase 1: Fix Column Names in processLocalRecording

Update `src/hooks/useVoiceBulkAnalysis.ts` lines 630-645 to use correct column names:

```typescript
const { error: insertError } = await supabase.from('voice_insights').upsert({
  source_type: sourceType,
  source_id: recording.id,
  profile_id: recording.profile_id,
  user_id: userId,
  full_transcription: result.transcription.text,         // ✅ Correct column
  transcription_with_timestamps: result.transcription.chunks as unknown as Record<string, unknown>[],  // ✅ Correct column
  // Remove overall_sentiment - column doesn't exist
  confidence_score: result.sentiment?.confidence || 0.5,
  ai_model_used: 'local_whisper_turbo',                  // ✅ Correct column
  processing_time_ms: result.totalProcessingMs,
  language_detected: detectedLang,
  created_at: new Date().toISOString()
}, {
  onConflict: 'source_id'
});
```

### Phase 2: Add Error Propagation

Make the insert failure throw an error so it gets properly tracked:

```typescript
if (insertError) {
  console.error('[VoiceBulkAnalysis] Failed to save insights:', insertError);
  throw new Error(`Failed to save transcription: ${insertError.message}`);
}
```

### Phase 3: Update Item Status with Transcription

Store the transcription text in `voice_analysis_items` for backup:

```typescript
if (dbSessionId) {
  await updateDbItemStatus(dbSessionId, recording.id, 'completed', {
    transcription: result.transcription.text,
    language: detectedLang
  });
}
```

### Phase 4: Fix Session Cleanup on Completion

Ensure the database session is marked as completed properly:

```typescript
// After processing loop completes
if (dbSessionId) {
  await supabase
    .from('voice_analysis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_items: successCount,
      failed_items: failedRecordingsTracker.length,
    })
    .eq('id', dbSessionId);
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Fix column names, add error propagation, update session status |

## Technical Details

### Correct voice_insights Schema

```
id                              uuid (PK)
user_id                         uuid (required)
source_type                     text (required) - voice_note, media, etc.
source_id                       uuid (required)
profile_id                      uuid
full_transcription              text           ← Use this
transcription_with_timestamps   jsonb          ← Use this
confidence_score                numeric
ai_model_used                   text           ← Use this
processing_time_ms              integer
language_detected               text
created_at                      timestamp
updated_at                      timestamp
```

### Testing Steps

After implementation:

1. Navigate to `/analysis` → Voice tab
2. Select a contact with audio files
3. Choose **Local (Fast)** processing
4. Click **Start Analysis**
5. Verify all files complete successfully
6. Verify `voice_insights` table now has records
7. Refresh the page
8. Verify NO "stuck job" notification appears
9. Verify the list is enabled and analyzed files are excluded

## Expected Outcomes

1. **Transcriptions saved** - `voice_insights` table will have records
2. **Files marked as analyzed** - `hasVoiceInsights` check will work
3. **List properly enabled** - UI re-enables after completion
4. **No stuck jobs** - Session marked as truly completed
5. **Transcriptions accessible** - Analysis results can be viewed

