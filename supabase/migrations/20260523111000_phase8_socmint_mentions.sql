-- Phase 8: persistence for socmint-search hits (Reddit/GitHub/Mastodon).

BEGIN;

CREATE TABLE IF NOT EXISTS public.socmint_mentions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  query        TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('reddit', 'github', 'mastodon')),
  external_id  TEXT NOT NULL,
  title        TEXT,
  body         TEXT,
  url          TEXT,
  author       TEXT,
  posted_at    TIMESTAMPTZ,
  raw          JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS socmint_mentions_user_posted_idx
  ON public.socmint_mentions (user_id, posted_at DESC);

CREATE INDEX IF NOT EXISTS socmint_mentions_profile_idx
  ON public.socmint_mentions (profile_id, last_seen_at DESC);

ALTER TABLE public.socmint_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own socmint mentions" ON public.socmint_mentions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own socmint mentions" ON public.socmint_mentions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMIT;
