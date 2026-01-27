
Goal
- Stop the “30 tasks failed again” loop by fixing the real cause of the repeated 401/invalid-token errors, without requiring a full rerun. Ensure “Retry Failed” successfully completes Mona’s dossier.

What we know from current evidence
- The session runner is correctly calling child backend functions with Authorization: Bearer <service role key>.
- Runner logs show two distinct failure signatures:
  1) HTTP 401 {"error":"Invalid authentication"} for several v6/v7/v8 functions.
  2) HTTP 500 bodies like {"error":"Invalid user token"} / {"success":false,"error":"Invalid token"} for others.
- supabase/config.toml is missing verify_jwt=false entries for several of the failing functions (confirmed: no config sections for audio-burst-analyzer, iio-attribution-engine, stylometric-analyzer; and likely others in the failing set). When a function has no explicit config, platform JWT verification can reject non-user tokens or transform token handling, producing “Invalid authentication” before our code runs.
- Child function logs show only “booted”, which strongly suggests requests are being rejected upstream (especially for the ones returning 401 Invalid authentication).
- The version banner confusion is real: platform_config.app_published_version (config_value) is 3.9.51 in Test, while the app is reporting current 3.9.54, so the update banner is inverted.

Root cause (precise)
A) Missing function-level verify_jwt=false config for many of the v6/v7/v8 engines:
- The platform is performing JWT enforcement/processing by default for those functions, which breaks runner calls and yields “HTTP 401: Invalid authentication”.

B) Inconsistent token path for some functions:
- Some functions still emit “Invalid user token/Invalid token” (HTTP 500) because the service-role detection branch isn’t being taken reliably in practice (often due to upstream JWT behavior). The robust fix is still to set verify_jwt=false so the runner’s service role key arrives unchanged and equality checks behave predictably.

C) UI update banner mismatch:
- app_published_version is stale (3.9.51), causing the banner to claim an older version is “available”.

Implementation plan (no full rerun required)
Phase 1 — Make runner-to-function auth reliable (the actual blocker)
1) Update supabase/config.toml
   - Add [functions.<name>] verify_jwt = false for every function invoked by intelligence-session-runner that is currently missing an entry.
   - Minimum set based on the latest runner failure logs:
     - audio-burst-analyzer
     - iio-attribution-engine
     - stylometric-analyzer
     - reflexive-control-detector
     - cognitive-effect-orchestrator
     - plus any other v6/v7/v8 task functions that are currently missing verify_jwt config (we will cross-check the INTELLIGENCE_TASKS list in intelligence-session-runner and ensure all 94 tasks have explicit verify_jwt=false entries to prevent regressions).
   - Why: eliminates upstream JWT enforcement issues and stops the “Invalid authentication” 401s.

2) Redeploy backend functions
   - Redeploy at least:
     - intelligence-session-runner
     - all functions that were failing (the 30 list from runner logs)
   - Why: config changes must be applied to the deployed backend functions environment to take effect.

3) Add targeted diagnostics (only if needed after config fix)
   - If any tasks still fail, add minimal safe logging to a small subset of still-failing functions:
     - log whether request is recognized as service call, without printing secrets (e.g., log token length, not token value).
   - Why: confirms whether the request is reaching the handler and which branch is taken.

Phase 2 — Fix the “inverted update banner” (stops version confusion + reduces cache surprises)
4) Update platform_config
   - Update platform_config row:
     - config_key = 'app_published_version'
     - set config_value to the actual current shipped APP_VERSION (and after the next patch, bump to the new version).
   - Important: use config_value (not override_value).

Phase 3 — Validate without spending credits on a full rerun
5) Use “Retry Failed” (existing capability)
   - You already have a retry path wired:
     - Frontend: useIntelligenceSession.retryFailed() calls intelligence-session-runner with action 'retry_failed'.
   - After redeploy + config fix:
     - Click “Retry Failed” in /dossier-intelligence to run only the failed tasks for Mona.
   - Expected result:
     - The 30 tasks should move from Failed → Running → Completed.
     - The dossier should become complete without re-running the 65 already completed tasks.

Success criteria
- No “HTTP 401: Invalid authentication” errors from runner for any task.
- Failed tasks complete successfully when using “Retry Failed”.
- Voice aggregate task completes and the VoiceIntel section reflects voice_insights + voice_intelligence_aggregate.
- Update banner no longer suggests “3.9.51 available” when app is on 3.9.54+.

Risk/edge cases to watch
- If any task still returns “Invalid token” after verify_jwt=false:
  - That indicates the handler is running and still not recognizing the runner call; we will then normalize the dual-auth detection to be resilient (optionally using claims.role === 'service_role' via getClaims) and redeploy only those remaining functions.
- If some tasks are still failing due to missing function deployment (404):
  - We will confirm by runner logs (it marks 404 as skipped) and then create/deploy the missing function folder(s). (Note: your latest logs show tas-com-community-detector returning “Invalid user token” rather than 404, suggesting it exists.)

Work breakdown checklist (what I will do in Default mode)
- [ ] Parse intelligence-session-runner’s INTELLIGENCE_TASKS and build the definitive list of required function configs
- [ ] Patch supabase/config.toml to include verify_jwt=false for all task functions (especially the missing v6/v7/v8 engines)
- [ ] Redeploy the runner + affected task functions
- [ ] Update platform_config.app_published_version config_value to match APP_VERSION
- [ ] Validate by using “Retry Failed” on Mona and monitoring runner logs for zero auth failures

Notes for you (non-technical)
- You won’t need to re-run the entire package. After this fix, “Retry Failed” should finish only the remaining items, saving credits.
- The weird “Update Now” banner behavior is due to the backend’s “latest version” value being outdated; we’ll align it so it stops prompting incorrectly.
