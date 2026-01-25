

# Fix: Voice Analysis UI Progress Feedback

## Problem

When you click "Analyze," the UI shows "Analyzing... 0/6" but gives **no visual feedback** that the ~800MB Whisper model is downloading. The model progress IS tracked internally (`session.modelProgress`) but the UI component never displays it.

Your powerful machine (3090 Ti, 96GB RAM) isn't the issue - the UI simply doesn't show what's happening.

---

## Solution

Update `VoiceBulkAnalysisPanel.tsx` to display:

1. **Model loading phase** with progress bar and percentage
2. **Current file being processed** during analysis
3. **Clear phase indicators** so you always know the system state

---

## Changes

### File: `src/hooks/useVoiceBulkAnalysis.ts`

Add `phase` and `currentFileName` to the session interface for clearer state tracking:

```typescript
export interface VoiceBulkSession {
  // ... existing fields
  phase: 'initializing' | 'model_loading' | 'processing' | 'completed' | 'failed';
  currentFileName?: string;
}
```

Update session state during model loading and file processing to include phase and current file name.

### File: `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

Update the progress section (lines 161-195) to show:

```text
┌─────────────────────────────────────────────────────────────┐
│  🟡 Loading Whisper Model... 67%                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░  67%        │
│  First run downloads ~800MB model (cached after)            │
└─────────────────────────────────────────────────────────────┘
```

Then during processing:

```text
┌─────────────────────────────────────────────────────────────┐
│  🔵 Processing: PTT-20250131-WA0015.opus                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  3 / 6     │
│  [Pause]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Session State Updates

```typescript
// Before model init
setSession(prev => prev ? {
  ...prev,
  phase: 'model_loading',
  modelProgress: 0
} : null);

// During file processing
setSession(prev => prev ? { 
  ...prev, 
  phase: 'processing',
  currentItemId: recording.id,
  currentFileName: recording.title,
  processedItems: i 
} : null);
```

### UI Component Updates

```tsx
{/* Model loading progress - NEW */}
{session.modelStatus === 'loading' && (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      <span className="font-medium text-yellow-600">
        Loading Whisper Model... {Math.round(session.modelProgress || 0)}%
      </span>
    </div>
    <Progress value={session.modelProgress || 0} className="h-1.5" />
    <p className="text-xs text-muted-foreground">
      First run downloads ~800MB model (cached after)
    </p>
  </div>
)}

{/* File processing progress - ENHANCED */}
{session.modelStatus === 'ready' && session.status === 'running' && (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      <span className="font-medium">
        Processing: {session.currentFileName || 'Audio file'}
      </span>
    </div>
    <Progress value={progress} className="h-2" />
    {/* ... file count and pause button */}
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVoiceBulkAnalysis.ts` | Add `phase` and `currentFileName` to session, update state during model loading and file processing |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Show model loading progress bar, current file name, and phase-aware UI states |

---

## Expected Result

After implementation:
- **Model Loading**: Yellow progress bar showing "Loading Whisper Model... 67%"
- **Processing**: Blue indicator showing "Processing: PTT-20250131-WA0015.opus (3/6)"
- **Console Logs**: Existing `[LocalWhisper]` logs continue for DevTools debugging
- **Completion**: Green checkmark with success message

