BEGIN;

-- Bridge sessions (service-only)
CREATE TABLE IF NOT EXISTS public.whatsapp_bridge_sessions (
  session_id   TEXT        PRIMARY KEY,
  creds        JSONB       NOT NULL DEFAULT '{}'::JSONB,
  keys         JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_bridge_sessions TO service_role;
ALTER TABLE public.whatsapp_bridge_sessions ENABLE ROW LEVEL SECURITY;

-- Personal messages (service-only)
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
CREATE INDEX IF NOT EXISTS idx_wpm_chat_jid     ON public.whatsapp_personal_messages(chat_jid);
CREATE INDEX IF NOT EXISTS idx_wpm_session_ts   ON public.whatsapp_personal_messages(session_id, timestamp_ms DESC);
CREATE INDEX IF NOT EXISTS idx_wpm_sender_jid   ON public.whatsapp_personal_messages(sender_jid);
CREATE INDEX IF NOT EXISTS idx_wpm_timestamp    ON public.whatsapp_personal_messages(timestamp_ms DESC);
GRANT ALL ON public.whatsapp_personal_messages TO service_role;
ALTER TABLE public.whatsapp_personal_messages ENABLE ROW LEVEL SECURITY;

-- Personal contacts (service-only)
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
CREATE INDEX IF NOT EXISTS idx_wpc_phone   ON public.whatsapp_personal_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_wpc_name    ON public.whatsapp_personal_contacts(name);
GRANT ALL ON public.whatsapp_personal_contacts TO service_role;
ALTER TABLE public.whatsapp_personal_contacts ENABLE ROW LEVEL SECURITY;

-- Personal config (user-owned)
CREATE TABLE IF NOT EXISTS public.whatsapp_personal_config (
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  bridge_url    TEXT        NOT NULL DEFAULT 'http://localhost:3001',
  bridge_secret TEXT,
  status        TEXT        NOT NULL DEFAULT 'disconnected'
                  CHECK (status IN ('disconnected','waiting_qr','connected')),
  linked_phone  TEXT,
  message_count BIGINT      NOT NULL DEFAULT 0,
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_personal_config TO authenticated;
GRANT ALL ON public.whatsapp_personal_config TO service_role;
ALTER TABLE public.whatsapp_personal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY wpc_select ON public.whatsapp_personal_config
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY wpc_insert ON public.whatsapp_personal_config
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wpc_update ON public.whatsapp_personal_config
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY wpc_delete ON public.whatsapp_personal_config
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at_wpc()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_wpc_upd ON public.whatsapp_personal_config;
CREATE TRIGGER trg_wpc_upd BEFORE UPDATE ON public.whatsapp_personal_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_wpc();

COMMIT;