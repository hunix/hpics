
Goal: Make Local Whisper reliably transcribe WhatsApp “.opus” voice notes in Chrome/Edge without freezing the UI and without failing every file.

What I know / what’s happening now
- You’re on Chrome/Edge, files are mostly WhatsApp .opus, and the pattern is “freeze briefly then fail” for each file.
- Current code path:
  - useVoiceBulkAnalysis → processLocalRecording → localAudioAnalyzer.analyzeAudioFile(url) → localWhisperTranscriber.transcribe(url)
  - localWhisperTranscriber now fetches the URL, then calls AudioContext.decodeAudioData(), then OfflineAudioContext resampling, then passes Float32Array into @huggingface/transformers Whisper pipeline.
- This is still failing because:
  1) Chrome’s WebAudio decodeAudioData has known incompatibilities with certain OGG/Opus containers (WhatsApp .opus is typically OGG/Opus). Chrome can “play” them, but decodeAudioData can fail/hang.
  2) Even when it fails, decode/resample work can briefly block the main thread, causing the UI “panel freeze”.

Do I know what the issue is?
- Yes: decodeAudioData + WhatsApp’s OGG/Opus is a known pain point in Chrome. Our current preprocessing is “correct” for formats Chrome decodes well (mp3/wav/m4a in many cases), but not sufficient for WhatsApp .opus.

Strategy (reliability-first)
We will implement a multi-layered preprocessing + fallback strategy:

Layer A — Fast diagnostics & clearer failures (no more mystery freezes)
1) Add a hard timeout around decodeAudioData (and/or the entire preprocessing step)
   - Use Promise.race with an 8–12s timeout so we can reliably exit instead of hanging.
2) Improve “what did we fetch?” checks
   - In preprocessAudioUrl, capture:
     - response.status
     - response.headers.get('content-type')
     - arrayBuffer.byteLength
     - first few bytes signature (for OGG it’s “OggS”)
   - If content-type isn’t audio or signature looks like HTML (common on signed-url/auth failures), throw a “network/not audio content” error immediately with a helpful message.
3) Log structured diagnostics (dev-only console logs)
   - Log one line per file: content-type, size, signature, decode path used, and exact error.
   - This will let us confirm whether we are truly getting OGG/Opus and whether decodeAudioData is failing or hanging.

Layer B — Proper Opus decoding path for WhatsApp .opus (fix root cause)
Because decodeAudioData can fail for OGG/Opus in Chrome, we need a decoder that doesn’t rely on Chrome’s WebAudio decode. The most practical approach is a WASM OGG/Opus decoder.

4) Add a dedicated OGG/Opus decoding fallback using a WASM decoder library
   - Add dependency: ogg-opus-decoder (has Web Worker support).
   - Detection rule:
     - if content-type includes “audio/ogg” or “audio/opus”
     - OR file extension ends with .opus
     - OR signature is “OggS”
     - then prefer WASM decoder if decodeAudioData fails OR times out.
5) Decode to PCM Float32Array + sampleRate (usually 48k), then resample to 16k in pure JS
   - To avoid UI freezes and avoid OfflineAudioContext overhead, implement a lightweight resampler (linear interpolation is sufficient for Whisper input).
   - Do the decode + resample in a Worker where possible:
     - Worker receives ArrayBuffer, returns Float32Array @ 16k mono.
   - This eliminates the “freeze then fail” behavior caused by main-thread decode/resample.

Layer C — “Don’t burn the user” fallback during bulk runs
Even with a robust decoder, we should prevent 100% failures from wasting time:

6) Per-run capability probe
   - At start of Local/Hybrid run, run a quick “can decode this format?” test on the first selected file:
     - Fetch first file, attempt preprocessing (with strict timeout).
   - If it fails with audio_format, immediately:
     - show a toast: “Local decoding for WhatsApp .opus is not supported on this device/browser. Switching to Cloud for these files.”
     - automatically switch actualMode to cloud for the remainder of the batch (or only for the .opus files).
7) Per-file conditional fallback (optional but recommended)
   - If a file fails locally with audio_format:
     - mark it as “fallback_to_cloud”
     - run cloud transcription for that file (if Cloud is enabled) instead of marking it failed.
   - This can be gated behind a toggle: “Auto-fallback to Cloud when Local fails”.

Files we will change (implementation)
1) src/lib/ml/localWhisperTranscriber.ts
   - Add:
     - content sniffing (signature + content-type checks)
     - decodeAudioData timeout
     - WASM/worker-based OGG/Opus decoder fallback
     - pure JS resampler to 16k
   - Update transcribe() to route through:
     - preprocessAudioUrl → preprocessArrayBuffer → (native decodeAudioData OR opus-wasm decode) → resample16k → Float32Array
2) (New) src/lib/audio/opus/opusDecoderWorker.ts (or similar)
   - Worker that uses ogg-opus-decoder webworker class OR does decoding off-main-thread.
3) src/hooks/useVoiceBulkAnalysis.ts
   - Add:
     - “capability probe” before batch starts when mode is local/hybrid
     - automatic mode downgrade (or per-file fallback) when audio_format errors exceed a threshold
     - improved user-facing error message for .opus limitations

Dependency changes
- Add: ogg-opus-decoder
  - We will keep it scoped to the local transcription pipeline so it doesn’t affect unrelated areas.

Testing plan (acceptance criteria)
1) Small batch (3–5 WhatsApp .opus) on Chrome/Edge
   - Expected:
     - No multi-second UI freezes
     - Files do not all fail immediately
     - Transcriptions appear and are saved (voice_insights upserts succeed)
2) Regression: MP3/WAV files
   - Expected:
     - Still work via native decodeAudioData path
     - No significant performance regression
3) Failure-mode validation
   - If a signed URL returns HTML/403:
     - We fail fast with a clear “audio not accessible / not audio response” message (network category), not a misleading audio_format error.
4) Bulk reliability
   - If local decode truly unsupported on a specific platform:
     - The probe triggers once and the system switches modes instead of failing every file.

Risks / tradeoffs
- Adding a WASM decoder increases bundle weight (but it’s only used when needed). We’ll load it lazily when encountering OGG/Opus to minimize impact.
- Implementing worker-based decoding requires careful handling of ArrayBuffer transfer to avoid copies; we’ll transfer ownership where possible.

What I need from you (minimal)
- Please try Cloud mode once on the same WhatsApp .opus files and tell me if it succeeds. This determines whether we should auto-fallback per file or only switch mode for the whole run.

Outcome
- WhatsApp .opus files will reliably transcribe locally on Chrome/Edge using a proper Opus decoding fallback, the UI will remain responsive, and the bulk run will no longer churn through every file as “failed”.
