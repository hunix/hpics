
# Local Whisper Model Size Selector

## Overview

Add a UI option to select between different Whisper model sizes for local transcription, allowing users to choose between download size/speed trade-offs. The models are already defined in `localWhisperTranscriber.ts` but the UI is hardcoded to use 'turbo' (~800MB).

---

## Available Models (Already Defined)

| Model Key | Display Name | Size | Speed | Notes |
|-----------|--------------|------|-------|-------|
| `tiny` | Whisper Tiny | ~75MB | ~100x real-time | English-only, fastest download |
| `small` | Whisper Small | ~250MB | ~50x real-time | Multilingual, good balance |
| `distil` | Distil-Whisper | ~750MB | ~6x faster | High quality, optimized |
| `turbo` | Whisper Turbo | ~800MB | 216x real-time | Maximum quality (current default) |

---

## Implementation Plan

### Phase 1: State Management

**File:** `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

1. Add new state for model selection:
```typescript
const [selectedModel, setSelectedModel] = useState<WhisperModel>('small'); // Default to balanced
```

2. Import `WhisperModel` type from localWhisperTranscriber

### Phase 2: UI Component - Model Selector

**File:** `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

Add a model selector dropdown/radio group that appears when `processingMode === 'local'` or `processingMode === 'hybrid'`:

```text
┌─────────────────────────────────────────────────────┐
│ Local Model Size                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ○ Tiny (75MB)    - English only, fastest load   │ │
│ │ ● Small (250MB)  - Multilingual, balanced ✓     │ │
│ │ ○ Distil (750MB) - High quality, optimized      │ │
│ │ ○ Turbo (800MB)  - Maximum quality              │ │
│ └─────────────────────────────────────────────────┘ │
│ First run downloads model to browser cache          │
└─────────────────────────────────────────────────────┘
```

Features:
- Radio group with 4 options
- Shows size and key characteristics
- Indicates "English-only" for tiny model
- Updates the "First run" download size message dynamically

### Phase 3: Hook Integration

**File:** `src/hooks/useVoiceBulkAnalysis.ts`

1. Add `whisperModel` parameter to the hook's start function:
```typescript
startBulkAnalysis: (
  items: VoiceRecording[],
  options: VoiceBulkAnalysisOptions,
  mode: ProcessingMode,
  whisperModel: WhisperModel = 'small'
) => Promise<void>
```

2. Pass selected model to `localAudioAnalyzer.initialize()`:
```typescript
await localAudioAnalyzer.initialize({
  whisperModel: whisperModel, // Previously hardcoded to 'turbo'
  onProgress: (progress) => { ... }
});
```

### Phase 4: Local Audio Analyzer Update

**File:** `src/lib/ml/localAudioAnalyzer.ts`

Ensure the `initialize` method accepts and passes through the `whisperModel` parameter to `localWhisperTranscriber`.

### Phase 5: Dynamic UI Updates

**File:** `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

1. Update the "First run downloads" message to show selected model size:
```typescript
{processingMode === 'local' && !localModelStatus?.isReady && (
  <div className="text-xs text-muted-foreground mt-1">
    <strong>First run:</strong> Downloads ~{MODEL_SIZES[selectedModel]} model (cached after)
  </div>
)}
```

2. Show model-specific warnings:
   - For `tiny`: Show "English-only" badge
   - For `turbo`/`distil`: Show "Large download" indicator

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Add model selector UI, state, dynamic messages |
| `src/hooks/useVoiceBulkAnalysis.ts` | Accept `whisperModel` parameter, pass to initializer |
| `src/lib/ml/localAudioAnalyzer.ts` | Pass through whisperModel to localWhisperTranscriber |

---

## UI Placement

The model selector will appear:
- **Below** the "Processing Mode" radio group (Local/Cloud/Hybrid)
- **Only when** Local or Hybrid mode is selected
- **Collapsed by default** with an expand chevron for advanced users (optional)

---

## Default Model Recommendation

**Recommended default: `small` (~250MB)**

Rationale:
- 3x smaller download than turbo (250MB vs 800MB)
- Still supports multilingual transcription
- 50x real-time is plenty fast for batch processing
- Good quality for intelligence analysis

Users who need maximum accuracy can opt for `turbo`, while those with limited bandwidth or storage can use `tiny` (75MB, English-only).

---

## Technical Notes

- Models are cached in browser IndexedDB after first download
- User's model preference could be persisted to localStorage
- WebGPU/WASM fallback logic remains unchanged regardless of model selection
- All 4 models already exist in `localWhisperTranscriber.ts` MODEL_MAP
