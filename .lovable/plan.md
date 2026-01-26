

# Browser-Resilient Voice Analysis System

## Problem Diagnosis

The browser refresh during voice analysis is caused by multiple factors in the current client-side architecture:

| Cause | Location | Trigger |
|-------|----------|---------|
| PWA Auto-Update | `src/main.tsx:100-119` | Service worker detects new deployment |
| Version Mismatch | `src/main.tsx:32-55` | `FORCE_CLEAR_VERSIONS` contains previous version |
| Chunk Errors | `src/lib/appVersion.ts:180-202` | 2+ chunk loading failures in 60 seconds |

The fundamental issue is that **local WebGPU Whisper processing runs entirely in the browser**, so any page refresh terminates the process and loses progress.

## Solution: Hybrid Backend-Resilient Voice Analysis

Implement a dual-mode architecture that allows voice analysis to either:
1. **Run locally** (fast, uses WebGPU) with progress checkpointing
2. **Continue in backend** (resilient, uses cloud transcription) when browser closes

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Voice Analysis Session                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. User selects files and starts analysis                          │
│  2. Session created in voice_analysis_sessions table                │
│  3. Items created in voice_analysis_items table                     │
│  4. Local processing begins (WebGPU Whisper)                        │
│  5. Progress checkpointed to DB after each file                     │
│  6. "Continue in Background" button available                       │
│  7. On refresh/close: Backend runner picks up pending items         │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Database Schema for Session Persistence

Create tables to track voice analysis sessions and items with the same pattern as `bulk_analysis_sessions`:

**New Tables:**
- `voice_analysis_sessions` - Tracks overall session state, model choice, processing mode
- `voice_analysis_items` - Tracks each audio file with status, progress, results

**Key Fields:**
- `status`: idle | running | paused | completed | failed
- `processing_mode`: local | cloud | hybrid
- `whisper_model`: tiny | small | distil | turbo
- `checkpoint_progress`: JSON with last successfully processed item

### Phase 2: Backend Voice Analysis Runner

Create a new edge function `process-voice-analysis-runner` that:

1. Receives `sessionId` and `action` (start/continue/pause)
2. Fetches pending items from `voice_analysis_items`
3. Uses `EdgeRuntime.waitUntil()` for background processing
4. Calls existing `process-voice-recording` or `transcribe-audio` for each item
5. Updates item and session status atomically

```typescript
// supabase/functions/process-voice-analysis-runner/index.ts
EdgeRuntime.waitUntil(processItemsInBackground(session, pendingItems));
```

### Phase 3: Enhanced Hook with Persistence

Update `useVoiceBulkAnalysis.ts` to:

1. **Create session in DB** before starting processing
2. **Checkpoint progress** after each file completes (update `voice_analysis_items`)
3. **Detect orphaned sessions** on mount and offer recovery
4. **Subscribe to Realtime** for progress updates from backend
5. **Provide "Continue in Background"** action that triggers backend runner

### Phase 4: UI Enhancements

Update `VoiceBulkAnalysisPanel.tsx`:

1. **Session Recovery Dialog**: On mount, check for interrupted sessions
2. **Continue in Background Button**: Visible during active processing
3. **Backend Progress Indicator**: Show progress even when backend is processing
4. **Realtime Status**: Subscribe to session updates

## File Changes

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_voice_analysis_sessions.sql` | New tables + RLS |
| `supabase/functions/process-voice-analysis-runner/index.ts` | New backend runner |
| `src/hooks/useVoiceBulkAnalysis.ts` | Add persistence, recovery, realtime |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Add recovery UI, background button |

## Technical Details

### Database Schema

```sql
-- Voice Analysis Sessions (parent)
CREATE TABLE voice_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  processing_mode TEXT DEFAULT 'local' CHECK (processing_mode IN ('local', 'cloud', 'hybrid')),
  whisper_model TEXT DEFAULT 'small',
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  skipped_items INTEGER DEFAULT 0,
  current_item_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Analysis Items (children)
CREATE TABLE voice_analysis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES voice_analysis_sessions(id) ON DELETE CASCADE,
  media_id UUID,
  recording_id UUID,
  source TEXT CHECK (source IN ('media', 'voice_recording_sessions')),
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  queue_position INTEGER,
  transcription_text TEXT,
  detected_language TEXT,
  processing_time_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE voice_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_analysis_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON voice_analysis_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own items" ON voice_analysis_items
  FOR ALL USING (
    session_id IN (SELECT id FROM voice_analysis_sessions WHERE user_id = auth.uid())
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE voice_analysis_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_analysis_items;

-- RPC for atomic progress increment
CREATE OR REPLACE FUNCTION increment_voice_session_progress(
  p_session_id UUID,
  p_is_completed BOOLEAN,
  p_is_failed BOOLEAN,
  p_is_skipped BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  UPDATE voice_analysis_sessions SET
    completed_items = CASE WHEN p_is_completed THEN completed_items + 1 ELSE completed_items END,
    failed_items = CASE WHEN p_is_failed THEN failed_items + 1 ELSE failed_items END,
    skipped_items = CASE WHEN p_is_skipped THEN skipped_items + 1 ELSE skipped_items END,
    updated_at = now()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Backend Runner Logic

```typescript
// supabase/functions/process-voice-analysis-runner/index.ts
async function processItemsInBackground(session: any, items: any[]) {
  for (const item of items) {
    // Check for pause/cancel
    const { data: currentSession } = await supabase
      .from('voice_analysis_sessions')
      .select('status')
      .eq('id', session.id)
      .single();
    
    if (currentSession?.status === 'paused' || currentSession?.status === 'cancelled') {
      break;
    }

    // Update item to running
    await supabase.from('voice_analysis_items')
      .update({ status: 'running' })
      .eq('id', item.id);

    try {
      // Call process-voice-recording for transcription
      const { data, error } = await supabase.functions.invoke('process-voice-recording', {
        body: { audioUrl: item.file_url, recordingId: item.recording_id }
      });

      if (error) throw error;

      // Update item to completed
      await supabase.from('voice_analysis_items')
        .update({
          status: 'completed',
          transcription_text: data.transcription,
          detected_language: data.analysis?.language || 'en',
          completed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      await supabase.rpc('increment_voice_session_progress', {
        p_session_id: session.id,
        p_is_completed: true,
        p_is_failed: false
      });

    } catch (error) {
      await supabase.from('voice_analysis_items')
        .update({
          status: 'failed',
          error_message: error.message,
          retry_count: item.retry_count + 1
        })
        .eq('id', item.id);

      await supabase.rpc('increment_voice_session_progress', {
        p_session_id: session.id,
        p_is_completed: false,
        p_is_failed: true
      });
    }
  }

  // Mark session completed if no pending items remain
  const { data: remaining } = await supabase
    .from('voice_analysis_items')
    .select('id')
    .eq('session_id', session.id)
    .eq('status', 'pending')
    .limit(1);

  if (!remaining?.length) {
    await supabase.from('voice_analysis_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', session.id);
  }
}
```

### Hook Recovery Logic

```typescript
// In useVoiceBulkAnalysis.ts - detect orphaned sessions
const checkForInterruptedSession = useCallback(async () => {
  const { data: interrupted } = await supabase
    .from('voice_analysis_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['running', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (interrupted) {
    setInterruptedSession(interrupted);
    return interrupted;
  }
  return null;
}, [userId]);

// Resume from interrupted session
const resumeInterruptedSession = useCallback(async () => {
  // Trigger backend runner to continue
  await supabase.functions.invoke('process-voice-analysis-runner', {
    body: { sessionId: interruptedSession.id, action: 'continue' }
  });
}, [interruptedSession]);
```

## Benefits

1. **Zero Data Loss**: Progress is checkpointed after each file
2. **Browser-Independent**: Backend runner continues if browser closes
3. **Seamless Recovery**: Users can resume interrupted sessions
4. **Realtime Updates**: UI reflects progress even from backend processing
5. **Fallback Path**: Cloud transcription available when WebGPU unavailable

## Estimated Implementation Time

- Phase 1 (Schema): 30 minutes
- Phase 2 (Backend Runner): 1 hour
- Phase 3 (Hook Updates): 2 hours
- Phase 4 (UI Updates): 1 hour
- Testing: 1 hour

**Total: ~5-6 hours**

