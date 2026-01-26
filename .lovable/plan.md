
# Fix Distil-Whisper Model ID for Browser Compatibility

## Problem Identified

The `distil` model in `MODEL_MAP` (line 69) references PyTorch weights that are incompatible with `@huggingface/transformers` browser execution:

| Model | Current ID | Status |
|-------|-----------|--------|
| turbo | `onnx-community/whisper-large-v3-turbo` | Correct |
| distil | `distil-whisper/distil-large-v3` | **Incorrect - PyTorch weights** |
| small | `onnx-community/whisper-small` | Correct |
| tiny | `onnx-community/whisper-tiny.en` | Correct |

## Root Cause

The `distil-whisper/distil-large-v3` model on HuggingFace contains PyTorch `.bin` files, not ONNX `.onnx` files. The `@huggingface/transformers` library requires ONNX-format models for WebGPU/WASM execution in browsers.

## Solution

Update line 69 in `src/lib/ml/localWhisperTranscriber.ts`:

```typescript
// Before (PyTorch - won't work in browser)
id: "distil-whisper/distil-large-v3"

// After (ONNX - browser compatible)
id: "onnx-community/distil-whisper-large-v3"
```

## File Changes

**File:** `src/lib/ml/localWhisperTranscriber.ts`

**Change:** Single line update at line 69

```typescript
distil: {
  id: "onnx-community/distil-whisper-large-v3",  // Changed from "distil-whisper/distil-large-v3"
  name: "Distil-Whisper Large V3",
  size: "~750MB", 
  speed: "~6x faster than base",
  supportedLanguages: 'multilingual'
},
```

## Validation

After this fix:
- All 4 Whisper models use `onnx-community` namespace
- Distil model will download ONNX weights correctly
- WebGPU/WASM transcription will work for Distil selection
- Model selector in Voice Analysis Hub will function properly

## Impact

- **Risk:** None - simple ID string change
- **Testing:** Select "Distil" model in Voice Analysis and run transcription
- **Rollback:** Revert single line if needed
