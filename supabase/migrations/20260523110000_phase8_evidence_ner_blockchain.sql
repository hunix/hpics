-- Phase 8: persistence for evidence-capture, multilingual-ner, blockchain-lookup.
-- (Note: NER is stateless by default; we create an optional cache table for
-- callers that want to memoize entity extraction per source document.)

BEGIN;

-- ---------------------------------------------------------------------------
-- evidence_captures: chain-of-custody record for one preserved web page.
-- The HTML and screenshot bytes live in storage; only metadata is here.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_captures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  case_id               UUID,
  note                  TEXT,
  source_url            TEXT NOT NULL,
  final_url             TEXT NOT NULL,
  http_status           INTEGER,
  response_headers      JSONB,
  html_path             TEXT,
  html_sha256           TEXT,
  html_bytes            INTEGER,
  screenshot_path       TEXT,
  screenshot_sha256     TEXT,
  capture_started_at    TIMESTAMPTZ NOT NULL,
  capture_completed_at  TIMESTAMPTZ NOT NULL,
  operator_user_agent   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evidence_captures_user_idx
  ON public.evidence_captures (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS evidence_captures_profile_idx
  ON public.evidence_captures (profile_id, created_at DESC);

ALTER TABLE public.evidence_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own evidence" ON public.evidence_captures
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Evidence is meant to be append-only: no UPDATE policy, only DELETE for
-- explicit retraction.
CREATE POLICY "Users delete own evidence" ON public.evidence_captures
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for evidence blobs. Private; reads via signed URLs only.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Owner can read/write their own folder within the bucket.
DROP POLICY IF EXISTS "Users access own evidence files" ON storage.objects;
CREATE POLICY "Users access own evidence files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ---------------------------------------------------------------------------
-- ner_cache: optional memoization keyed on SHA-256 of input text.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ner_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_sha256  TEXT NOT NULL,
  source       TEXT NOT NULL,
  model        TEXT NOT NULL,
  language     TEXT,
  entities     JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, text_sha256, model)
);
ALTER TABLE public.ner_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ner cache" ON public.ner_cache
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- blockchain_addresses + blockchain_activity
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blockchain_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  chain       TEXT NOT NULL CHECK (chain IN ('eth', 'btc')),
  address     TEXT NOT NULL,
  label       TEXT,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload     JSONB,
  UNIQUE (user_id, chain, address)
);
CREATE INDEX IF NOT EXISTS blockchain_addresses_user_idx
  ON public.blockchain_addresses (user_id, last_seen DESC);
ALTER TABLE public.blockchain_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bc addresses" ON public.blockchain_addresses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.blockchain_activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain       TEXT NOT NULL CHECK (chain IN ('eth', 'btc')),
  kind        TEXT NOT NULL CHECK (kind IN ('tx', 'transfer')),
  identifier  TEXT NOT NULL,
  payload     JSONB,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chain, kind, identifier)
);
ALTER TABLE public.blockchain_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own bc activity" ON public.blockchain_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

COMMIT;
