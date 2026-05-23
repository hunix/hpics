# Security model

Short reference for what hpics encrypts, what it doesn't, and why.

## Data at rest

| Data class | Protection | Notes |
|---|---|---|
| Database rows (Postgres) | AES-256 at the storage layer | Supabase / AWS RDS default |
| Storage bucket objects | Server-side encryption | Supabase default; private buckets enforce RLS |
| **Biometric embeddings** (`facial_embedding vector(512)`, `voice_embedding vector(256)`) | One-way projection. **Not column-encrypted.** | Re-identification possible against the same gallery, but the raw face/voice cannot be reconstructed from the embedding. Column-level encryption would defeat cosine-similarity search. |
| Raw biometric source bytes (image / audio file referenced by `biometric_samples.source_url`) | Storage RLS. Must live in a private bucket. | If you upload to a public bucket the embedding-only argument no longer holds. Verify bucket ACL when adding new modalities. |
| Auth tokens (Supabase JWT) | Issued/rotated by Supabase Auth | The frontend stores JWT in localStorage. Acceptable for a single-user CRM; revisit if you ever introduce multi-tenant access. |
| OAuth refresh tokens (Gmail/Outlook/Google Calendar) | Encrypted with `pgcrypto` in the integration table | Encryption key supplied via Supabase function env, not committed |

## RLS posture

- Every user-scoped table has RLS enabled and a policy keyed on `auth.uid() = user_id`.
- `immutable_audit_logs` is **service-role-only writeable** (Phase 1 hardening removed the authenticated INSERT escape hatch).
- `SECURITY DEFINER` functions that mutate or read user-scoped data check `auth.uid() = p_user_id` at entry. Phase 1 + Phase 7 migrations guard the known mutating ones (`relink_email_threads_to_profiles`, `batch_merge_duplicates`, `create_storage_snapshot`, `cleanup_stale_bulk_items`, `get_account_storage_summary`). Any new `SECURITY DEFINER` function that takes `p_user_id` must add the same guard.

## Edge function posture

- `verify_jwt = true` is the default; only `gmail-oauth`, `google-calendar-oauth`, `outlook-oauth`, `whatsapp-webhook` are public (OAuth callbacks + Meta webhook).
- Webhook handlers must validate signatures and **fail closed** if the secret is unset.
- CORS origin is read from `CORS_ALLOWED_ORIGIN`; the wildcard fallback exists only so unconfigured local dev still works. Production deployments must set this env var.

## Browser-side posture

- CSP is set via `<meta http-equiv="Content-Security-Policy">` in `index.html`. `connect-src` lists exactly the origins the client makes direct requests to (Supabase, OAuth providers, Tavily/Perplexity if called client-side).
- `frame-ancestors 'none'` prevents clickjacking.
- Service worker caches static assets only — no auth-bearing API responses.

## What is explicitly NOT protected

- Internal threat model. A user with valid credentials sees everything they own. This is single-user OSINT — there is no "least privilege within the account."
- Anti-forensics on the Postgres host itself. Disk-level encryption is whatever the cloud provider gives you.
- Network metadata. Connections to Supabase are TLS, but the existence of the connection is visible.
