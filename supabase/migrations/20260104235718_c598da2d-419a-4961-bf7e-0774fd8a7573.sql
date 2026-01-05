-- Create oauth_tokens table for secure token storage
CREATE TABLE public.oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scopes text[],
  account_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, account_email)
);

-- Create email_threads table
CREATE TABLE public.email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id text,
  subject text,
  last_message_at timestamptz,
  message_count integer DEFAULT 1,
  is_read boolean DEFAULT true,
  folder text DEFAULT 'inbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Create email_messages table
CREATE TABLE public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid REFERENCES public.email_threads(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  sender_email text NOT NULL,
  sender_name text,
  recipients text[],
  cc_recipients text[],
  subject text,
  body_preview text,
  body_html text,
  sent_at timestamptz NOT NULL,
  received_at timestamptz,
  is_from_contact boolean DEFAULT false,
  has_attachments boolean DEFAULT false,
  importance text DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, external_id)
);

-- Create outlook_config table for user-specific Azure AD credentials
CREATE TABLE public.outlook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  client_id text NOT NULL,
  tenant_id text NOT NULL,
  redirect_uri text,
  sync_enabled boolean DEFAULT true,
  sync_days_back integer DEFAULT 90,
  last_sync_at timestamptz,
  last_delta_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlook_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for oauth_tokens
CREATE POLICY "Users can view their own oauth tokens"
  ON public.oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth tokens"
  ON public.oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth tokens"
  ON public.oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth tokens"
  ON public.oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for email_threads
CREATE POLICY "Users can view their own email threads"
  ON public.email_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email threads"
  ON public.email_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email threads"
  ON public.email_threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email threads"
  ON public.email_threads FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for email_messages
CREATE POLICY "Users can view their own email messages"
  ON public.email_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email messages"
  ON public.email_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email messages"
  ON public.email_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email messages"
  ON public.email_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for outlook_config
CREATE POLICY "Users can view their own outlook config"
  ON public.outlook_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outlook config"
  ON public.outlook_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outlook config"
  ON public.outlook_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outlook config"
  ON public.outlook_config FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_email_threads_user_id ON public.email_threads(user_id);
CREATE INDEX idx_email_threads_profile_id ON public.email_threads(profile_id);
CREATE INDEX idx_email_threads_last_message ON public.email_threads(last_message_at DESC);
CREATE INDEX idx_email_messages_thread_id ON public.email_messages(thread_id);
CREATE INDEX idx_email_messages_sender ON public.email_messages(sender_email);
CREATE INDEX idx_email_messages_sent_at ON public.email_messages(sent_at DESC);

-- Add updated_at trigger for email_threads
CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON public.email_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for outlook_config
CREATE TRIGGER update_outlook_config_updated_at
  BEFORE UPDATE ON public.outlook_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();