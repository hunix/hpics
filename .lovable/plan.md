
# Fix: Voice Analysis UI Not Reflecting Analyzed Files

## Problem Identified

After analyzing 10+ voice files successfully, the UI still shows:
- "Select Unanalyzed (881)" count unchanged
- "Hide analyzed" toggle not filtering anything
- No "Analyzed" badge on completed files
- Analyzed files remain selected

## Root Cause: URL Too Long for Supabase Query

The `fetchRecordings` function queries `voice_insights` to check which recordings have already been analyzed. With 881 audio files, the query uses:

```typescript
.in('source_id', recordingIds) // 881 UUIDs
```

This generates a URL over **10,000 characters** which exceeds the HTTP URL length limit (~8KB). The server returns a **400 Bad Request** error, but the code doesn't check for errors and continues with an empty result set.

**Evidence from network logs:**
```
Status: 400 (Bad Request)
URL: /rest/v1/voice_insights?select=source_id&source_id=in.(uuid1,uuid2,...881 total)
Response Body: Bad Request
```

## Solution: Batch the Query or Use Alternative Strategy

### Option A: Batch the `.in()` Query (Recommended)

Split the 881 IDs into chunks of 100-200 and query in parallel:

```typescript
// Instead of one query with 881 IDs
const BATCH_SIZE = 100;
const batches = chunk(recordingIds, BATCH_SIZE);

const batchResults = await Promise.all(
  batches.map(batch =>
    supabase
      .from('voice_insights')
      .select('source_id')
      .in('source_id', batch)
  )
);

const existingInsights = batchResults.flatMap(r => r.data || []);
```

### Option B: Query All Insights for Profile

Instead of filtering by `source_id`, get all insights for the profile and match locally:

```typescript
const { data: existingInsights } = await supabase
  .from('voice_insights')
  .select('source_id')
  .eq('profile_id', profileId);

const insightSourceIds = new Set(existingInsights?.map(i => i.source_id) || []);
```

This is simpler and the query URL stays short. The profile typically has fewer insights than recordings.

### Option C: Add Error Handling

Regardless of the fix chosen, add proper error handling:

```typescript
const { data: existingInsights, error } = await supabase
  .from('voice_insights')
  .select('source_id')
  .in('source_id', recordingIds);

if (error) {
  console.error('[VoiceBulkAnalysis] Failed to check insights:', error);
  // Fallback: try batch approach or profile-based query
}
```

## Additional Fixes Required

### 1. Clear Selection After Analysis

When analysis completes, remove analyzed files from selection:

```typescript
// After refetch, update selection to remove analyzed items
setSelectedRecordings(prev => {
  const updated = new Set(prev);
  recordingsWithStatus.forEach(r => {
    if (r.hasVoiceInsights) {
      updated.delete(r.id);
    }
  });
  return updated;
});
```

### 2. Verify "Hide Analyzed" Toggle Works

The toggle logic at line 178 is correct:
```typescript
if (hideAnalyzed) {
  filtered = filtered.filter(r => !r.hasVoiceInsights);
}
```

This will work once `hasVoiceInsights` is set correctly after fixing the query.

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | 1. Change query strategy (Option A or B) 2. Add error handling 3. Clear selection on completion |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Optionally add callback to clear selection |

## Implementation Steps

1. **Modify `fetchRecordings` function** (lines 520-537):
   - Replace single `.in()` query with batched approach OR profile-based query
   - Add error handling with fallback

2. **Modify completion handler** (around line 1154):
   - After `fetchRecordings(profileId)` completes, expose the updated recordings
   - Allow parent component to clear analyzed items from selection

3. **Update selection state**:
   - Either in the hook (by returning the updated state)
   - Or in the component (by checking after refresh)

## Technical Details

### Why the Current Approach Fails

```text
fetchRecordings()
    │
    ├── Get 881 recordings from media table ✓
    │
    ├── Query voice_insights with .in('source_id', [881 UUIDs])
    │   │
    │   └── URL: 10,000+ characters → HTTP 400 Bad Request
    │
    ├── { data: undefined, error: {...} }
    │   │
    │   └── Code uses: existingInsights?.map() → []
    │
    └── All recordings get hasVoiceInsights: false ✗
```

### Recommended Fix Flow

```text
fetchRecordings()
    │
    ├── Get 881 recordings from media table ✓
    │
    ├── Query voice_insights with .eq('profile_id', profileId)
    │   │
    │   └── URL: Short, works perfectly ✓
    │
    ├── Match source_ids locally in JavaScript
    │
    └── Analyzed recordings get hasVoiceInsights: true ✓
```

## Expected Outcome After Fix

1. **Correct Count**: "Select Unanalyzed (866)" after analyzing 15 files
2. **Toggle Works**: "Hide analyzed" filters out analyzed files
3. **Visual Indicator**: "Analyzed" badge appears on completed files
4. **Selection Cleared**: Analyzed files are deselected automatically
5. **No Duplicates**: Can't accidentally re-analyze the same file
