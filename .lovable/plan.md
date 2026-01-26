
# Fix Local Whisper Analysis - Opus Audio Format Compatibility

## Problem Summary

Local Whisper transcription fails for all files with:
1. **UI Freezing** - Panel freezes for seconds when processing each file
2. **All Files Fail** - Every file shows "failed" status
3. **No transcriptions saved** - Processing appears to complete but nothing is stored

## Root Cause Analysis

The audio files in the database are **Opus format** (`.opus` - WhatsApp voice notes), but the current implementation passes raw URLs directly to the Whisper pipeline:

| Issue | Evidence |
|-------|----------|
| Files are Opus format | Database shows `mime_type: audio/opus` for all voice notes |
| No audio preprocessing | `localWhisperTranscriber.ts:253-258` just passes URL to pipeline |
| Whisper requires 16kHz Float32 | Model trained on resampled audio, not raw Opus |
| Browser struggles with Opus | Main thread blocks during failed decode attempts → UI freeze |

### Why It Fails

1. **User selects files → starts local analysis**
2. **Model loads successfully** (Whisper turbo loads fine)
3. **Processing starts file #1:**
   - Code passes Opus URL to `this.transcriber(audioInput, ...)`
   - Hugging Face pipeline tries to fetch and decode Opus
   - Browser's internal decoder stalls or fails on Opus format
   - **Main thread blocks** → UI freezes for several seconds
   - Eventually throws error or returns empty result
4. **Error caught** → file marked as failed
5. **Loop continues** to next file with same pattern
6. **All files fail**, session marked "complete" but with 100% failure

### The Missing Step

The code at `localWhisperTranscriber.ts:255-258` has a comment "For URLs, fetch the audio first if needed" but **doesn't actually do anything** - it's a placeholder that was never implemented:

```typescript
if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
  // For URLs, fetch the audio first if needed
  console.log('[LocalWhisper] Processing audio from URL...');
}
// ← Nothing actually happens here! URL is passed as-is to transcriber
```

## Solution: Add Audio Preprocessing

Implement proper audio fetch, decode, and resample before passing to Whisper. Use the `AudioContext` API to convert Opus to Float32Array at 16kHz.

### Technical Approach

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Current Flow (BROKEN)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  URL (opus) ──────────────────────────────────► Whisper Pipeline (FAILS)    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                   Fixed Flow                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  URL ──► fetch() ──► ArrayBuffer ──► AudioContext.decodeAudioData()         │
│       └──────────────────────────────────────────┘                          │
│                              ↓                                               │
│                        AudioBuffer                                           │
│                              ↓                                               │
│         Resample to 16kHz (if needed) using OfflineAudioContext             │
│                              ↓                                               │
│                   Float32Array (16kHz mono)                                  │
│                              ↓                                               │
│                    Whisper Pipeline (SUCCESS) ✓                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Add Audio Preprocessing Helper

Create a new helper function in `localWhisperTranscriber.ts` to handle audio preprocessing:

```typescript
/**
 * Preprocess audio URL to Float32Array at 16kHz
 * Required for Opus and other formats that Whisper can't decode natively
 */
private async preprocessAudioUrl(url: string): Promise<Float32Array> {
  // 1. Fetch the audio file
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  
  // 2. Decode using AudioContext (handles Opus, MP3, WAV, etc.)
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // 3. Resample to 16kHz if needed (Whisper requirement)
  const targetSampleRate = 16000;
  let processedBuffer = audioBuffer;
  
  if (audioBuffer.sampleRate !== targetSampleRate) {
    const offlineCtx = new OfflineAudioContext(
      1, // mono
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    processedBuffer = await offlineCtx.startRendering();
  }
  
  // 4. Extract mono Float32Array
  const monoData = processedBuffer.getChannelData(0);
  
  await audioContext.close();
  return monoData;
}
```

### Phase 2: Update transcribe() Method

Modify the `transcribe` method to use preprocessing for URLs:

```typescript
async transcribe(audioSource: string | Blob | ArrayBuffer, options?: {...}) {
  // ...existing model check...
  
  const startTime = performance.now();
  
  try {
    let audioInput: string | Blob | ArrayBuffer | Float32Array = audioSource;
    
    // Preprocess URL-based audio (especially for Opus/WebM formats)
    if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
      console.log('[LocalWhisper] Fetching and preprocessing audio...');
      audioInput = await this.preprocessAudioUrl(audioSource);
      console.log(`[LocalWhisper] Audio preprocessed: ${audioInput.length} samples at 16kHz`);
    }
    
    // Preprocess Blob input
    if (audioSource instanceof Blob) {
      console.log('[LocalWhisper] Preprocessing blob audio...');
      const arrayBuffer = await audioSource.arrayBuffer();
      audioInput = await this.preprocessArrayBuffer(arrayBuffer);
    }
    
    const result = await this.transcriber(audioInput, {
      return_timestamps: true,
      // ...existing options...
    });
    // ...rest of method...
  }
}
```

### Phase 3: Add Web Worker Support (Optional Enhancement)

To prevent UI freezing during preprocessing, wrap the preprocessing in a try-catch with a yield:

```typescript
// Use requestIdleCallback to prevent UI blocking
await new Promise(resolve => setTimeout(resolve, 0)); // Yield to UI
```

### Phase 4: Add Error Classification for Audio Decode Failures

Update the error classifier in `useVoiceBulkAnalysis.ts`:

```typescript
const classifyError = (error: Error) => {
  const msg = error.message.toLowerCase();
  
  // Add audio decode error detection
  if (msg.includes('decodeaudiodata') || msg.includes('unable to decode')) {
    return { type: 'audio_format', canRetry: false, message: 'Audio format not supported' };
  }
  // ...existing cases...
};
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/ml/localWhisperTranscriber.ts` | Add `preprocessAudioUrl()` and `preprocessArrayBuffer()` helpers, update `transcribe()` to use them |
| `src/hooks/useVoiceBulkAnalysis.ts` | Add audio format error classification |

## Technical Notes

- **16kHz Requirement**: Whisper models are trained on 16kHz audio. The `OfflineAudioContext` handles resampling efficiently.
- **Mono Audio**: Whisper expects single-channel audio. The preprocessing extracts channel 0.
- **Memory**: Each file creates an `AudioContext` which is closed after use to prevent memory leaks.
- **Format Support**: `decodeAudioData` handles Opus, MP3, WAV, AAC, FLAC natively in modern browsers.

## Testing Steps

1. Navigate to `/analysis` → Voice tab
2. Select contact with WhatsApp voice notes (`.opus` files)
3. Choose **Local (Fast)** processing mode
4. Select a few files and click **Start Analysis**
5. Verify:
   - No UI freezing during processing
   - Files complete successfully (not all failing)
   - Transcriptions appear in `voice_insights` table
   - Console shows `[LocalWhisper] Audio preprocessed: X samples at 16kHz`

## Expected Outcomes

1. **Files process successfully** - Opus audio properly decoded and transcribed
2. **No UI freezing** - Audio preprocessing yields to main thread
3. **Transcriptions saved** - Results stored in `voice_insights` table
4. **Session completes cleanly** - No "stuck" session on refresh
