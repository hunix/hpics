
# Fix Voice Analysis Audio File Download Failures

## Problem Identified

All 5 voice files fail with: **"Failed to download audio file"**

### Root Cause

| Issue | Evidence |
|-------|----------|
| `media` bucket is **private** | `storage.buckets` shows `public: false` |
| Files stored with **public URLs** | `file_url` uses `/storage/v1/object/public/media/...` pattern |
| Browser cannot access private files | `fetch(url, { method: 'HEAD' })` returns 403 Forbidden |
| `storage_path` exists but unused | Media records have valid `storage_path` column |

The `localAudioAnalyzer.validateAudioUrl()` method tries to HEAD-fetch the public URL, which fails for a private bucket. The error is then classified as "Failed to download audio file".

## Solution: Generate Signed URLs for Local Processing

Before processing audio files locally, generate fresh signed URLs using the `storage_path` instead of relying on the public `file_url`.

### Architecture Change

```text
Before:
┌─────────────────────────────────────────────────────────┐
│  VoiceRecording.audio_url (public URL)                  │
│            ↓                                            │
│  localAudioAnalyzer.validateAudioUrl()                  │
│            ↓                                            │
│  fetch(publicUrl, { method: 'HEAD' }) → 403 FAIL        │
└─────────────────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────────────────┐
│  VoiceRecording.audio_url + storage_path                │
│            ↓                                            │
│  getSignedUrl(storage_path) if storage_path exists      │
│            ↓                                            │
│  localAudioAnalyzer.analyzeAudioFile(signedUrl)         │
│            ↓                                            │
│  fetch(signedUrl) → 200 OK                              │
└─────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Extend VoiceRecording Type

Add `storage_path` to the `VoiceRecording` interface so it's available during processing.

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

```typescript
export interface VoiceRecording {
  id: string;
  audio_url: string;
  storage_path?: string; // NEW: For generating signed URLs
  title: string;
  // ...
}
```

### Phase 2: Fetch storage_path in Recording Queries

Update `fetchRecordings` to include `storage_path` from the `media` table.

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

```typescript
// In fetchRecordings - add storage_path to select
const { data: mediaRecordings } = await supabase
  .from('media')
  .select('id, file_url, storage_path, mime_type, ...')
  .eq('profile_id', contactId)
  .ilike('mime_type', 'audio/%');

// Map with storage_path
const mediaVoice: VoiceRecording[] = (mediaRecordings || []).map(m => ({
  id: m.id,
  audio_url: m.file_url,
  storage_path: m.storage_path || undefined,
  // ...
}));
```

### Phase 3: Generate Signed URL Before Processing

Add a helper function to get an accessible URL, preferring signed URLs for files with `storage_path`.

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

```typescript
// Get accessible URL - prefer signed URL for private bucket access
const getAccessibleUrl = async (recording: VoiceRecording): Promise<string> => {
  // If we have storage_path, generate a fresh signed URL
  if (recording.storage_path) {
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(recording.storage_path, 3600); // 1 hour expiry
    
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
    console.warn('[VoiceBulkAnalysis] Signed URL failed, falling back to public URL');
  }
  
  // Fallback to original URL
  return recording.audio_url;
};
```

### Phase 4: Use Accessible URL in processLocalRecording

Update the local processing to use signed URLs.

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

```typescript
// In processLocalRecording
const processLocalRecording = useCallback(async (
  recording: VoiceRecording,
  userId: string
): Promise<...> => {
  // Get accessible URL (signed for private bucket)
  const accessibleUrl = await getAccessibleUrl(recording);
  
  const result = await localAudioAnalyzer.analyzeAudioFile(accessibleUrl, {
    transcribe: true,
    analyzeSentiment: true
  });
  // ...
}, []);
```

### Phase 5: Update voice_analysis_items with storage_path

Store `storage_path` in the items table so the backend runner can also generate signed URLs.

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

```typescript
// In createDbSession - include storage_path
const items = selectedRecordings.map((rec, idx) => ({
  session_id: data.id,
  media_id: rec.source === 'media' ? rec.id : null,
  recording_id: rec.source === 'voice_recording_sessions' ? rec.id : null,
  source: rec.source,
  file_url: rec.audio_url,
  storage_path: rec.storage_path || null, // NEW
  file_name: rec.title,
  status: 'pending',
  queue_position: idx,
}));
```

### Phase 6: Update Backend Runner to Use Signed URLs

Ensure `process-voice-analysis-runner` generates signed URLs before calling transcription.

**File: `supabase/functions/process-voice-analysis-runner/index.ts`**

```typescript
// Get accessible URL for item
let audioUrl = item.file_url;
if (item.storage_path) {
  const { data: signedData } = await supabase.storage
    .from('media')
    .createSignedUrl(item.storage_path, 3600);
  if (signedData?.signedUrl) {
    audioUrl = signedData.signedUrl;
  }
}
```

### Phase 7: Add storage_path Column to voice_analysis_items

Add the column via migration to support the new field.

**SQL Migration:**

```sql
ALTER TABLE voice_analysis_items 
ADD COLUMN IF NOT EXISTS storage_path TEXT;
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Add `storage_path` to interface, fetch in queries, generate signed URLs |
| `supabase/functions/process-voice-analysis-runner/index.ts` | Use signed URLs for backend processing |
| `supabase/migrations/...` | Add `storage_path` column to `voice_analysis_items` |

## Technical Notes

- Signed URLs expire after 1 hour (3600 seconds), which is sufficient for processing
- The fallback to public URL handles edge cases where `storage_path` is missing
- This pattern mirrors `usePersistentBulkSession.tsx:481-485` which already implements signed URL generation

## Testing Steps

After implementation:

1. Navigate to `/analysis` → Voice tab
2. Select a contact with WhatsApp audio files (stored in private bucket)
3. Start **Local (Fast)** processing
4. Verify files now process successfully instead of showing "Failed to download audio file"
5. Check `voice_insights` table for new transcription records
