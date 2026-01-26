
# Fix Voice Analysis: UI Refresh + Cloud Transcription Issues

## Problems Identified

You ran Cloud mode on 5 WhatsApp `.opus` files. The analysis "completed" but:
1. **Unanalyzed count stayed at 881** (should be 876)
2. **Files still show in the "unanalyzed" list** (should be filtered out or show "Analyzed" badge)
3. **Transcription is empty** (database shows `full_transcription: NULL`)

## Root Causes

### Issue 1: UI State Not Refreshing After Completion

**Evidence**: The `fetchRecordings(profileId)` call at line 1143 should update the state, but the count stays the same.

**Problem**: The hook uses local `useState` instead of React Query. When `fetchRecordings` runs after completion, it:
1. Queries `voice_insights` table for matching `source_id`
2. Database returns the 5 new records correctly
3. **BUT** the React state update may not trigger a re-render properly OR there's a timing issue where the completion toast fires before the state updates

**Solution**:
- Add a small delay (100-200ms) before the refetch to ensure database commit is complete
- Add explicit console logging to verify the refetch is running and returning updated data
- Consider using React Query for this data to get automatic invalidation

### Issue 2: Cloud Transcription Returns NULL

**Evidence**: Database shows all 5 `voice_insights` records have:
- `ai_model_used: google/gemini-2.5-flash` (AI analysis ran)
- `processing_time_ms: 882-1039ms` (processing completed)
- `full_transcription: NULL` (transcription failed)

**Problem**: The Edge function uses ElevenLabs Scribe for transcription:
1. Downloads audio from signed URL
2. Sends to ElevenLabs `/v1/speech-to-text` endpoint
3. ElevenLabs likely fails on `.opus` format or the audio URL is expired/inaccessible
4. `transcriptionData?.text` is null, so NULL is saved

**Solution**:
- Add detailed logging in the Edge function to capture ElevenLabs response
- Verify the audio URL is accessible (signed URL may be expired by the time Edge function runs)
- Add fallback: if ElevenLabs fails, use a simpler transcription path

## Implementation Plan

### Step 1: Fix UI Refresh Issue

**File**: `src/hooks/useVoiceBulkAnalysis.ts`

1. Add a small delay before refetch to ensure database transaction commits:
   ```typescript
   // Wait 200ms for database transaction to fully commit
   await new Promise(resolve => setTimeout(resolve, 200));
   
   // Refresh recordings to update status
   console.log('[VoiceBulkAnalysis] Refetching recordings after completion...');
   await fetchRecordings(profileId);
   ```

2. Add verification logging in `fetchRecordings`:
   ```typescript
   console.log(`[VoiceBulkAnalysis] Found ${insightSourceIds.size} existing insights for ${recordingIds.length} recordings`);
   ```

3. Force a state update by creating a new array reference:
   ```typescript
   setRecordings([...recordingsWithStatus]);
   ```

### Step 2: Fix Cloud Transcription

**File**: `supabase/functions/analyze-voice-comprehensive/index.ts`

1. Add better logging for ElevenLabs response:
   ```typescript
   console.log(`[VoiceComprehensive] ElevenLabs response status: ${transcribeResponse.status}`);
   if (!transcribeResponse.ok) {
     const errorText = await transcribeResponse.text();
     console.error(`[VoiceComprehensive] ElevenLabs error: ${errorText}`);
   }
   ```

2. Verify audio URL is accessible before processing:
   ```typescript
   const audioResponse = await fetch(audioUrl);
   console.log(`[VoiceComprehensive] Audio fetch status: ${audioResponse.status}, content-type: ${audioResponse.headers.get('content-type')}`);
   ```

3. Add proper error handling for transcription failure:
   ```typescript
   if (!transcriptionData || !transcriptionData.text) {
     console.warn('[VoiceComprehensive] No transcription returned, proceeding with AI-only analysis');
   }
   ```

### Step 3: Fix Source Type Mismatch

**File**: `src/hooks/useVoiceBulkAnalysis.ts` (lines 1005-1011)

The code passes `sourceType: 'voice_recording'` regardless of the actual source:
```typescript
// BEFORE (incorrect):
sourceType: 'voice_recording',

// AFTER (correct):
sourceType: recording.source === 'media' ? 'media' : 'voice_recording',
```

This fix ensures:
1. The Edge function knows the correct source type
2. The `media` table sync logic at line 197 executes properly
3. Cross-system tracking works correctly

## Technical Details

### Why the State Refresh Fails

The `startBulkAnalysis` function is a `useCallback` that captures `fetchRecordings` in its dependency array. When `fetchRecordings` runs at line 1143:

1. It queries Supabase (asynchronous)
2. Returns results
3. Calls `setRecordings(recordingsWithStatus)`
4. React should re-render

However, because the analysis loop is long-running (minutes), there could be:
- Stale closure issues where the component has re-rendered multiple times
- React batching the state update in an unexpected way
- The toast appearing before the state propagates

### Why ElevenLabs Transcription Fails

Possible causes:
1. **Signed URL expired**: The audio URL passed to the Edge function may have expired before it tries to download
2. **Format issue**: ElevenLabs may not fully support OGG/Opus from WhatsApp
3. **Network timeout**: Edge function's fetch to ElevenLabs may timeout silently

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Add delay before refetch, fix sourceType, add logging |
| `supabase/functions/analyze-voice-comprehensive/index.ts` | Add ElevenLabs error logging, verify audio URL |

## Testing Plan

1. **Local mode**: Test that the WASM Opus decoder fix from earlier works (separate issue)
2. **Cloud mode**: Run 2-3 `.opus` files, verify:
   - Console shows `[VoiceBulkAnalysis] Refetching recordings after completion...`
   - Console shows `[VoiceBulkAnalysis] Found X existing insights...`
   - Unanalyzed count decreases
   - Files show "Analyzed" badge or get filtered out
3. **Edge function logs**: Check for ElevenLabs error messages
4. **Database**: Verify `full_transcription` is no longer NULL after fix
