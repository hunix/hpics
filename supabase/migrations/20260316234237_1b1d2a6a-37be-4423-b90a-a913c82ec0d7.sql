
-- Agent workflow runs table for tracking multi-step autonomous operations
CREATE TABLE public.agent_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  workflow_command text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workflow runs"
  ON public.agent_workflow_runs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_agent_workflow_runs_user ON public.agent_workflow_runs(user_id);
CREATE INDEX idx_agent_workflow_runs_profile ON public.agent_workflow_runs(profile_id);
CREATE INDEX idx_agent_workflow_runs_status ON public.agent_workflow_runs(status);
