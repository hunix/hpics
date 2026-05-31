-- WhatsApp Personal Bridge tables
-- Stores auth state, messages, and contacts for the Baileys-based personal
-- WhatsApp bridge running at services/whatsapp-bridge/.

BEGIN;

-- ---- Sessions (Baileys auth state) ----------------------------------------
-- Each row holds the full serialised credential + Signal key store for one
-- Baileys session.  The service upserts this on every creds.update event.

CREATE TABLE IF NOT EXISTS public.whatsapp_bridge_sessions (
  session_id   TEXT        PRIMARY KEY,
  creds        JSONB       NOT NULL DEFAULT '{}'::JSONB,
  keys         JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service-role-only access; no public or anon access.
ALTER TABLE public.whatsapp_bridge_sessions ENABLE ROW LEVEL SECURITY;

-- Only the service role (bypasses RLS) should read/write sessions.
-- No policies needed — deny-all for authenticated/anon.

COMMENT ON TABLE public.whatsapp_bridge_sessions IS
  'Persisted Baileys auth state (creds + Signal keys) for each WA bridge session.';

-- ---- Messages --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.whatsapp_personal_messages (
  id             TEXT        NOT NULL,
  session_id     TEXT        NOT NULL REFERENCES public.whatsapp_bridge_sessions(session_id) ON DELETE CASCADE,
  chat_jid       TEXT        NOT NULL,
  chat_name      TEXT,
  sender_jid     TEXT,
  sender_name    TEXT,
  sender_phone   TEXT,
  message_type   TEXT        NOT NULL DEFAULT 'other'
                   CHECK (message_type IN ('text','image','video','audio','doc','sticker','reaction','other')),
  body           TEXT,
  media_url      TEXT,
  timestamp_ms   BIGINT      NOT NULL,
  is_from_me     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_group       BOOLEAN     NOT NULL DEFAULT FALSE,
  raw_payload    JSONB       NOT NULL DEFAULT '{}'::JSONB,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_wpm_chat_jid        ON public.whatsapp_personal_messages(chat_jid);
CREATE INDEX IF NOT EXISTS idx_wpm_session_ts      ON public.whatsapp_personal_messages(session_id, timestamp_ms DESC);
CREATE INDEX IF NOT EXISTS idx_wpm_sender_jid      ON public.whatsapp_personal_messages(sender_jid);
CREATE INDEX IF NOT EXISTS idx_wpm_timestamp       ON public.whatsapp_personal_messages(timestamp_ms DESC);
CREATE INDEX IF NOT EXISTS idx_wpm_message_type    ON public.whatsapp_personal_messages(message_type);

ALTER TABLE public.whatsapp_personal_messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.whatsapp_personal_messages IS
  'All personal WhatsApp messages bridged via Baileys.';

-- ---- Contacts --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.whatsapp_personal_contacts (
  jid               TEXT        NOT NULL,
  session_id        TEXT        NOT NULL REFERENCES public.whatsapp_bridge_sessions(session_id) ON DELETE CASCADE,
  name              TEXT,
  phone_number      TEXT,
  is_business       BOOLEAN     NOT NULL DEFAULT FALSE,
  profile_photo_url TEXT,
  last_seen_at      TIMESTAMPTZ,
  status_text       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (jid, session_id)
);

CREATE INDEX IF NOT EXISTS idx_wpc_phone     ON public.whatsapp_personal_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_wpc_name      ON public.whatsapp_personal_contacts(name);
CREATE INDEX IF NOT EXISTS idx_wpc_session   ON public.whatsapp_personal_contacts(session_id);

ALTER TABLE public.whatsapp_personal_contacts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.whatsapp_personal_contacts IS
  'WhatsApp contacts synced by the personal bridge.';

-- ---- updated_at trigger for contacts --------------------------------------

CREATE OR REPLACE FUNCTION public.whatsapp_personal_contacts_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wpc_updated_at ON public.whatsapp_personal_contacts;
CREATE TRIGGER trg_wpc_updated_at
  BEFORE UPDATE ON public.whatsapp_personal_contacts
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_personal_contacts_set_updated_at();

-- ---- updated_at trigger for sessions --------------------------------------

CREATE OR REPLACE FUNCTION public.whatsapp_bridge_sessions_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wbs_updated_at ON public.whatsapp_bridge_sessions;
CREATE TRIGGER trg_wbs_updated_at
  BEFORE UPDATE ON public.whatsapp_bridge_sessions
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_bridge_sessions_set_updated_at();

COMMIT;
