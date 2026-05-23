-- Phase 7: persistence for breach-monitor + image-geolocate functions.

BEGIN;

-- ---------------------------------------------------------------------------
-- breach_exposures: every hit returned by HIBP/Dehashed for the user.
-- (user_id, profile_id, source, breach_name) is the de-dup key, so the same
-- breach against the same email surfaced twice doesn't create duplicates.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.breach_exposures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  query         TEXT NOT NULL,
  source        TEXT NOT NULL CHECK (source IN ('hibp', 'dehashed')),
  breach_name   TEXT NOT NULL,
  breach_date   DATE,
  added_date    DATE,
  data_classes  TEXT[] NOT NULL DEFAULT '{}',
  description   TEXT,
  raw           JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, profile_id, source, breach_name)
);

CREATE INDEX IF NOT EXISTS breach_exposures_user_idx
  ON public.breach_exposures (user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS breach_exposures_profile_idx
  ON public.breach_exposures (profile_id, last_seen_at DESC);

ALTER TABLE public.breach_exposures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own breach exposures"
  ON public.breach_exposures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own breach exposures"
  ON public.breach_exposures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- image_geolocations: GeoGuessr-style inferred coordinates for an image.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.image_geolocations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  media_id     UUID REFERENCES public.media(id) ON DELETE SET NULL,
  source       TEXT NOT NULL CHECK (source IN ('exif', 'vision_model')),
  label        TEXT,
  country      TEXT,
  city         TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  confidence   REAL,
  reasoning    TEXT,
  alternatives JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS image_geolocations_media_idx
  ON public.image_geolocations (media_id);

CREATE INDEX IF NOT EXISTS image_geolocations_profile_idx
  ON public.image_geolocations (profile_id, created_at DESC);

ALTER TABLE public.image_geolocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own image geolocations"
  ON public.image_geolocations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own image geolocations"
  ON public.image_geolocations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
