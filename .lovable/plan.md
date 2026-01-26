

# Enhance Voice Analysis Model Download Progress Indicator

## Current State Analysis

The Voice Analysis system is **fully functional** with all components properly configured:

| Component | Status |
|-----------|--------|
| Whisper Models (4 variants) | ✅ Correct ONNX IDs |
| Model Loading Progress | ✅ Basic percentage shown |
| WebGPU/WASM Detection | ✅ Auto-fallback |
| Batch Processing | ✅ Complete with error handling |
| Language Pre-scan | ✅ For English-only model |

The existing progress indicator (lines 244-258 in `VoiceBulkAnalysisPanel.tsx`) shows:
- Percentage complete with spinner
- Static model size text

## Enhancement: Estimated Time Remaining

Add dynamic download speed calculation and estimated time remaining.

### Changes Required

**File 1: `src/hooks/useVoiceBulkAnalysis.ts`**

Extend `VoiceBulkSession` interface (line 51):
```typescript
export interface VoiceBulkSession {
  // ... existing fields ...
  modelDownloadStartTime?: number;  // NEW: Track download start
  modelDownloadSpeedMBps?: number;  // NEW: Current download speed
}
```

Update `startBulkAnalysis` to track timing (around line 369-379):
```typescript
let downloadStartTime = performance.now();
let lastProgress = 0;
let lastTime = downloadStartTime;

await localAudioAnalyzer.initialize({
  whisperModel: whisperModel,
  onProgress: (progress) => {
    if (progress.status === 'progress') {
      const now = performance.now();
      const progressDelta = (progress.progress || 0) - lastProgress;
      const timeDelta = (now - lastTime) / 1000; // seconds
      
      // Calculate speed (MB/s) based on progress percentage and model size
      const modelSizes: Record<WhisperModel, number> = {
        tiny: 75, small: 250, distil: 750, turbo: 800
      };
      const totalSize = modelSizes[whisperModel] || 250;
      const downloadedMB = (progress.progress || 0) / 100 * totalSize;
      const speedMBps = timeDelta > 0 ? (progressDelta / 100 * totalSize) / timeDelta : 0;
      
      setSession(prev => prev ? {
        ...prev,
        modelProgress: progress.progress,
        modelDownloadStartTime: downloadStartTime,
        modelDownloadSpeedMBps: speedMBps > 0 ? speedMBps : prev.modelDownloadSpeedMBps
      } : null);
      
      lastProgress = progress.progress || 0;
      lastTime = now;
    }
  }
});
```

**File 2: `src/components/analysis/VoiceBulkAnalysisPanel.tsx`**

Enhance the model loading UI (replace lines 244-258):
```typescript
{/* Model Loading Phase - Enhanced */}
{session.phase === 'model_loading' && session.modelStatus === 'loading' && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
        <span className="font-medium text-yellow-600 dark:text-yellow-400">
          Downloading {WHISPER_MODEL_OPTIONS.find(m => m.key === selectedWhisperModel)?.name}...
        </span>
      </div>
      <span className="text-sm font-mono">
        {Math.round(session.modelProgress || 0)}%
      </span>
    </div>
    <Progress value={session.modelProgress || 0} className="h-2" />
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        ~{WHISPER_MODEL_OPTIONS.find(m => m.key === selectedWhisperModel)?.size || '250MB'}
      </span>
      {session.modelDownloadSpeedMBps && session.modelDownloadSpeedMBps > 0 && (
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {session.modelDownloadSpeedMBps.toFixed(1)} MB/s
          {session.modelProgress && session.modelProgress < 100 && (
            <span className="ml-2">
              ~{Math.ceil(
                ((100 - session.modelProgress) / 100 * 
                  (parseInt(WHISPER_MODEL_OPTIONS.find(m => m.key === selectedWhisperModel)?.size || '250') || 250)) /
                session.modelDownloadSpeedMBps
              )}s remaining
            </span>
          )}
        </span>
      )}
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      First run downloads model to browser cache (won't download again)
    </p>
  </div>
)}
```

## Testing Steps

After implementation:

1. Navigate to `/analysis` → Voice tab
2. Select a contact with audio files (or upload test audio)
3. Choose **Local (Fast)** processing mode
4. Select **Whisper Tiny (75MB)** for fastest download test
5. Click **Start Analysis**
6. Observe:
   - Download progress percentage updating
   - Download speed in MB/s
   - Estimated time remaining countdown
   - Progress bar filling
7. After model loads, observe transcription progress

## Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Add timing fields to session, calculate download speed |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Enhanced progress UI with speed and ETA |

## Technical Notes

- Download speed calculated from progress delta over time delta
- Model sizes hardcoded (matching WHISPER_MODEL_OPTIONS)
- Speed smoothing: keeps last valid speed if current delta is zero
- ETA formula: `(remainingPercentage / 100 * modelSizeMB) / speedMBps`

