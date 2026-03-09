import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bot, Brain, Cpu, Swords, FlaskConical, Microscope,
  Play, Zap, ChevronRight, Clock, Target, AlertTriangle,
  Activity, BarChart3, Shield, TrendingUp, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useAgentConsole,
  useAgentSession,
  type AgentTurn,
  type AgentRole,
  type SessionMode,
} from "@/hooks/intelligence/useAgentOrchestrator";
import { useContacts } from "@/hooks/useContacts";

// ─────────────────────────────────────── Agent Metadata ──────────────────────

const AGENT_META: Record<AgentRole, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  researcher: { icon: Microscope, color: "text-blue-400", label: "Research Agent" },
  analyst: { icon: BarChart3, color: "text-violet-400", label: "Analyst Agent" },
  strategist: { icon: Target, color: "text-amber-400", label: "Strategist Agent" },
  critic: { icon: Swords, color: "text-red-400", label: "Critic Agent" },
  synthesizer: { icon: Brain, color: "text-emerald-400", label: "Synthesizer Agent" },
};

// ─────────────────────────────────────── Agent Turn Card ─────────────────────

function AgentTurnCard({ turn, index }: { turn: AgentTurn; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[turn.agent_role];
  const Icon = meta.icon;

  return (
    <div className="relative pl-8">
      {/* Timeline connector */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-700/50" />
      <div className={cn("absolute left-1.5 top-3 w-3 h-3 rounded-full border-2 border-current", meta.color)} />

      <div className="mb-4 rounded-xl bg-slate-800/40 border border-slate-700/40 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/20 transition-colors"
        >
          <Icon className={cn("w-4 h-4 flex-shrink-0", meta.color)} />
          <span className={cn("font-medium text-sm", meta.color)}>{meta.label}</span>
          <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600 ml-auto">
            {turn.model.split("/").pop()}
          </Badge>
          <span className="text-[10px] text-slate-500">{turn.duration_ms}ms</span>
          <span className="text-[10px] text-slate-500">{turn.tokens}tok</span>
          <ChevronRight className={cn("w-3.5 h-3.5 text-slate-500 transition-transform", expanded && "rotate-90")} />
        </button>

        {expanded && (
          <div className="p-3 pt-0 border-t border-slate-700/40">
            <ScrollArea className="h-48">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(turn.output, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Session Detail Panel ────────────────

function SessionDetailPanel({ sessionId }: { sessionId: string }) {
  const { data: session } = useAgentSession(sessionId);

  if (!session) return <div className="text-slate-500 text-sm p-4">Loading session…</div>;

  const report = session.final_report ? JSON.parse(session.final_report) : null;

  return (
    <div className="space-y-4">
      {/* Status + metrics */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={cn(
          "text-xs",
          session.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
          session.status === "running" ? "bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse" :
          "bg-red-500/20 text-red-300 border-red-500/30"
        )}>
          {session.status}
        </Badge>
        {session.confidence_score != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Confidence:</span>
            <span className="text-sm font-bold text-white">{Math.round(session.confidence_score)}%</span>
          </div>
        )}
        {session.duration_ms && (
          <span className="text-xs text-slate-500">{(session.duration_ms / 1000).toFixed(1)}s</span>
        )}
        {session.total_tokens && (
          <span className="text-xs text-slate-500">{session.total_tokens.toLocaleString()} tokens</span>
        )}
      </div>

      {/* Final report */}
      {report && (
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            Executive Summary
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {report.executive_summary ?? "Generating…"}
          </p>

          {Array.isArray(report.key_findings) && report.key_findings.length > 0 && (
            <>
              <Separator className="bg-slate-700/50" />
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Key Findings</p>
              <div className="space-y-2">
                {report.key_findings.slice(0, 5).map((f: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="text-violet-400 font-bold mt-0.5">•</span>
                    <div>
                      <span className="text-white">{String(f.finding)}</span>
                      {typeof f.confidence === "number" && (
                        <span className="text-slate-500 ml-1">({Math.round(f.confidence as number)}%)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {Array.isArray(report.uncertainty_flags) && report.uncertainty_flags.length > 0 && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300">{report.uncertainty_flags.join(" · ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Agent turns */}
      {session.agent_turns?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Agent Pipeline</p>
          <div className="relative">
            {session.agent_turns.map((turn, i) => (
              <AgentTurnCard key={i} turn={turn} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────── Main Page ───────────────────────────

export default function AgentConsole() {
  const [searchParams] = useSearchParams();
  const initialProfileId = searchParams.get("contactId") ?? undefined;

  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(initialProfileId);
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<SessionMode>("standard");
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();

  const { data: contacts } = useContacts();
  const {
    sessions, reports, reasoningChains, vulnerabilityWindows,
    isLoading, runPipeline, runDebate, latestReport,
  } = useAgentConsole(selectedProfileId);

  function handleRun() {
    if (!goal.trim() || !selectedProfileId) return;
    if (mode === "debate") {
      runDebate.mutate({ topic: goal, profileId: selectedProfileId });
    } else {
      runPipeline.mutate({ goal, profileId: selectedProfileId, mode });
    }
  }

  const isRunning = runPipeline.isPending || runDebate.isPending;

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0d1421]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-semibold text-white">Agent Console</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">Phase 2</Badge>
          </div>

          <div className="flex-1" />

          {/* Contact selector */}
          <select
            value={selectedProfileId ?? ""}
            onChange={(e) => setSelectedProfileId(e.target.value || undefined)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
          >
            <option value="">Select contact…</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedProfileId ? (
        <div className="flex items-center justify-center h-[60vh] text-slate-500">
          <div className="text-center">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Select a contact to launch the AGIS agent pipeline</p>
            <p className="text-sm mt-1">5 specialized agents: Research → Analyze → Strategize → Critique → Synthesize</p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Launch Panel */}
            <div className="space-y-4">
              {/* Goal input */}
              <Card className="bg-[#0d1421] border-slate-800/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-violet-400" />
                    Intelligence Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="What intelligence do you need? e.g. 'Assess John's financial vulnerabilities and optimal approach timing'"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white resize-none h-28 text-sm"
                  />

                  {/* Mode selector */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["standard", "deep_analysis", "debate"] as SessionMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          mode === m
                            ? "bg-violet-500 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                      >
                        {m === "standard" ? "Standard" : m === "deep_analysis" ? "Deep" : "Debate"}
                      </button>
                    ))}
                  </div>

                  {mode === "debate" && (
                    <div className="px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                      <strong>Debate Mode:</strong> Optimist vs Pessimist agents argue opposing interpretations. Judge produces calibrated verdict.
                    </div>
                  )}

                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white"
                    onClick={handleRun}
                    disabled={!goal.trim() || isRunning}
                  >
                    {isRunning ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Agents thinking…
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Launch {mode === "debate" ? "Debate" : mode === "deep_analysis" ? "Deep Analysis" : "Pipeline"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Agent roster */}
              <Card className="bg-[#0d1421] border-slate-800/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Agent Roster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(Object.entries(AGENT_META) as [AgentRole, typeof AGENT_META[AgentRole]][]).map(([role, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <div key={role} className="flex items-center gap-2.5">
                        <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                        <span className="text-xs text-slate-300">{meta.label}</span>
                      </div>
                    );
                  })}
                  <Separator className="bg-slate-700/50 my-1" />
                  <div className="flex items-center gap-2.5">
                    <Swords className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs text-slate-300">Debate Judge (debate mode)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vulnerability windows */}
              {vulnerabilityWindows.length > 0 && (
                <Card className="bg-[#0d1421] border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-orange-400">
                      <Eye className="w-4 h-4" />
                      Vulnerability Windows ({vulnerabilityWindows.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vulnerabilityWindows.slice(0, 3).map((w) => (
                      <div key={w.id} className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="text-[10px] bg-orange-500/20 text-orange-300 border-orange-500/30">
                            {w.vulnerability_type.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-orange-400 font-mono">
                            {Math.round(w.predicted_intensity)}% intensity
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(w.window_start).toLocaleDateString()} → {new Date(w.window_end).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center + Right: Sessions + Reports */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="sessions">
                <TabsList className="bg-slate-800/60 border border-slate-700/50">
                  <TabsTrigger value="sessions">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />Sessions ({sessions.length})
                  </TabsTrigger>
                  <TabsTrigger value="reports">
                    <Brain className="w-3.5 h-3.5 mr-1.5" />Reports ({reports.length})
                  </TabsTrigger>
                  <TabsTrigger value="reasoning">
                    <FlaskConical className="w-3.5 h-3.5 mr-1.5" />Reasoning ({reasoningChains.length})
                  </TabsTrigger>
                </TabsList>

                {/* Sessions */}
                <TabsContent value="sessions" className="mt-4 space-y-3">
                  {sessions.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                      No agent sessions yet — launch the pipeline above
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSessionId(selectedSessionId === s.id ? undefined : s.id)}
                          className={cn(
                            "text-left p-3 rounded-xl border transition-colors",
                            selectedSessionId === s.id
                              ? "bg-violet-500/10 border-violet-500/40"
                              : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-700/30"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge className={cn(
                              "text-[10px]",
                              s.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                              s.status === "running" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                              "bg-slate-500/20 text-slate-400 border-slate-500/30"
                            )}>
                              {s.session_type}
                            </Badge>
                            {s.confidence_score != null && (
                              <span className="text-[10px] text-emerald-400 ml-auto font-mono">
                                {Math.round(s.confidence_score)}% conf
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white line-clamp-2">{s.goal}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-500">
                              {new Date(s.created_at).toLocaleDateString()}
                            </span>
                            {s.total_tokens && (
                              <span className="text-[10px] text-slate-600">{s.total_tokens.toLocaleString()}tok</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected session detail */}
                  {selectedSessionId && (
                    <Card className="bg-[#0d1421] border-violet-500/20">
                      <CardContent className="pt-4">
                        <SessionDetailPanel sessionId={selectedSessionId} />
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Reports */}
                <TabsContent value="reports" className="mt-4">
                  {reports.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                      No intelligence reports yet
                    </div>
                  ) : (
                    <ScrollArea className="h-[32rem]">
                      <div className="space-y-3 pr-4">
                        {reports.map((r) => (
                          <Card key={r.id} className="bg-[#0d1421] border-slate-800/60">
                            <CardContent className="pt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">
                                  {r.report_type}
                                </Badge>
                                <div className="ml-auto flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] text-emerald-400">{Math.round(r.confidence_score)}%</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(r.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-white">{r.title}</p>
                              {r.executive_summary && (
                                <p className="text-xs text-slate-300 line-clamp-3">{r.executive_summary}</p>
                              )}
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <div className="text-[10px] text-slate-500 mb-1">Confidence</div>
                                  <Progress value={r.confidence_score} className="h-1" />
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 mb-1">Completeness</div>
                                  <Progress value={r.completeness_score} className="h-1" />
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 mb-1">Reasoning</div>
                                  <Progress value={r.reasoning_quality} className="h-1" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Reasoning Chains */}
                <TabsContent value="reasoning" className="mt-4">
                  {reasoningChains.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                      No reasoning chains captured yet
                    </div>
                  ) : (
                    <ScrollArea className="h-[32rem]">
                      <div className="space-y-3 pr-4">
                        {reasoningChains.map((chain) => (
                          <Card key={chain.id} className="bg-[#0d1421] border-slate-800/60">
                            <CardContent className="pt-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">Phase {chain.agis_phase ?? "?"}</Badge>
                                <span className="text-[10px] text-slate-500 ml-auto">
                                  {chain.confidence_score ? `${Math.round(chain.confidence_score)}% conf` : ""}
                                </span>
                              </div>
                              <p className="text-sm text-white font-medium line-clamp-2">{chain.initial_query}</p>
                              {chain.conclusion && (
                                <p className="text-xs text-slate-300 line-clamp-3">{
                                  (() => {
                                    try { return JSON.parse(chain.conclusion); } catch { return chain.conclusion; }
                                  })()
                                }</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {chain.uncertainty_flags?.map((f) => (
                                  <Badge key={f} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                                    {f}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
