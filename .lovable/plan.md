## Audit & Migration Plan — Functions + DB Objects

### Measured state (today)

| Surface | Count | Note |
|---|---|---|
| Direct `supabase.functions.invoke()` sites | **393 across 250 files** | bypass router adapter, miss circuit breakers |
| Standalone edge functions | **109** (outside 15 routers + `_shared`) | sprawl, no health/metrics aggregation |
| Supabase linter warnings | **95** | 1 permissive RLS, 1 public-bucket listing, ~93 SECURITY DEFINER callable by `authenticated` |
| App version | 3.9.56 | will bump on completion |

The work is large and partially destructive. I'll execute it in **4 sequenced batches** and report after each. You can stop at any batch boundary.

---

### Batch 1 — DB / Security closeout (low risk, ship first)

Goal: zero out the linter for everything that is not intentional public surface.

1. **Permissive RLS** — find the one remaining write policy with `USING(true)`/`WITH CHECK(true)` and replace with `service_role`/`auth.uid()` guard.
2. **Public bucket listing** — restrict the over-broad `storage.objects` SELECT policy on the offending public bucket (likely `avatars`) so anonymous can read individual files but cannot list the bucket.
3. **~93 SECURITY DEFINER callable** — programmatic `REVOKE EXECUTE … FROM authenticated, anon, PUBLIC` for every function not on the intentional client-RPC allowlist; keep allowlist functions (`has_role`, `has_clearance`, `get_user_clearance`, `track_navigation_access`, `check_api_keys`, `delete_api_key`, `toggle_contact_active_status`, `log_*_access`, `match_documents_v2`, `search_contacts_v5`, `search_messages_v2`, `get_contact_*`, `get_storage_*`, `get_document_folders`) callable.
4. Re-run `supabase--linter`; document remaining intentional surface in `security--update_memory`.

Deliverable: 1 migration, linter goes from 95 → ~10–15 (intentional only).

---

### Batch 2 — Invoke adapter codemod (392 sites → `invokeFunction()`)

1. Write `scripts/codemod-invoke.ts` (ts-morph) — matches `CallExpression` where callee is `supabase.functions.invoke`, rewrites to `invokeFunction(name, body)`; preserves `headers` overrides by leaving original call untouched; skips `src/lib/api/**`, `src/main.tsx`.
2. Run codemod in 5 chunks (~50 files each) to keep diffs reviewable; build between chunks.
3. Promote `no-restricted-syntax` ESLint rule that already exists from advisory to **CI-blocking error** with zero exceptions outside the adapter.

Deliverable: 393 → 0 direct invokes; circuit-breakers observe 100% of traffic.

---

### Batch 3 — Edge function consolidation (109 standalone → ~15 routers)

Migrate **27 high-traffic / domain-aligned** functions first into existing routers:

- **warfare-router** (`/red-team`, `/vulnerability-window`, `/opsec-vuln`, `/tactical-negotiation`, `/threat-actor-profile`, `/trauma-exploitation`, `/zero-day-anomaly`)
- **intelligence-router** (`/agent-workflow`, `/autonomy`, `/deep-research`, `/agentic-rag`, `/agis-orchestrator`, `/cross-modal`, `/future-timeline`, `/synchronicity`, `/transcendent`, `/synthetic-consensus`, `/synthetic-memory`)
- **security-router** (`/device-security-scanner`, `/vulnerability-intel`, `/tscm-sweep`, `/threat-actor-profile`)
- **voice-router** (`/voice-stress-correlator`, `/transcribe-audio`, `/transcribe-voice-note`, `/identify-speakers`)
- **utility-router** (`/suggest-*` family — 8 functions, `/summarize-conversation`, `/trigger-*`)
- **network-router** (`/analyze-network-intelligence`, `/tas-com-community-detector`, `/track-community-evolution`, `/suggest-network-growth`)

For each: add route handler in target router, update `ROUTE_MAP` + `hoc-gateway` workflow registry, then `supabase--delete_edge_functions` for the standalone version. Leave OAuth (`gmail-oauth`, `outlook-oauth`, `google-calendar-oauth`), webhooks (`whatsapp-webhook`, `webhook-receiver`, `chrome-extension-*`), and long-running sync jobs (`sync-*`, `process-bulk-*`, `process-enrichment-queue`) as standalone — they have special `verify_jwt`/timeout needs.

Deliverable: 109 → ~50 standalone; ROUTE_MAP + HoC gateway in sync.

---

### Batch 4 — Release v4.0.0

1. Bump `APP_VERSION` to `4.0.0`, add `3.9.56` to `FORCE_CLEAR_VERSIONS`.
2. Update `docs/QUICK_REFERENCE_CARD.md` + HoC Integration page workflow registry.
3. Add audit-record migration to `error_logs`/audit table.

---

### Technical notes

- All DB changes via `supabase--migration`; no direct edits to `supabase/migrations/*`.
- Codemod will be added under `scripts/` and run locally — not committed as a build step.
- Each deleted edge function gets called via `supabase--delete_edge_functions`.
- Router migration pattern follows existing `voice-router` / `utility-router` shape (each route is a `createXHandler(type, prompt)` factory).
- Will check `cloud_status` before each migration batch.

---

**Recommended start:** Batch 1 (DB security). Reply with "go batch 1" to proceed, or pick a different starting batch.
