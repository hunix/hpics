
# Fix: Analysis Page Module Loading Error

## Problem Summary

The `/analysis` page crashes immediately with:
```
SyntaxError: The requested module '/node_modules/@eshaz/web-worker/cjs/browser.js' does not provide an export named 'default'
```

This error occurs because:
1. `ogg-opus-decoder` uses `@eshaz/web-worker` (nested dependency)
2. `@eshaz/web-worker` is a **CommonJS module** in the `cjs/` folder
3. Vite's dependency optimizer is incorrectly treating it as ESM
4. The `localWhisperTranscriber.ts` has a **top-level import** of `OggOpusDecoderWebWorker`
5. This import runs immediately when the Analysis page loads

## Root Cause Analysis

```text
Analysis Page Load
      │
      ▼
VoiceBulkAnalysisPanel.tsx
      │ imports
      ▼
localWhisperTranscriber.ts (line 12)
      │ top-level import
      ▼
import { OggOpusDecoderWebWorker } from "ogg-opus-decoder"
      │
      ▼
@wasm-audio-decoders/common
      │
      ▼
@eshaz/web-worker/cjs/browser.js  ← FAILS HERE
      │
      ✗ SyntaxError: no 'default' export
```

## Solution: Two-Part Fix

### Part 1: Vite Configuration Update

Add the problematic nested dependencies to `optimizeDeps.exclude` and configure CommonJS handling:

**File: `vite.config.ts`**
```typescript
optimizeDeps: {
  exclude: [
    'ogg-opus-decoder',
    '@eshaz/web-worker',              // Add this
    '@wasm-audio-decoders/common',    // Add this
    '@wasm-audio-decoders/opus-ml'    // Add this
  ]
},
build: {
  commonjsOptions: {
    include: [/node_modules/],
    transformMixedEsModules: true,
  }
}
```

### Part 2: Lazy Dynamic Import

Move the `OggOpusDecoderWebWorker` import from top-level to a **dynamic import** inside the method that uses it. This prevents the module from loading until actually needed:

**File: `src/lib/ml/localWhisperTranscriber.ts`**

Before (line 12):
```typescript
import { OggOpusDecoderWebWorker } from "ogg-opus-decoder";
```

After:
```typescript
// Remove the top-level import entirely
// Import dynamically inside decodeOpusWithWasm method

private async decodeOpusWithWasm(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
  // Lazy-initialize decoder with dynamic import
  if (!this.opusDecoder || !this.opusDecoderReady) {
    try {
      console.log('[LocalWhisper] Dynamically importing ogg-opus-decoder...');
      const { OggOpusDecoderWebWorker } = await import('ogg-opus-decoder');
      
      console.log('[LocalWhisper] Initializing OggOpusDecoderWebWorker...');
      this.opusDecoder = new OggOpusDecoderWebWorker();
      await this.opusDecoder.ready;
      this.opusDecoderReady = true;
      console.log('[LocalWhisper] WASM Opus decoder initialized successfully');
    } catch (initError) {
      console.error('[LocalWhisper] WASM Opus decoder failed to initialize:', initError);
      this.opusDecoder = null;
      this.opusDecoderReady = false;
      throw new Error('Opus decoder unavailable - WASM failed to load. Try Cloud mode for .opus files.');
    }
  }
  // ... rest of method unchanged
}
```

### Part 3: Separate Type Export

The `VoiceBulkAnalysisPanel` imports types from `localWhisperTranscriber.ts`. We need to ensure the type exports don't trigger the WASM module load:

**File: `src/lib/ml/localWhisperTranscriber.ts`**

The existing exports (`WhisperModel`, `LANGUAGE_DISPLAY_MAP`) are pure TypeScript types and constants, so they're safe. The issue is only with the runtime import of `OggOpusDecoderWebWorker`.

## Files to Modify

| File | Change |
|------|--------|
| `vite.config.ts` | Add nested dependencies to `optimizeDeps.exclude`, add `build.commonjsOptions` |
| `src/lib/ml/localWhisperTranscriber.ts` | Change top-level import to dynamic `import()` inside `decodeOpusWithWasm` |

## Technical Notes

### Why Dynamic Import Fixes This

- **Top-level import**: Module loads immediately when parent file is imported
- **Dynamic import**: Module loads only when `import()` is called at runtime
- The Analysis page doesn't need Opus decoding until the user actually clicks "Analyze" on voice files

### Why Vite Config Changes Are Needed

- `optimizeDeps.exclude`: Prevents Vite from pre-bundling these packages (which breaks WASM)
- `build.commonjsOptions.transformMixedEsModules`: Helps Rollup correctly handle mixed CJS/ESM modules
- `build.commonjsOptions.include`: Ensures all node_modules are considered for CJS transformation

### Alternative Approaches Considered

1. **Lazy load entire `localWhisperTranscriber`**: Would require refactoring all consuming components
2. **Use synchronous decoder**: `OggOpusDecoder` has the same dependency issue
3. **Remove WASM decoder**: Would break WhatsApp `.opus` file support entirely

The dynamic import approach is the least invasive and most robust solution.

## Expected Outcome

After this fix:
1. Analysis page loads without errors
2. Opus decoder only loads when actually needed (voice file analysis)
3. WASM files work correctly in both dev and production builds
4. No impact on Cloud mode (doesn't use local WASM decoder)

## Testing Plan

1. Navigate to `/analysis` - page should load without errors
2. Switch to Voice tab - no errors
3. Select `.opus` files and run Local analysis - decoder loads dynamically
4. Verify console shows `[LocalWhisper] Dynamically importing ogg-opus-decoder...` only when processing
