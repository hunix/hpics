
# Fix Local Whisper Analysis: WASM Loading and Opus Decoding

## Problem Confirmed

Local voice transcription for WhatsApp `.opus` files is still failing despite adding `ogg-opus-decoder`. Based on my investigation:

| Finding | Evidence |
|---------|----------|
| Vite is breaking WASM | `vite.config.ts` does NOT exclude `ogg-opus-decoder` from dependency optimization |
| Main-thread blocking | Using `OggOpusDecoder` (sync) instead of `OggOpusDecoderWebWorker` (async/worker) |
| Silent failures | WASM load errors may be caught but not clearly surfaced to UI |
| Published site issue | You confirmed failures happen on published site (production build) |

## Root Cause: Vite Bundling Breaks WASM

When Vite/esbuild optimizes `ogg-opus-decoder`, it mangles the WASM file paths or fails to bundle them correctly. The decoder silently fails during initialization, causing every subsequent `.decode()` call to throw.

## Solution: Multi-Layer Fix

### Layer 1: Vite Configuration (Critical)

Add `ogg-opus-decoder` to Vite's optimization exclusion list so WASM files are served correctly:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['ogg-opus-decoder']
  },
  // ... rest of config
});
```

### Layer 2: Use Web Worker Decoder (Prevent UI Freeze)

Replace `OggOpusDecoder` with `OggOpusDecoderWebWorker` for off-main-thread decoding:

```typescript
// Before:
import { OggOpusDecoder } from "ogg-opus-decoder";
this.opusDecoder = new OggOpusDecoder();

// After:
import { OggOpusDecoderWebWorker } from "ogg-opus-decoder";
this.opusDecoder = new OggOpusDecoderWebWorker();
```

Both have the same API (`ready`, `decode`, `free`), but the worker version runs decoding in a background thread.

### Layer 3: Initialization Error Handling

Wrap WASM decoder initialization with explicit error logging so failures are visible:

```typescript
try {
  this.opusDecoder = new OggOpusDecoderWebWorker();
  await this.opusDecoder.ready;
  console.log('[LocalWhisper] WASM Opus decoder initialized successfully');
} catch (initError) {
  console.error('[LocalWhisper] WASM Opus decoder failed to initialize:', initError);
  this.opusDecoder = null; // Mark as unavailable
  throw new Error('Opus decoder unavailable - WASM failed to load');
}
```

### Layer 4: Fallback When WASM Unavailable

If WASM fails entirely (e.g., browser restrictions), skip local Opus decoding and auto-switch to cloud:

```typescript
if (diagnostics.isOggOpus) {
  if (!this.opusDecoder) {
    throw new Error('Opus format requires WASM decoder which is unavailable');
  }
  return await this.decodeOpusWithWasm(arrayBuffer);
}
```

## Files to Modify

| File | Change |
|------|--------|
| `vite.config.ts` | Add `optimizeDeps.exclude: ['ogg-opus-decoder']` |
| `src/lib/ml/localWhisperTranscriber.ts` | Switch to `OggOpusDecoderWebWorker`, add init error handling |

## Technical Details

### Why OggOpusDecoderWebWorker?

- Runs WASM decoding in a Web Worker (off main thread)
- Prevents the "freeze then fail" pattern you're seeing
- Has identical API to `OggOpusDecoder`
- Recommended by library maintainers for production use

### Why optimizeDeps.exclude?

- Vite's esbuild pre-bundling can't handle WASM correctly
- Excluding the package forces Vite to serve it as-is
- This is a known pattern for WASM-heavy npm packages

## Expected Outcomes

After this fix:
1. WASM loads correctly in production builds
2. Decoding runs in a worker (no UI freezes)
3. `.opus` files transcribe successfully
4. Clear error messages if WASM truly can't load (rare edge cases)

## Testing Plan

1. Rebuild and deploy
2. Navigate to Media Analysis Hub → Voice tab
3. Select WhatsApp `.opus` files
4. Run Local analysis
5. Verify:
   - No UI freeze
   - Files succeed (not all failing)
   - Console shows `[LocalWhisper] WASM Opus decoder initialized successfully`
