import { useState } from "react";
import {
  Rocket, Target, Brain, Newspaper, Database, TrendingUp,
  Plus, Play, Zap, ChevronRight, Clock, Activity,
  BarChart3, Shield, Eye, Globe, Fingerprint
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAutonomyDashboard, type StrategicGoal, type IntelligenceConvergence } from "@/hooks/intelligence/useAutonomyEngine";
import { useContacts } from "@/hooks/useContacts";

// ─────────────────────────────────────── Convergence Radar ──────────────────

function ConvergenceRadar({ convergence }: { convergence: IntelligenceConvergence }) {
  const dimensions = [
    { key: "financial_depth", label: "Financial", icon: BarChart3, color: "text-amber-400" },
    { key: "family_network", label: "Family", icon: Target, color: "text-pink-400" },
    { key: "professional_network", label: "Professional", icon: Globe, color: "text-blue-400" },
    { key: "behavioral_baseline", label: "Behavioral", icon: Activity, color: "text-violet-400" },
    { key: "stress_triggers", label: "Stress", icon: Zap, color: "text-red-400" },
    { key: "communication_patterns", label: "Comms", icon: Newspaper, color: "text-cyan-400" },
    { key: "travel_patterns", label: "Travel", icon: Globe, color: "text-emerald-400" },
    { key: "digital_footprint", label: "Digital", icon: Eye, color: "text-indigo-400" },
    { key: "biometric_coverage", label: "Biometric", icon: Fingerprint, color: "text-green-400" },
    { key: "osint_coverage", label: "OSINT", icon: Shield, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-3">
      {/* Big Score */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="url(#convergenceGrad)" strokeWidth="8"
              strokeDasharray={`${convergence.convergence_score * 2.51} 251`} strokeLinecap="round" />
            <defs>
              <linearGradient id="convergenceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{Math.round(convergence.convergence_score)}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-white font-medium">Intelligence Convergence</p>
          {convergence.score_delta !== null && (
            <p className={cn("text-xs", convergence.score_delta > 0 ? "text-emerald-400" : convergence.score_delta < 0 ? "text-red-400" : "text-slate-500")}>
              {convergence.score_delta > 0 ? "+" : ""}{Math.round(convergence.score_delta)} from previous
            </p>
          )}
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="space-y-1.5">
        {dimensions.map(({ key, label, icon: Icon, color }) => {
          const value = (convergence as unknown as Record<string, number>)[key] ?? 0;
          return (
            <div key={key} className="flex items-center gap-2">
              <Icon className={cn("w-3 h-3 flex-shrink-0", color)} />
              <span className="text-[10px] text-slate-400 w-16 truncate">{label}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all",
                  value >= 60 ? "bg-emerald-500" : value >= 30 ? "bg-amber-500" : "bg-red-500"
                )} style={{ width: `${Math.min(100, value)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 w-6 text-right font-mono">{Math.round(value)}</span>
            </div>
          );
        })}
      </div>

      {/* Gaps */}
      {convergence.identified_gaps.length > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-[10px] text-amber-400 font-medium mb-1">Intelligence Gaps ({convergence.identified_gaps.length})</p>
          {convergence.identified_gaps.slice(0, 3).map((gap, i) => (
            <p key={i} className="text-[10px] text-amber-300/70">• {gap.dimension}: {gap.suggested_collection_action}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────── Goal Card ───────────────────────────

function GoalCard({ goal, onExecute, isExecuting }: { goal: StrategicGoal; onExecute: () => void; isExecuting: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor = { critical: "text-red-400", high: "text-orange-400", medium: "text-amber-400", low: "text-slate-400" }[goal.priority] ?? "text-slate-400";

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3 text-left hover:bg-slate-700/20 transition-colors">
        <div className="flex items-center gap-2 mb-1.5">
          <Target className={cn("w-3.5 h-3.5", priorityColor)} />
          <Badge variant="outline" className="text-[10px]">{goal.goal_type}</Badge>
          <Badge className={cn("text-[10px]",
            goal.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
            goal.status === "active" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
            "bg-slate-500/20 text-slate-400 border-slate-500/30"
          )}>{goal.status}</Badge>
          <span className="text-[10px] text-slate-500 ml-auto">{goal.executions_count} runs</span>
          <ChevronRight className={cn("w-3.5 h-3.5 text-slate-500 transition-transform", expanded && "rotate-90")} />
        </div>
        <p className="text-sm text-white font-medium">{goal.title}</p>
        <Progress value={goal.progress_pct} className="h-1 mt-2" />
        <span className="text-[10px] text-slate-500">{Math.round(goal.progress_pct)}%</span>
      </button>

      {expanded && (
        <div className="p-3 pt-0 border-t border-slate-700/40 space-y-3">
          {goal.description && <p className="text-xs text-slate-400">{goal.description}</p>}

          {/* Sub-tasks */}
          {goal.sub_tasks.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Sub-Tasks</p>
              {goal.sub_tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={cn("w-1.5 h-1.5 rounded-full",
                    t.status === "completed" ? "bg-emerald-500" : "bg-slate-600"
                  )} />
                  <span className="text-slate-300 flex-1">{t.description}</span>
                  <Badge variant="outline" className="text-[10px]">{t.assigned_agent}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Findings */}
          {goal.findings.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Findings ({goal.findings.length})</p>
              {goal.findings.slice(0, 3).map((f, i) => (
                <p key={i} className="text-[10px] text-slate-400">• {f.finding.slice(0, 200)}</p>
              ))}
            </div>
          )}

          {goal.status === "active" && (
            <Button size="sm" onClick={onExecute} disabled={isExecuting} className="w-full bg-violet-600 hover:bg-violet-500">
              <Play className="w-3.5 h-3.5 mr-1.5" />Execute Next Cycle
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────── Main Page ───────────────────────────

export default function AutonomyDashboard() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const { data: contacts } = useContacts();

  const {
    goals, convergence, stats, isLoading,
    createGoal, executeGoal, generateBriefing,
    consolidateMemory, computeConvergence,
  } = useAutonomyDashboard(selectedProfileId);

  function handleCreateGoal() {
    if (!newGoalTitle.trim()) return;
    createGoal.mutate({
      title: newGoalTitle,
      description: newGoalDesc || undefined,
      profileId: selectedProfileId,
      priority: "medium",
    });
    setNewGoalTitle("");
    setNewGoalDesc("");
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0d1421]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <Rocket className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-semibold">Autonomy Dashboard</h1>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">Phase 5</Badge>
          <div className="flex-1" />

          <select
            value={selectedProfileId ?? ""}
            onChange={(e) => setSelectedProfileId(e.target.value || undefined)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
          >
            <option value="">All Contacts</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Events", value: stats.total_events, icon: Activity, color: "text-cyan-400" },
              { label: "Urgent", value: stats.urgent_events, icon: Zap, color: "text-red-400" },
              { label: "Sessions", value: stats.total_agent_sessions, icon: Brain, color: "text-violet-400" },
              { label: "OSINT", value: stats.total_osint_mentions, icon: Globe, color: "text-blue-400" },
              { label: "Active Goals", value: stats.active_goals, icon: Target, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="bg-[#0d1421] border-slate-800/60">
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", color)} />
                  <div>
                    <div className="text-lg font-bold text-white">{value ?? 0}</div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Actions + Convergence */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card className="bg-[#0d1421] border-slate-800/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 justify-start" onClick={() => generateBriefing.mutate()} disabled={generateBriefing.isPending}>
                  <Newspaper className="w-3.5 h-3.5 mr-2 text-blue-400" />Generate Daily Briefing
                </Button>
                <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 justify-start" onClick={() => consolidateMemory.mutate()} disabled={consolidateMemory.isPending}>
                  <Database className="w-3.5 h-3.5 mr-2 text-emerald-400" />Consolidate Memory
                </Button>
                {selectedProfileId && (
                  <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 justify-start" onClick={() => computeConvergence.mutate(selectedProfileId)} disabled={computeConvergence.isPending}>
                    <TrendingUp className="w-3.5 h-3.5 mr-2 text-violet-400" />Update Convergence
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Convergence */}
            {convergence && (
              <Card className="bg-[#0d1421] border-slate-800/60">
                <CardContent className="pt-4">
                  <ConvergenceRadar convergence={convergence} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center + Right: Goals */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="goals">
              <TabsList className="bg-slate-800/60 border border-slate-700/50">
                <TabsTrigger value="goals"><Target className="w-3.5 h-3.5 mr-1.5" />Goals ({goals.length})</TabsTrigger>
                <TabsTrigger value="create"><Plus className="w-3.5 h-3.5 mr-1.5" />New Goal</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="mt-4">
                {goals.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                    No strategic goals yet — create one to begin autonomous intelligence
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-18rem)]">
                    <div className="space-y-3 pr-4">
                      {goals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onExecute={() => executeGoal.mutate(goal.id)}
                          isExecuting={executeGoal.isPending}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="create" className="mt-4">
                <Card className="bg-[#0d1421] border-slate-800/60">
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      placeholder="Goal title, e.g. 'Map John's financial network'"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newGoalDesc}
                      onChange={(e) => setNewGoalDesc(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white resize-none h-24"
                    />
                    <Button className="w-full bg-violet-600 hover:bg-violet-500" onClick={handleCreateGoal} disabled={!newGoalTitle.trim() || createGoal.isPending}>
                      <Plus className="w-4 h-4 mr-2" />Create Strategic Goal
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
