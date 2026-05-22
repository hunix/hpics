## HPICS v3.9.55 → v4.0.0 — Full Audit & Modernization Plan

### Current state (measured today)

| Area | Metric | Status |
|---|---|---|
| App version | 3.9.55 | Stale (last touched May 2026) |
| DB migrations | 228 | OK |
| DB tables | 610 | OK |
| Edge functions | 126 total (15 routers + 109 standalone + _shared) | Sprawl |
| Supabase linter | 95 warnings (down from 190) | Mid-cleanup |
| Direct `supabase.functions.invoke` calls | **252 files** still bypass `invokeFunction()` adapter | Lint gate exists, code not migrated |
| `console.*` call sites | 262 | Should use `@/lib/logger` |
| `: any` annotations | 673 | Type-safety gap |
| Deprecated hooks in use | 2 files | Almost done |
| AI model refs (frontend) | Pinned to gemini-2.5-*, gemini-3-pro-preview, gpt-5/5.2 | **Outdated** — new gemini-3-flash-preview, 3.1-pro-preview, 3.5-flash, gpt-5.4/5.5 available |

### Findings by severity

**Critical (must fix)**
1. **Lint gate is bypassed at scale** — `eslint.config.js` blocks `supabase.functions.invoke()`, but 252 files still call it directly. Build presumably still passes because the invoke proxy (`installInvokeProxy`) silently routes mapped functions and the lint rule is `error` but probably not blocking CI. Result: circuit-breaker / router metrics miss most traffic.
2. **95 Supabase linter warnings** remaining: 1× permissive RLS (`USING(true)` on a write policy), 1× public-bucket-listing, ~90× authenticated `SECURITY DEFINER` callable. Needs explicit accept-or-revoke per function.
3. **AI model registry is stale** — `AIModelSelector`, `ModelEfficiencyComparison`, `BulkMetadataGenerator`, etc. don't expose: `google/gemini-3-flash-preview`, `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`, `google/gemini-3.1-flash-lite-preview`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`, `openai/gpt-5.5`, `openai/gpt-5.5-pro`. Pricing table + default model selection also need a refresh.

**High**
4. **109 standalone edge functions** still outside the 15 routers. Key offenders that should be folded in: `agent-workflow`, `autonomy-engine`, `deep-research-agent`, `device-security-scanner`, `red-team-executor`, `vulnerability-intelligence`, `vulnerability-window-detector`, `opsec-vulnerability-analyzer`, `agentic-rag`, `agis-orchestrator`, `cross-modal-synthesis`, `future-timeline-engine`, plus ~20 `analyze-*`, `detect-*`, `generate-*`, `auto-sync-*`. None of these appear in `ROUTE_MAP`, so the invoke proxy can't route them and the router circuit-breakers can't observe them.
5. **2 deprecated-hook holdouts** — finish the migration so `useEnhancedContacts`, `useNetworkData`, `useUnifiedIntelligence`, `useIntelligenceFusion` can be physically deleted.

**Medium**
6. **673 `: any`** — focus on hooks, API adapters, and `src/lib/intelligence/` first.
7. **262 `console.*`** — replace with `@/lib/logger` so production logs are leveled and shippable.
8. **HoC gateway alignment** — confirm `ROUTE_MAP` advertises every workflow the HoC Integration page documents (the page lists 9 workflows and 15 categories — re-verify after router consolidation).

### Proposed phased plan

**Phase A — AI model refresh (small, high-value, ship first)**
- Add the 8 new models (gemini-3-flash-preview, 3.1-pro-preview, 3.5-flash, 3.1-flash-lite-preview, gpt-5.4, 5.4-mini, 5.5, 5.5-pro) to `AIModelSelector`, `ModelEfficiencyComparison`, `BulkMetadataGenerator`, `FaceScanJobCreator`, `MediaIntelligenceDashboard`, `aiPricing.ts`.
- Update default model in router handlers from `gemini-2.5-flash` → `gemini-3-flash-preview` (already the project standard per memory).
- Update `useAIModelPreference` default + add a "What's new" tooltip.

**Phase B — Invocation adapter migration (codemod)**
- Write a codemod script that rewrites `supabase.functions.invoke(name, { body })` → `invokeFunction(name, body)` across the 252 files (preserves `headers` overrides by falling back to original invoke).
- Promote the existing `no-restricted-syntax` lint rule from `error` to a CI-blocking gate and add a smoke build.

**Phase C — Edge-function consolidation**
- Move the 12 high-traffic standalone functions (workflow, autonomy, red-team, vulnerability suite, deep-research, agis-orchestrator) into `warfare-router`, `intelligence-router`, `security-router`, `agis-router`.
- Update `ROUTE_MAP` and `hoc-gateway` workflow registry.
- Delete the migrated standalone folders (keep one release as deprecation shim if needed).

**Phase D — Security closeout**
- For each of the ~90 remaining `SECURITY DEFINER` warnings: revoke from `authenticated` where it's an internal RPC, or document acceptance in `security--update_memory`.
- Fix the last permissive-RLS write policy and the public-bucket listing.
- Re-run `supabase--linter` until warnings reflect only intentional surface.

**Phase E — Code-quality sweep**
- Replace 262 `console.*` with `@/lib/logger`.
- Type 673 `: any` (target the top 50 hotspot files; leave generated/3p alone).
- Delete the 4 deprecated hook files after final 2 call-sites are migrated.

**Phase F — Release**
- Bump `APP_VERSION` to `4.0.0`, add to `FORCE_CLEAR_VERSIONS`.
- Update `docs/QUICK_REFERENCE_CARD.md`, `README.md`, and HoC Integration page.
- Add audit record migration.

### Technical details

- Codemod approach: `ts-morph` script under `scripts/`; matches `CallExpression` where `callee` is `supabase.functions.invoke`. Skips files inside `src/lib/api/**` and `src/main.tsx` (already exempted in `eslint.config.js`).
- Router consolidation pattern: each migrated function becomes `app.post('/<slug>', withHandler(...))` in the target router, identical to existing `voice-router` / `utility-router` shape.
- Model registry lives in `src/components/ai/AIModelSelector.tsx` + `src/lib/aiPricing.ts`; one source of truth refactor optional.
- Linter sweep uses `supabase--migration` for each batched `REVOKE EXECUTE` block.

### Suggested execution order

Start with **Phase A** (1 PR, ~6 files, immediate user-visible win) and **Phase D** (security finishes what was already started). Then **Phase B** codemod unblocks **Phase C** consolidation. **Phase E + F** ship together as v4.0.0.

Confirm and I'll begin with Phase A (AI model refresh) unless you want a different starting point.