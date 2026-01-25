
# Voice Analysis Local Pipeline - Robustness Enhancement Plan

## Overview
Enhance the local voice analysis pipeline to ensure efficient, error-free, smart, and fast processing of all, selective, or single voice files using the WebGPU Whisper Turbo model.

## Current State Summary

The system already supports:
- All files: "Select Unanalyzed" button selects all pending files
- Selective files: Checkbox selection with virtualized list (handles 800+ items)
- Single file: Select one file, click "Analyze 1 Recording"
- Local mode: WebGPU Whisper Turbo with ~216x real-time speed
- Progress tracking: Model loading + file-by-file progress
- Cross-system sync: Updates `media.completed_analysis_modes` after completion

## Gaps to Address

1. **No per-file timeout** - A corrupted/hung file can block the entire batch
2. **No automatic retry** - Failed files are simply counted, not retried
3. **No pre-flight WebGPU check** - Users discover issues after starting
4. **No "Skip Already Analyzed" toggle** - Must manually deselect analyzed files
5. **Limited error recovery messaging** - Generic failure messages

---

## Technical Implementation

### File 1: `src/hooks/useVoiceBulkAnalysis.ts`

#### Change 1.1: Add Per-File Timeout Wrapper

Add a timeout utility to prevent hung files from blocking the batch:

```typescript
// Add near top of file
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fileName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms processing "${fileName}"`));
    }, timeoutMs);
    
    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};
```

#### Change 1.2: Apply Timeout to Local Processing

Wrap `processLocalRecording` calls with timeout (60s default for local, configurable):

```typescript
// In startBulkAnalysis, around line 319
if (mode === 'local') {
  await withTimeout(
    processLocalRecording(recording, user.id),
    60000, // 60 second timeout per file
    recording.title
  );
  // ... rest of success handling
}
```

#### Change 1.3: Add Retry Logic for Failed Files

Track failed files and offer single retry:

```typescript
// Add to VoiceBulkSession interface
retryQueue: VoiceRecording[];

// After main loop completes with failures
if (failedRecordings.length > 0 && retryCount < 1) {
  console.log(`[VoiceBulkAnalysis] Retrying ${failedRecordings.length} failed files...`);
  // Process failed files once more
}
```

#### Change 1.4: Add Error Classification

Classify errors for better user feedback:

```typescript
const classifyError = (error: Error): { type: string; canRetry: boolean; message: string } => {
  const msg = error.message.toLowerCase();
  
  if (msg.includes('timeout')) {
    return { type: 'timeout', canRetry: true, message: 'File took too long to process' };
  }
  if (msg.includes('no transcription')) {
    return { type: 'empty', canRetry: false, message: 'No speech detected in audio' };
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return { type: 'network', canRetry: true, message: 'Failed to download audio file' };
  }
  if (msg.includes('webgpu') || msg.includes('wasm')) {
    return { type: 'ml', canRetry: false, message: 'ML engine error' };
  }
  
  return { type: 'unknown', canRetry: true, message: error.message };
};
```

---

### File 2: `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

#### Change 2.1: Add WebGPU Pre-Check Indicator

Show WebGPU availability before user starts:

```tsx
// Add state
const [webgpuAvailable, setWebgpuAvailable] = useState<boolean | null>(null);

// Add effect to check on mount
useEffect(() => {
  const checkWebGPU = async () => {
    const available = !!(navigator.gpu) && 
      !!(await navigator.gpu.requestAdapter?.().catch(() => null));
    setWebgpuAvailable(available);
  };
  checkWebGPU();
}, []);

// Show in UI near processing mode selector
{webgpuAvailable === false && processingMode === 'local' && (
  <div className="text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
    WebGPU not detected. Local analysis will use WASM (slower but still functional).
  </div>
)}
{webgpuAvailable === true && processingMode === 'local' && (
  <div className="text-xs text-green-600 bg-green-500/10 p-2 rounded border border-green-500/20">
    ✓ WebGPU available - Maximum speed enabled
  </div>
)}
```

#### Change 2.2: Add "Hide Already Analyzed" Toggle

Allow users to filter the list to only show unanalyzed files:

```tsx
// Add state
const [hideAnalyzed, setHideAnalyzed] = useState(false);

// Filter recordings for display
const displayRecordings = useMemo(() => 
  hideAnalyzed ? recordings.filter(r => !r.hasVoiceInsights) : recordings,
  [recordings, hideAnalyzed]
);

// Add toggle UI near list header
<div className="flex items-center gap-2">
  <Switch 
    checked={hideAnalyzed} 
    onCheckedChange={setHideAnalyzed}
    id="hide-analyzed"
  />
  <Label htmlFor="hide-analyzed" className="text-sm">
    Hide already analyzed
  </Label>
</div>
```

#### Change 2.3: Enhanced Progress Details

Show more granular progress including current file name and estimated time:

```tsx
// In processing phase UI section
{session.phase === 'processing' && session.status === 'running' && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="font-medium text-sm">
          Processing: <span className="text-blue-600">{session.currentFileName}</span>
        </span>
      </div>
      <span className="text-sm font-mono">
        {session.processedItems + 1} / {session.totalItems}
      </span>
    </div>
    <Progress value={progress} className="h-2" />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{Math.round(progress)}% complete</span>
      {session.failedItems > 0 && (
        <span className="text-red-500">{session.failedItems} failed</span>
      )}
    </div>
  </div>
)}
```

#### Change 2.4: Show Failed Files with Retry Option

After completion, show failed files with individual retry buttons:

```tsx
// Add after completion message
{session.status === 'completed' && session.failedItems > 0 && (
  <div className="mt-3 p-3 bg-red-500/10 rounded border border-red-500/20">
    <div className="flex items-center gap-2 text-red-600 mb-2">
      <AlertCircle className="h-4 w-4" />
      <span className="font-medium">{session.failedItems} files failed</span>
    </div>
    <Button 
      size="sm" 
      variant="outline" 
      onClick={() => retryFailedFiles()}
      className="border-red-500/30"
    >
      <RefreshCw className="h-3 w-3 mr-1" />
      Retry Failed Files
    </Button>
  </div>
)}
```

---

### File 3: `src/lib/ml/localAudioAnalyzer.ts`

#### Change 3.1: Add Audio Validation Before Processing

Pre-validate audio files to catch issues early:

```typescript
async analyzeAudioFile(
  audioSource: string | Blob | ArrayBuffer,
  options: LocalAudioAnalysisOptions = {}
): Promise<LocalAudioAnalysis> {
  // Pre-validation for URLs
  if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
    try {
      const response = await fetch(audioSource, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Audio file not accessible: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('audio')) {
        console.warn(`[LocalAudioAnalyzer] Unexpected content type: ${contentType}`);
      }
    } catch (error) {
      throw new Error(`Failed to access audio file: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
  
  // ... rest of existing implementation
}
```

#### Change 3.2: Add Processing Statistics

Track and return processing statistics for optimization:

```typescript
// Add to LocalAudioAnalysis interface
stats: {
  audioSizeBytes?: number;
  audioFormat?: string;
  realtimeSpeedup?: number;
  device: 'webgpu' | 'wasm';
};
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Timeout wrapper, retry logic, error classification | High |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | WebGPU pre-check, hide-analyzed toggle, enhanced progress, retry UI | High |
| `src/lib/ml/localAudioAnalyzer.ts` | Audio validation, processing stats | Medium |

---

## Expected Behavior After Implementation

### Single File Analysis
1. User selects 1 file from the list
2. Clicks "Analyze 1 Recording"
3. WebGPU status indicator confirms optimal speed
4. Progress shows file name being processed
5. Completion syncs to Media Hub
6. If failed: Error classification + retry option

### Selective File Analysis
1. User checkboxes specific files (e.g., 50 of 881)
2. Or uses "Hide Already Analyzed" toggle + selects visible
3. Clicks "Analyze 50 Recordings"
4. Files processed with 60s timeout each
5. Failed files tracked with reasons
6. After batch: Retry option for recoverable failures

### All Files Analysis (Bulk)
1. User clicks "Select Unanalyzed (881)"
2. Selects "Local (Fast)" mode
3. WebGPU check confirms availability
4. Model loads with progress bar (~800MB first time)
5. Processing shows current file name + X/881 counter
6. Timeout prevents any single file from blocking
7. Failed files auto-retried once
8. Completion syncs all to Media Hub

---

## Performance Expectations

| Metric | Value |
|--------|-------|
| Model load (first time) | 30-60s (downloads ~800MB) |
| Model load (cached) | 2-5s |
| Per-file processing (WebGPU) | ~0.5-2s for 30s audio |
| Per-file processing (WASM) | ~5-10s for 30s audio |
| 881 files total (WebGPU) | ~15-30 minutes |
| Timeout per file | 60 seconds |

---

## Testing Recommendations

After implementation:
1. Test with single file selection
2. Test with 5 file selection (subset)
3. Test with all unanalyzed files
4. Test on browser without WebGPU (should fallback to WASM)
5. Test with a corrupted/empty audio file (should timeout gracefully)
6. Verify retry functionality for failed files
7. Confirm Media Hub reflects analyzed status
