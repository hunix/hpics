
# ✅ COMPLETED: Local Whisper Opus Decoding Fix

## Summary

Implemented a robust multi-layered audio preprocessing solution to make Local Whisper reliably transcribe WhatsApp `.opus` voice notes in Chrome/Edge without freezing the UI.

## Changes Made

### 1. `src/lib/ml/localWhisperTranscriber.ts` - Major Overhaul

**Added:**
- **WASM Opus Decoder**: Integrated `ogg-opus-decoder` library for reliable OGG/Opus decoding when Chrome's native `decodeAudioData` fails/hangs
- **Content Sniffing**: `detectAudioFormat()` function checks:
  - Magic bytes signature (OggS, HTML, etc.)
  - Content-Type header
  - File size validation
  - Early fail for HTML responses (expired signed URLs)
- **Timeout Wrapper**: 10-second timeout on `decodeAudioData` to prevent hangs
- **Pure JS Resampler**: `resampleTo16kHz()` using linear interpolation - no `OfflineAudioContext` needed
- **Mono Mixer**: `mixToMono()` for multi-channel audio
- **Test Decode API**: `testDecode()` method for capability probing
- **Decoder Cleanup**: `unload()` now properly frees WASM decoder resources

**Decode Strategy:**
1. Detect if audio is OGG/Opus (signature or content-type)
2. If Opus → use WASM decoder first, native fallback
3. If not Opus → use native decoder first, WASM fallback
4. Both paths resample to 16kHz mono Float32Array

### 2. `src/hooks/useVoiceBulkAnalysis.ts` - Capability Probe

**Added:**
- Import `localWhisperTranscriber` for direct access
- **Capability Probe**: Before batch processing starts:
  - Tests decoding the first file with 5-second timeout
  - If fails with audio format error → auto-switch to cloud mode
  - Shows toast: "Local decoding for this audio format is not fully supported..."
  - Prevents wasting time failing 100+ files sequentially

### 3. Dependencies

- Added: `ogg-opus-decoder@latest` (WASM-based Opus decoder with Web Worker support)

## How It Works Now

```
User selects .opus files → Start Local Analysis
    ↓
Model loads (unchanged)
    ↓
✨ NEW: Capability Probe
    → testDecode(firstFile)
    → If fails: switch to cloud mode with toast
    → If passes: continue local
    ↓
Process each file:
    → fetch() → ArrayBuffer
    → detectAudioFormat() → {isOggOpus, isHtml, size, signature}
    → If HTML: throw "URL expired" error immediately
    → If OggOpus: decodeOpusWithWasm() → Float32Array @ 48kHz
    → Else: decodeWithAudioContext() with 10s timeout
    → resampleTo16kHz() via pure JS interpolation
    → Pass Float32Array to Whisper pipeline
    ↓
Transcription saved to voice_insights
```

## Testing Checklist

- [ ] WhatsApp .opus files on Chrome/Edge - should transcribe successfully
- [ ] No UI freezing during batch processing
- [ ] MP3/WAV files still work (native path regression test)
- [ ] Expired signed URL shows "URL may have expired" error
- [ ] Capability probe triggers cloud fallback when format unsupported

## Technical Notes

- WASM decoder loaded lazily on first Opus file encounter
- Pure JS resampler avoids OfflineAudioContext main-thread blocking
- Timeout ensures no single file can hang indefinitely
- Content sniffing catches 403/auth failures that return HTML
