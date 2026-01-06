-- Phase 1: Data Import Expansion
-- Tables for Gmail, Google Calendar, and enhanced import tracking

-- Gmail configuration table
CREATE TABLE public.gmail_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'idle',
  contacts_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Google Calendar configuration table
CREATE TABLE public.google_calendar_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'idle',
  events_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Voice notes table for Phase 3
CREATE TABLE public.voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255),
  file_url TEXT NOT NULL,
  storage_path TEXT,
  duration_seconds INTEGER,
  file_size INTEGER,
  transcription TEXT,
  transcription_status VARCHAR(50) DEFAULT 'pending',
  transcription_error TEXT,
  ai_extracted_insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reports schedule table for Phase 4
CREATE TABLE public.reports_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  config JSONB DEFAULT '{}'::jsonb,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  next_scheduled_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated reports table
CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID REFERENCES public.reports_schedule(id) ON DELETE SET NULL,
  report_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  file_size INTEGER,
  format VARCHAR(20) DEFAULT 'pdf',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhooks table for Phase 5
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255),
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status INTEGER,
  failure_count INTEGER DEFAULT 0,
  headers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspaces table for Phase 6
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace members
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(workspace_id, user_id)
);

-- Add workspace_id to profiles for shared contacts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Import sessions tracking
CREATE TABLE public.import_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  imported_items INTEGER DEFAULT 0,
  skipped_items INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.gmail_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gmail_config
CREATE POLICY "Users can view own gmail config" ON public.gmail_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gmail config" ON public.gmail_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gmail config" ON public.gmail_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gmail config" ON public.gmail_config FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for google_calendar_config
CREATE POLICY "Users can view own google calendar config" ON public.google_calendar_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own google calendar config" ON public.google_calendar_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own google calendar config" ON public.google_calendar_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own google calendar config" ON public.google_calendar_config FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for voice_notes
CREATE POLICY "Users can view own voice notes" ON public.voice_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice notes" ON public.voice_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice notes" ON public.voice_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice notes" ON public.voice_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reports_schedule
CREATE POLICY "Users can view own reports schedule" ON public.reports_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports schedule" ON public.reports_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports schedule" ON public.reports_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports schedule" ON public.reports_schedule FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_reports
CREATE POLICY "Users can view own generated reports" ON public.generated_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated reports" ON public.generated_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated reports" ON public.generated_reports FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for webhooks
CREATE POLICY "Users can view own webhooks" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webhooks" ON public.webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhooks" ON public.webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhooks" ON public.webhooks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for webhook_logs
CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND w.user_id = auth.uid()));

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they own or are members of" ON public.workspaces FOR SELECT 
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = id AND wm.user_id = auth.uid()));
CREATE POLICY "Users can insert own workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete workspaces" ON public.workspaces FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm2 WHERE wm2.workspace_id = workspace_id AND wm2.user_id = auth.uid()))));
CREATE POLICY "Owners and admins can insert workspace members" ON public.workspace_members FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));
CREATE POLICY "Owners and admins can update workspace members" ON public.workspace_members FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));
CREATE POLICY "Owners and admins can delete workspace members" ON public.workspace_members FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));

-- RLS Policies for import_sessions
CREATE POLICY "Users can view own import sessions" ON public.import_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own import sessions" ON public.import_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own import sessions" ON public.import_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own import sessions" ON public.import_sessions FOR DELETE USING (auth.uid() = user_id);

-- Update triggers for updated_at columns
CREATE TRIGGER update_gmail_config_updated_at BEFORE UPDATE ON public.gmail_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_google_calendar_config_updated_at BEFORE UPDATE ON public.google_calendar_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_notes_updated_at BEFORE UPDATE ON public.voice_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_schedule_updated_at BEFORE UPDATE ON public.reports_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_gmail_config_user_id ON public.gmail_config(user_id);
CREATE INDEX idx_google_calendar_config_user_id ON public.google_calendar_config(user_id);
CREATE INDEX idx_voice_notes_user_id ON public.voice_notes(user_id);
CREATE INDEX idx_voice_notes_profile_id ON public.voice_notes(profile_id);
CREATE INDEX idx_reports_schedule_user_id ON public.reports_schedule(user_id);
CREATE INDEX idx_generated_reports_user_id ON public.generated_reports(user_id);
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_profiles_workspace_id ON public.profiles(workspace_id);
CREATE INDEX idx_import_sessions_user_id ON public.import_sessions(user_id);