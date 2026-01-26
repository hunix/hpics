

# Fix Voice Analysis Stuck at 0/5 Progress

## Problem Diagnosis

Based on investigation of the screenshot, logs, database, and code:

| Finding | Evidence |
|---------|----------|
| Session shows "Analyzing... 0 / 5" with Pause button | Screenshot shows processing phase but no progress |
| No database session exists | Query to `voice_analysis_sessions` returns empty `[]` |
| No edge function logs | `process-voice-analysis-runner` shows no logs |
| createDbSession may be failing silently | Function catches errors but continues processing |
| Local Whisper processing is blocking | `processLocalRecording` runs synchronously without UI updates |

The root cause is a combination of issues:

1. **Database session creation is failing** - The `createDbSession` function fails silently, so the session isn't persisted for recovery
2. **Local Whisper transcriber hangs indefinitely** - The `localWhisperTranscriber.transcribe()` can hang on certain audio files or if WebGPU/WASM initialization stalls
3. **No timeout on model initialization** - The model loading phase has no timeout, so if it stalls, the UI stays stuck
4. **Published version may be stale** - The screenshot shows "Analyzing..." which differs from current code showing "Processing:"

## Solution Architecture

Implement three defensive layers:

```text
┌───────────────────────────────────────────────────────────────────┐
│                    Browser-Resilient Processing                   │
├───────────────────────────────────────────────────────────────────┤
│  Layer 1: Initialization Timeout (30s)                            │
│    - Fail fast if model can't load                                │
│    - Auto-fallback to cloud mode                                  │
├───────────────────────────────────────────────────────────────────┤
│  Layer 2: Per-File Timeout with Progress Updates                  │
│    - Update UI every 5 seconds with "Still processing..."         │
│    - Mark file as failed after timeout                            │
│    - Continue to next file                                        │
├───────────────────────────────────────────────────────────────────┤
│  Layer 3: Stall Detection & Auto-Recovery                         │
│    - Detect no progress for 2 minutes                             │
│    - Auto-trigger backend runner to take over                     │
│    - Show "Transferring to background..." status                  │
└───────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Add Model Initialization Timeout

Add a timeout wrapper around the Whisper model initialization to prevent infinite hangs:

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

Add a 30-second timeout on model initialization with automatic fallback to cloud mode if it fails.

### Phase 2: Add Stall Detection

Add a `useEffect` that monitors session progress and auto-triggers the backend runner if no progress is detected for 2 minutes:

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

```typescript
// Stall detection - auto-recover if no progress for 2 minutes
useEffect(() => {
  if (!session?.dbSessionId || session.status !== 'running' || session.isBackendProcessing) return;
  
  const lastProgressRef = { items: session.processedItems, time: Date.now() };
  
  const interval = setInterval(() => {
    const currentProcessed = session.processedItems;
    const timeSinceProgress = Date.now() - lastProgressRef.time;
    
    if (currentProcessed === lastProgressRef.items && timeSinceProgress > 120000) {
      // Stalled for 2+ minutes - auto-trigger backend
      console.warn('[VoiceBulkAnalysis] Stall detected - transferring to backend...');
      continueInBackground();
    } else if (currentProcessed > lastProgressRef.items) {
      lastProgressRef.items = currentProcessed;
      lastProgressRef.time = Date.now();
    }
  }, 30000);
  
  return () => clearInterval(interval);
}, [session?.dbSessionId, session?.status, session?.isBackendProcessing, session?.processedItems]);
```

### Phase 3: Fix Silent Database Session Creation Failure

Make `createDbSession` failure more visible and ensure processing can continue even without DB session:

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

- Add toast warning when DB session creation fails
- Still allow local processing to proceed (graceful degradation)
- Log the specific error for debugging

### Phase 4: Add Heartbeat Progress Updates

Update the processing loop to send periodic UI updates even while a file is being processed:

**File: `src/hooks/useVoiceBulkAnalysis.ts`**

Add a progress heartbeat that updates `currentFileName` with elapsed time to show the UI isn't frozen.

### Phase 5: UI Stall Indicator

Add a visual indicator in the UI when processing appears stalled:

**File: `src/components/analysis/VoiceBulkAnalysisPanel.tsx`**

Show "Taking longer than expected..." after 30 seconds on the same file, with a "Switch to Cloud" button.

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Add initialization timeout, stall detection, heartbeat, better error handling |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Add stall indicator UI, "Taking longer..." warning |
| `src/lib/ml/localWhisperTranscriber.ts` | Add AbortController support for cancellation |

## Technical Details

### Initialization Timeout

```typescript
const MODEL_INIT_TIMEOUT_MS = 30000; // 30 seconds

// Wrap initialization with timeout
const initWithTimeout = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODEL_INIT_TIMEOUT_MS);
  
  try {
    await localAudioAnalyzer.initialize({
      whisperModel: whisperModel,
      signal: controller.signal, // Pass abort signal
      onProgress: (progress) => { /* ... */ }
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('[VoiceBulkAnalysis] Model init timeout - falling back to cloud');
      toast.warning('Local model loading timed out. Using cloud processing.');
      mode = 'cloud'; // Fallback
    } else {
      throw error;
    }
  }
};
```

### Heartbeat Progress Updates

```typescript
// Inside the processing loop
let heartbeatInterval: NodeJS.Timeout | undefined;

for (let i = 0; i < recordingsToProcess.length; i++) {
  const recording = recordingsToProcess[i];
  const startTime = Date.now();
  
  // Start heartbeat
  heartbeatInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setSession(prev => prev ? {
      ...prev,
      currentFileName: `${recording.title} (${elapsed}s elapsed...)`
    } : null);
  }, 5000);
  
  try {
    await withTimeout(
      processLocalRecording(recording, user.id),
      LOCAL_TIMEOUT_MS,
      recording.title || 'Audio file'
    );
  } finally {
    clearInterval(heartbeatInterval);
  }
}
```

### UI Stall Warning

```typescript
// In VoiceBulkAnalysisPanel.tsx
const isStalled = useMemo(() => {
  if (!session || session.status !== 'running') return false;
  // Check if currentFileName contains elapsed time > 30s
  const match = session.currentFileName?.match(/\((\d+)s elapsed\.\.\.\)$/);
  return match ? parseInt(match[1]) > 30 : false;
}, [session?.currentFileName, session?.status]);

// Render warning
{isStalled && (
  <div className="flex items-center gap-2 text-amber-500 text-sm mt-2">
    <AlertTriangle className="h-4 w-4" />
    <span>Taking longer than expected...</span>
    <Button size="sm" variant="outline" onClick={continueInBackground}>
      Switch to Cloud
    </Button>
  </div>
)}
```

## Expected Outcomes

1. **No more infinite hangs** - Timeouts ensure processing always progresses or fails gracefully
2. **Visual feedback during long operations** - Users see elapsed time and know the app isn't frozen
3. **Automatic recovery** - Stall detection triggers backend fallback automatically
4. **Graceful degradation** - Even if DB session fails, local processing continues
5. **User control** - "Switch to Cloud" button available when local processing struggles

## Testing Steps

1. Navigate to `/analysis` → Voice tab
2. Select 5 audio files and start Local processing
3. Observe:
   - Model download should show progress or timeout after 30s
   - Each file should show elapsed time updates every 5s
   - If any file exceeds 60s, it should timeout and move to next
   - If stuck for 2+ minutes, auto-transfers to backend
4. Close browser during processing
5. Reopen and verify interrupted session is detected and can resume

