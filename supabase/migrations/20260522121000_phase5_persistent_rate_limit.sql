-- Persistent rate limiter for edge functions.
-- The previous in-memory map in _shared/rate-limiter.ts reset on every cold
-- start, which made it ineffective. This migration backs the limiter with a
-- single-row-per-key table and an atomic increment function.

BEGIN;

CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  key              TEXT        PRIMARY KEY,
  window_start_ms  BIGINT      NOT NULL,
  count            INTEGER     NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- No policies = service_role only (which bypasses RLS). The table must not be
-- readable or writable by authenticated end users.

-- Atomic increment-or-reset. Returns the post-increment state plus whether
-- the caller is over the configured limit.
CREATE OR REPLACE FUNCTION public.rl_increment(
  p_key       TEXT,
  p_now_ms    BIGINT,
  p_window_ms INTEGER,
  p_max       INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_in_ms INTEGER)
AS $$
DECLARE
  v_row public.rate_limit_counters%ROWTYPE;
BEGIN
  INSERT INTO public.rate_limit_counters AS r (key, window_start_ms, count)
  VALUES (p_key, p_now_ms, 1)
  ON CONFLICT (key) DO UPDATE
    SET window_start_ms = CASE
          WHEN r.window_start_ms + p_window_ms <= p_now_ms THEN p_now_ms
          ELSE r.window_start_ms
        END,
        count = CASE
          WHEN r.window_start_ms + p_window_ms <= p_now_ms THEN 1
          ELSE r.count + 1
        END,
        updated_at = now()
  RETURNING * INTO v_row;

  allowed     := v_row.count <= p_max;
  remaining   := GREATEST(0, p_max - v_row.count);
  reset_in_ms := p_window_ms - (p_now_ms - v_row.window_start_ms);
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.rl_increment(TEXT, BIGINT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rl_increment(TEXT, BIGINT, INTEGER, INTEGER) TO service_role;

-- Janitor: remove entries that haven't been touched in 24h. Cheap to run on a
-- schedule; called opportunistically from the edge function as well.
CREATE OR REPLACE FUNCTION public.rl_cleanup()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.rate_limit_counters
  WHERE updated_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.rl_cleanup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rl_cleanup() TO service_role;

COMMIT;
