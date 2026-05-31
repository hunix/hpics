## Plan: WhatsApp Bridge + Continuous Ingestion rollout

Run the two SQL migrations, deploy the six new edge functions, and add the one missing secret. I'll patch a few gaps in your SQL before running it so the tables are actually reachable from the app.

### Required fixes to your SQL (before running)

Per project rules, every new public-schema table needs explicit `GRANT`s (RLS alone isn't enough — PostgREST returns permission errors). Your SQL is also missing some policies and `WITH CHECK` clauses. I'll add the following to each migration in the same transaction:

**Migration 1 (WhatsApp Bridge)**
- `whatsapp_bridge_sessions`, `whatsapp_personal_messages`, `whatsapp_personal_contacts`: bridge-managed (service role only). Add `GRANT ALL ... TO service_role` only — no anon/authenticated grants, no policies (RLS stays on, locked down by default).
- `whatsapp_personal_config`: add `GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated` + `GRANT ALL TO service_role`. Split your single policy into explicit SELECT/INSERT/UPDATE/DELETE policies scoped to `auth.uid() = user_id` with proper `WITH CHECK`.

**Migration 2 (Continuous Ingestion)** — for every new table (`instagram_profile`, `instagram_connections`, `instagram_messages`, `instagram_activity`, `linkedin_profile`, `linkedin_connections`, `linkedin_messages`, `linkedin_positions`, `linkedin_education`, `linkedin_skills`, `sms_messages`, `source_health_log`):
- Add `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;`
- Add `GRANT ALL ON public.<table> TO service_role;`
- Expand each `USING (auth.uid() = user_id)` policy to also cover INSERT/UPDATE/DELETE with matching `WITH CHECK` (your current `CREATE POLICY ... USING (...)` defaults to ALL but lacks WITH CHECK, so inserts/updates would fail).

No structural changes to columns, indexes, or constraints — only grants and policy completeness.

### Steps

1. **Migration 1** — run your WhatsApp Bridge SQL with the grants/policies added above.
2. **Migration 2** — run your Continuous Ingestion SQL with the grants/policies added above.
3. **Add secret** `GOOGLE_CLOUD_PROJECT_ID` via the secrets tool (prompts you for the value).
4. **Deploy edge functions**: `setup-gmail-push`, `gmail-push-handler`, `renew-webhook-subscriptions`, `import-instagram-export`, `import-linkedin-export`, `import-sms-backup`.
5. **Verify**: run the Supabase linter, confirm no new RLS-disabled or permission warnings, and confirm the 6 functions deploy cleanly.

### Notes / open items

- `gmail-push-handler` is a public Pub/Sub endpoint. It already lives in `supabase/functions/` and the existing code returns 200 on all paths. I'll leave `verify_jwt` at the project default unless deploy fails — flag if you want it explicitly set to `false` in `config.toml`.
- `whatsapp_bridge_sessions/messages/contacts` are only written by the bridge service (using the service role key), so I'm intentionally not granting `authenticated` access. If the frontend needs to read messages directly, tell me and I'll add scoped policies joining through `whatsapp_personal_config.user_id`.
- I'll create one combined migration file per logical migration (not one per table) so they run atomically.