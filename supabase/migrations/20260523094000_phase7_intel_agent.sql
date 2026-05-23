-- Phase 7: persistence for the intel-agent ReAct loop.

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  goal         TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  final_answer TEXT,
  step_count   INTEGER NOT NULL DEFAULT 0,
  model        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_runs_user_created_idx
  ON public.agent_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_run_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  step_index  INTEGER NOT NULL,
  thinking    TEXT,
  tool        TEXT,
  args        JSONB,
  observation JSONB,
  is_final    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_index)
);

CREATE INDEX IF NOT EXISTS agent_run_steps_run_idx
  ON public.agent_run_steps (run_id, step_index);

ALTER TABLE public.agent_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_steps  ENABLE ROW LEVEL SECURITY;

-- agent_runs: owner read-only via API; writes happen from the edge function
-- under service_role (which bypasses RLS by default).
CREATE POLICY "Users read own agent runs"
  ON public.agent_runs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- agent_run_steps: visible to the owner of the parent run.
CREATE POLICY "Users read own agent run steps"
  ON public.agent_run_steps FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.agent_runs r
    WHERE r.id = agent_run_steps.run_id
      AND r.user_id = auth.uid()
  ));

COMMIT;
