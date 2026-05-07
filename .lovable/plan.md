## HPICS Architecture & Codebase Audit (May 2026)

Snapshot of the system as it stands today, what's drifted since the last touch, and a prioritized plan to bring it back to spec.

---

### Inventory

| Layer | Count |
|---|---|
| DB tables (public) | **610** |
| DB migrations | 226 |
| Edge functions | **126** (15 domain routers + ~111 standalone) |
| Frontend routes | 92 |
| Pages | 89 |
| Hooks | 127 |
| Domain TS files (DDD) | 46 |
| NPM dependencies | 81 |
| App version | v3.9.54 |

---

### Critical Findings

#### 1. Architecture drift — invocation proxy bypassed at scale
- **247 files / 388 call-sites** still call `supabase.functions.invoke(...)` directly instead of the mandated `invokeFunction()` adapter from `@/lib/api`.
- The "lint enforcement gate" memorialised in project memory (`no-restricted-syntax`) is **not actually present** in `eslint.config.js` — `grep` finds no rule. The gate was documented but never wired.
- Result: routing/circuit-breaker/health metrics bypassed for the majority of calls. The global invoke proxy in `main.tsx` partially mitigates this, but only for functions present in `ROUTE_MAP`.

#### 2. Edge function sprawl — consolidation incomplete
- Memory says "~350 standalone functions deleted, modular monolith complete." Reality: **111 standalone functions remain** alongside the 15 routers (e.g. `agent-workflow`, `agentic-rag`, `deep-research-agent`, `vulnerability-intelligence`, `red-team-executor`, `device-security-scanner`, 50+ `suggest-*`/`sync-*`/`process-*`/`transcribe-*`/`import-*`).
- Many of these belong inside an existing router (intelligence, utility, hardware, voice, security). Grace period for cleanup expired **2026-03-15** per memory.

#### 3. Database security warnings — 190 issues from Supabase linter
Aggregate breakdown of the 190 WARN findings:
- **~180** `SECURITY DEFINER` functions executable by `anon` and/or `authenticated` (lint codes 0028/0029) — privilege escalation risk surface.
- **2** Public storage buckets allow listing (lint 0025).
- **1+** RLS policies using `USING (true)` on write operations (lint 0024).
- **1** Function with mutable `search_path` (lint 0011).
- **Several** SECURITY DEFINER functions that should be SECURITY INVOKER.

#### 4. Type safety regressions
- **502** `: any` annotations in `src/`. Convention requires explicit types or `unknown`.
- **692** `console.log/warn/error` calls in `src/` (should use `@/lib/logger`).
- **559** matches for `mock | stub | placeholder` strings — most are likely UI placeholder props, but a sweep is needed to confirm none are live data fakes.

#### 5. Deprecated hooks still imported
- `useEnhancedContacts`, `useNetworkData`, `useUnifiedIntelligence`, `useIntelligenceFusion` are marked `@deprecated` but still exported and imported across pages. Contacts/Network DDD migration is incomplete.

#### 6. Workflow orchestrator & vulnerability-defense pipeline
- `agent-workflow`, `red-team-executor`, `vulnerability-intelligence`, `device-security-scanner` exist as standalone functions outside any router and outside the `ROUTE_MAP`, so the invoke proxy can't route them and the circuit-breaker can't observe them.
- `hoc-gateway` ROUTE_MAP needs verification it still references all 9 workflows post-additions.

#### 7. Misc
- 6 files with `@deprecated` annotations — sweep & remove or migrate.
- Latest migration is from 2026-03-17; nothing since. Schema is stable but linter findings have piled up.
- App version v3.9.54 — `FORCE_CLEAR_VERSIONS` should be reviewed.

---

### Remediation Plan (4 phases)

#### Phase 1 — Security hardening (highest priority)
1. **Lock down SECURITY DEFINER functions**: audit all flagged functions. For each, either `REVOKE EXECUTE FROM anon, authenticated`, switch to `SECURITY INVOKER`, or document it as intentionally public in security memory. Target: clear all 180 lint 0028/0029 warnings.
2. **Fix mutable `search_path`** on the one flagged function (set `SET search_path = public`).
3. **Tighten public buckets**: scope SELECT policies on the two public buckets to specific prefixes/owners.
4. **Replace `USING (true)` write policies** with proper auth checks.
5. Re-run linter; document any intentionally public surface in `update_memory`.

#### Phase 2 — Architecture re-alignment
1. **Wire the lint gate**: add `no-restricted-syntax` rule blocking `supabase.functions.invoke(` outside `src/lib/api/` and `src/main.tsx`. Add `no-restricted-imports` for `@/integrations/supabase/types` (also missing).
2. **Migrate the 247 violator files** to `invokeFunction()`. Use a codemod / `sd` for the mechanical rewrites, then hand-fix the ~30 cases that pass custom headers.
3. **Fold remaining standalone functions into routers**:
   - `intelligence-router`: agent-workflow, agentic-rag, deep-research-agent, intelligence-verification, graph-reasoning, transcendent-analysis, generate-proactive-insights, summarize-conversation, comprehensive-contact-scan, all `suggest-*`.
   - `security-router`: vulnerability-intelligence, red-team-executor, device-security-scanner, opsec-vulnerability-analyzer, threat-actor-profiler, tscm-*, zero-day-anomaly-detector.
   - `hardware-router`: thermal-*, sdr-intelligence, sensor-network, aerial-intelligence, generate-hardware-report.
   - `voice-router`: transcribe-audio, transcribe-voice-note, identify-speakers, voice-stress-correlator.
   - `utility-router`: trigger-*, webhook-receiver, test-integration, test-api-key, validate-observation.
   - Keep standalone only: OAuth callbacks (`gmail-oauth`, `outlook-oauth`, `google-calendar-oauth`), sync jobs that need `verify_jwt = false` and dedicated config, webhook receivers (`whatsapp-webhook`, `chrome-extension-bridge`).
4. **Update `ROUTE_MAP`** so the invoke proxy can transparently route every migrated tool.
5. **Update `hoc-gateway` ROUTE_MAP** to expose all 9 autonomous workflows + new vulnerability tools to external HoC agents.

#### Phase 3 — DDD completion & code quality
1. Finish migrating off `useEnhancedContacts`, `useNetworkData`, `useUnifiedIntelligence`, `useIntelligenceFusion`. Then delete them.
2. Replace 692 `console.*` calls in `src/` with `@/lib/logger` (already exists). Add an ESLint `no-console` rule scoped to `src/`.
3. Sweep 502 `: any` annotations — replace with proper types or `unknown` + narrowing. Add `@typescript-eslint/no-explicit-any` as `warn`.
4. Audit the 559 `mock|stub|placeholder` matches; remove any that are still serving live data instead of UI placeholders.

#### Phase 4 — Operational polish
1. Bump `APP_VERSION` to **v4.0.0** to reflect the consolidation; add to `FORCE_CLEAR_VERSIONS`.
2. Refresh `.lovable/plan.md` and `docs/COMPLETE_SYSTEM_REFERENCE.md` with the corrected counts (126 functions, 610 tables).
3. Add a short `docs/AUDIT_2026-05.md` capturing this audit and what was fixed.
4. Re-run `supabase--linter` and dependency scan; confirm green.

---

### Technical Notes
- All migrations will use `supabase--migration` (one per phase to keep diffs reviewable).
- Frontend invocation rewrite is mechanical and safe: `supabase.functions.invoke(name, { body })` → `invokeFunction(name, { body })`; the `headers`-passing exceptions stay as-is.
- Router consolidation can be staged: each function moved becomes a route in its target router; the standalone directory is then deleted in the same PR. The global invoke proxy means no frontend changes are required for migrated functions, only `ROUTE_MAP` updates.
- Security definer audit will produce a CSV of `(function_name, is_definer, callers, action)` before any GRANT/REVOKE statements are written.

---

### Out of scope (flag only)
- Local-AI infrastructure (`src/lib/localAI/`) — not exercised in production paths; needs a separate review.
- Capacitor / Electron / Chrome extension wrappers — independent build targets.
- 124-section dossier renderer correctness — assumed correct per v3.9.53 fix.

Approve and I'll start with Phase 1 (security hardening) since that's the highest-risk surface.
