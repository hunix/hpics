-- Phase 9: extend socmint sources with Bluesky, YouTube, RSS feeds.

BEGIN;

-- Expand the source allow-list on socmint_mentions.
ALTER TABLE public.socmint_mentions
  DROP CONSTRAINT IF EXISTS socmint_mentions_source_check;

ALTER TABLE public.socmint_mentions
  ADD CONSTRAINT socmint_mentions_source_check
  CHECK (source IN ('reddit', 'github', 'mastodon', 'bluesky', 'youtube', 'rss'));

-- Per-user RSS feed list. The socmint-search RSS adapter reads from this and
-- scans each feed for matches against the query.
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  label        TEXT,
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  last_polled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);

CREATE INDEX IF NOT EXISTS rss_feeds_user_idx
  ON public.rss_feeds (user_id)
  WHERE enabled = TRUE;

ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rss feeds"
  ON public.rss_feeds
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
