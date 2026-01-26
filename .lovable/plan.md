
# Fix Voice Analysis Source Type Constraint Violation

## Problem Identified

All 5 voice analysis files fail with the error:
> **"new row for relation 'voice_insights' violates check constraint 'voice_insights_source_type_check'"**

### Root Cause

The `voice_insights` table has a CHECK constraint that only allows these `source_type` values:
- `voice_note`
- `meeting_recording`
- `media`
- `whatsapp_audio`

But the code sends incompatible values:

| File | Line | Value Sent | Constraint Valid |
|------|------|------------|------------------|
| `useVoiceBulkAnalysis.ts` | 599 | `voice_recording_session` | ❌ No |
| `analyze-voice-comprehensive` | 147 | `voice_recording` | ❌ No |
| `VoiceBulkAnalysisPanel` (cloud mode) | 927 | `voice_recording` | ❌ No |

## Solution

Two-part fix:

### Part 1: Expand Database Constraint

Add `voice_recording_session` and `voice_recording` to the allowed values:

```sql
ALTER TABLE voice_insights 
DROP CONSTRAINT voice_insights_source_type_check;

ALTER TABLE voice_insights 
ADD CONSTRAINT voice_insights_source_type_check 
CHECK (source_type = ANY (ARRAY[
  'voice_note', 
  'meeting_recording', 
  'media', 
  'whatsapp_audio',
  'voice_recording_session',  -- NEW: For in-app recordings
  'voice_recording'           -- NEW: Generic voice recording
]));
```

### Part 2: Normalize Source Types in Code

Alternatively (or additionally), update the code to use consistent, valid source types:

**In `useVoiceBulkAnalysis.ts`** - Map recording sources to valid types:

```typescript
// Line 599 - local processing
const sourceTypeMap: Record<string, string> = {
  'voice_recording_sessions': 'voice_note',  // In-app recordings → voice_note
  'media': 'media'                           // Media files → media (already valid)
};
const mappedSourceType = sourceTypeMap[recording.source] || 'media';

const { error: insertError } = await supabase.from('voice_insights').upsert({
  source_type: mappedSourceType,  // Use mapped value
  // ... rest of fields
});
```

**In `analyze-voice-comprehensive`** - Normalize incoming source type:

```typescript
// Line 147 - normalize source type
const validSourceTypes = ['voice_note', 'meeting_recording', 'media', 'whatsapp_audio'];
const normalizedSourceType = validSourceTypes.includes(sourceType) 
  ? sourceType 
  : (sourceType.includes('recording') ? 'voice_note' : 'media');

const insightData = {
  source_type: normalizedSourceType,
  // ... rest of fields
};
```

## Recommended Approach

**Expand the constraint** to support all legitimate source types. This is cleaner and self-documenting.

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/...` | Alter constraint to add new values |
| `src/hooks/useVoiceBulkAnalysis.ts` | (Optional) Map source types for consistency |
| `supabase/functions/analyze-voice-comprehensive/index.ts` | (Optional) Normalize source type |

## Technical Notes

- The constraint modification is a safe operation - it expands allowed values, doesn't restrict existing data
- Both the local processing path (`processLocalRecording`) and cloud path (`analyze-voice-comprehensive`) need to use valid source types
- The `process-voice-analysis-runner` edge function inherits the same issue when it calls `analyze-voice-comprehensive`

## Testing Steps

After implementation:

1. Navigate to `/analysis` → Voice tab
2. Select a contact with audio files
3. Choose **Local (Fast)** processing mode
4. Click **Start Analysis**
5. Verify files now complete successfully instead of showing "5 failed"
6. Check `voice_insights` table for new records
