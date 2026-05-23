import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Play, Clock, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import {
  useLaunchAgent,
  useAgentRun,
  useAgentRunSteps,
  useAgentRunRealtime,
  useAgentRuns,
  useActiveRunId,
  type AgentRunStep,
} from '@/hooks/intelligence/useIntelAgent';

function StepCard({ step }: { step: AgentRunStep }) {
  const observationStr = step.observation
    ? JSON.stringify(step.observation, null, 2).slice(0, 4000)
    : null;
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="font-mono">#{step.step_index}</Badge>
        {step.tool ? (
          <>
            <Wrench className="h-3 w-3 text-amber-500" />
            <span className="font-medium">{step.tool}</span>
          </>
        ) : step.is_final ? (
          <>
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span className="font-medium">final</span>
          </>
        ) : (
          <span className="font-medium text-muted-foreground">thinking</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(step.created_at).toLocaleTimeString()}
        </span>
      </div>
      {step.thinking && (
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{step.thinking}</p>
      )}
      {step.args && Object.keys(step.args).length > 0 && (
        <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(step.args, null, 2)}</pre>
      )}
      {observationStr && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer">observation</summary>
          <pre className="text-xs bg-muted rounded p-2 overflow-x-auto mt-2">{observationStr}</pre>
        </details>
      )}
    </div>
  );
}

export default function IntelAgent() {
  const [goal, setGoal] = useState('');
  const [profileId, setProfileId] = useState('');
  const [maxSteps, setMaxSteps] = useState(10);
  const { runId, setRunId } = useActiveRunId();
  const launch = useLaunchAgent();
  const { data: run } = useAgentRun(runId);
  const { data: steps } = useAgentRunSteps(runId);
  const { data: recent } = useAgentRuns(10);
  useAgentRunRealtime(runId);

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    const result = await launch.mutateAsync({
      goal: goal.trim(),
      profileId: profileId.trim() || undefined,
      maxSteps,
    });
    setRunId(result.runId);
  };

  const statusBadge = run && (
    <Badge variant={run.status === 'running' ? 'default' : run.status === 'completed' ? 'secondary' : 'destructive'}>
      {run.status}
    </Badge>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Intel Agent</h1>
          <p className="text-sm text-muted-foreground">
            Agentic OSINT investigator. Sets a goal, picks tools, iterates, produces an answer.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launch an investigation</CardTitle>
          <CardDescription>
            The agent plans a sequence of tool calls (enrich, search, news, network analysis, biometric match,
            dossier) and reasons over the observations until it can answer the goal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. 'Find recent professional moves and public mentions for this contact and produce a one-paragraph briefing.'"
            rows={3}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="Optional profile id (UUID)"
            />
            <Input
              type="number"
              min={1}
              max={25}
              value={maxSteps}
              onChange={(e) => setMaxSteps(Number(e.target.value) || 10)}
              placeholder="Max steps (default 10)"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!goal.trim() || launch.isPending} className="gap-2">
            <Play className="h-4 w-4" />
            {launch.isPending ? 'Launching…' : 'Run agent'}
          </Button>
        </CardContent>
      </Card>

      {run && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Run {run.id.slice(0, 8)}…</CardTitle>
              {statusBadge}
              <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {run.step_count} steps
              </span>
            </div>
            <CardDescription className="font-mono text-xs">{run.goal}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-3">
                {(steps ?? []).map((s) => <StepCard key={s.id} step={s} />)}
                {(!steps || steps.length === 0) && (
                  <p className="text-sm text-muted-foreground">Waiting for the first step…</p>
                )}
              </div>
            </ScrollArea>
            {run.final_answer && (
              <div className="mt-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Final answer
                </h3>
                <p className="text-sm whitespace-pre-wrap">{run.final_answer}</p>
              </div>
            )}
            {run.status === 'failed' && (
              <div className="mt-4 rounded-lg border bg-red-50 dark:bg-red-950/30 p-4">
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Failed
                </h3>
                <p className="text-sm">{run.final_answer ?? 'unknown error'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {recent && recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRunId(r.id)}
                  className="w-full text-left p-2 rounded hover:bg-muted flex items-center gap-2"
                >
                  <Badge variant={r.status === 'running' ? 'default' : r.status === 'completed' ? 'secondary' : 'destructive'}>
                    {r.status}
                  </Badge>
                  <span className="text-sm truncate flex-1">{r.goal}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
