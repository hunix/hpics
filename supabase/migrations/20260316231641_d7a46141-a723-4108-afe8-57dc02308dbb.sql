CREATE TABLE public.hpics_api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  api_key_hash text NOT NULL,
  key_prefix text NOT NULL,
  permissions text[] DEFAULT '{}',
  rate_limit_rpm int DEFAULT 60,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  total_requests bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.hpics_api_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tool_called text,
  status_code int,
  response_time_ms int,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_usage_logs_client_id ON public.api_usage_logs(client_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX idx_hpics_api_clients_user_id ON public.hpics_api_clients(user_id);
CREATE INDEX idx_hpics_api_clients_key_hash ON public.hpics_api_clients(api_key_hash);

ALTER PUBLICATION supabase_realtime ADD TABLE public.api_usage_logs;

ALTER TABLE public.hpics_api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own API clients"
  ON public.hpics_api_clients FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own usage logs"
  ON public.api_usage_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert usage logs"
  ON public.api_usage_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());