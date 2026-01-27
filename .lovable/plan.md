

# Bug Fix: Voice Analysis Session Not Marked Complete in Database

## Problem Identified

When voice analysis completes on all files:
1. The **local React state** is correctly updated to `status: 'completed'` (line 1147)
2. The **database `voice_analysis_sessions` table** is **NEVER updated** to `status: 'completed'`
3. On page refresh, the hook queries for sessions with `status IN ['running', 'paused']` and finds the stale session
4. This causes the "Interrupted Session Found" banner to appear with "25/25 processing in background" forever
5. Meanwhile, the UI remains disabled because `isRunning` is computed from a session that was never properly cleared

## Root Cause Analysis

The `startBulkAnalysis` function in `useVoiceBulkAnalysis.ts` (lines 1147-1156) only updates the **local state** when processing completes:

```typescript
// Line 1147-1156: LOCAL STATE ONLY - Database never updated!
setSession(prev => prev ? {
  ...prev,
  status: 'completed',
  phase: 'completed',
  completedAt: new Date().toISOString(),
  ...
} : null);
```

The `updateDbItemStatus` function updates individual **items** and increments counters via `increment_voice_session_progress`, but no code ever updates the **session** record itself to `status: 'completed'`.

Compare this to the backend runner (`process-voice-analysis-runner/index.ts` lines 346-355), which correctly marks the session complete in the database.

## Solution

Add a `finalizeDbSession` function that updates the database session to `completed` status when all local processing finishes.

## Implementation Plan

### File: `src/hooks/useVoiceBulkAnalysis.ts`

**Change 1: Add `finalizeDbSession` callback (after `updateDbItemStatus`, around line 327)**

```typescript
// Finalize database session when processing completes
const finalizeDbSession = useCallback(async (
  dbSessionId: string,
  status: 'completed' | 'failed' | 'cancelled'
) => {
  try {
    await supabase
      .from('voice_analysis_sessions')
      .update({ 
        status,
        completed_at: new Date().toISOString(),
        current_item_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbSessionId);
    
    console.log(`[VoiceBulkAnalysis] Database session ${dbSessionId} marked as ${status}`);
  } catch (error) {
    console.warn('[VoiceBulkAnalysis] Failed to finalize session:', error);
  }
}, []);
```

**Change 2: Call `finalizeDbSession` when processing completes (after line 1156)**

After the local state is updated to `completed`, also update the database:

```typescript
setSession(prev => prev ? {
  ...prev,
  status: 'completed',
  ...
} : null);

// NEW: Finalize database session
if (dbSessionId) {
  await finalizeDbSession(dbSessionId, 'completed');
}
```

**Change 3: Also call on pause (around line 920-927)**

When user pauses, ensure the database status is also updated:

```typescript
if (cancelRef.current) {
  if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
  setSession(prev => prev ? { 
    ...prev, 
    status: 'paused', 
    ...
  } : null);
  
  // NEW: Update database to paused status
  if (dbSessionId) {
    await supabase
      .from('voice_analysis_sessions')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', dbSessionId);
  }
  
  toast.info('Analysis paused');
  return;
}
```

## Summary of Changes

| Location | Change |
|----------|--------|
| Line ~328 | Add `finalizeDbSession` callback function |
| Line ~1158 | Call `finalizeDbSession(dbSessionId, 'completed')` after local state update |
| Line ~926 | Update database status to `paused` when user pauses |

## Expected Result After Fix

1. When all files finish processing, the database `voice_analysis_sessions.status` will be set to `'completed'`
2. On page refresh, the interrupted session check will NOT find the completed session (because it only queries for `running` or `paused`)
3. The UI will properly re-enable all controls
4. No more "ghost" sessions appearing as interrupted

