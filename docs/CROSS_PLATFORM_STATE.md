# Cross-platform tree state — 2026-05-24

The repo carries four cross-platform trees in addition to the web app under
`/src`. None of them were touched in the recent OSINT slices, so they have not
"drifted" because of new work — but several were already broken before the
audit started. This doc captures the current state so future work doesn't have
to re-discover the same gaps.

## Summary

| Tree | Stack | Status | Coupling to /src schema |
| --- | --- | --- | --- |
| `/chrome-extension` | Vanilla JS MV3 | ✅ Healthy. Endpoint + token configured at runtime via popup, stored in `chrome.storage`. | Loose — sends POST bodies; not aware of table layouts. |
| `/src-extension` | Vanilla JS MV3 ("PICS Omni-Extractor") | ⚠️ Hardcoded localhost API URL + dummy key. Already broken in production. | Loose — same shape as `/chrome-extension`. |
| `/desktop-app` | Electron + electron-forge | ⚠️ Hardcoded Lovable preview URL (`d84a1d41-…lovableproject.com`). Will break if Lovable decommissions the preview. | Loose — loads the web app in a `BrowserWindow`; doesn't talk to Supabase directly. |
| `/src-desktop` | Tauri / Rust ("Desktop Ghost Daemon") | ⚠️ Hardcoded `http://127.0.0.1:54321` + `dummy-desktop-key`. Localhost-only; reads WAL files for IM apps. | Loose — calls `stream-processor` edge function. |

## What's blocking each tree

### `/src-extension` (PICS Omni-Extractor)
`src-extension/background.js` lines 5–6:
```js
const PICS_API_URL = "http://localhost:54321/functions/v1/stream-processor";
const PICS_API_KEY = "dummy-dev-key";
```
Needs to read both from extension config (mirror the `/chrome-extension` popup
+ `chrome.storage` pattern). Until then, the extension is dev-only.

### `/desktop-app`
`desktop-app/main.js` line 20:
```js
const APP_URL = 'https://d84a1d41-b6a8-4c7d-a30a-5f4baa19a16d.lovableproject.com';
```
Same root cause as `capacitor.config.ts:7-10` — Lovable preview URL baked into
the binary. Needs `process.env.PICS_APP_URL` with a sensible default and a
config UI.

### `/src-desktop`
`src-desktop/src/main.rs` lines 11–12:
```rust
const PICS_API_URL: &str = "http://127.0.0.1:54321/functions/v1/stream-processor";
const API_KEY: &str = "dummy-desktop-key";
```
Needs `std::env::var("PICS_API_URL")` + `std::env::var("PICS_API_KEY")` and a
config file (e.g. `~/.config/pics/config.toml`).

## What's NOT broken (intentional design)

- `/chrome-extension`: the popup UI accepts an API endpoint + bearer token,
  saves to `chrome.storage.local`, and `background.js` reads from there. This
  is the correct config pattern — the other extensions should adopt it.

## Why this isn't a recent regression

These hardcodes pre-date the OSINT audit work. `/desktop-app/main.js` and
`/src-desktop/src/main.rs` last received touches well before the slice 1-26
work began. Nothing in the recent commits touches these files.

## Recommended next steps (out of current scope)

1. `/src-extension` — port the popup-config pattern from `/chrome-extension`.
2. `/desktop-app` — replace `APP_URL` constant with `process.env.PICS_APP_URL`.
   Pair with a settings dialog (electron-store already in deps).
3. `/src-desktop` — read endpoint + key from env vars or config file. Add
   `clap` for CLI args if needed.

None of these is blocking the web app or the new edge functions.
