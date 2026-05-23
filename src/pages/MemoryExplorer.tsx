import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, Clock, Zap, Search, AlertTriangle, Target, Activity, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useMemoryExplorer,
  useSemanticSearch,
  useConsolidateMemory,
  useSemanticFacts,
} from "@/hooks/intelligence/useSemanticMemory";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";

// ─────────────────────────────────────────────── Convergence Score Ring ──────

function ConvergenceRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const progress = ((score as number) / 100) * circ;
  const color = (score as number) >= 70 ? "#22c55e" : (score as number) >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="text-center -mt-16 mb-10">
        <div className="text-2xl font-bold text-white">{Math.round(score)}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────── Behavioural Gauge ───────────

function BehaviorGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{Math.round(value)}</span>
      </div>
      <Progress value={value} className="h-1.5" style={{ "--progress-color": color } as React.CSSProperties} />
    </div>
  );
}

// ─────────────────────────────────────────────── Timeline Event ──────────────

function TimelineEvent({ event }: { event: {
  event_type: string; event_title: string; event_narrative: string | null;
  significance_score: number; trust_delta: number; occurred_at: string;
} }) {
  const typeColors: Record<string, string> = {
    observation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    interaction: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    analysis: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    behavioral_shift: "bg-red-500/20 text-red-400 border-red-500/30",
    vulnerability_window: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  const colorClass = typeColors[event.event_type] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";
  const trustColor = event.trust_delta > 0 ? "text-green-400" : event.trust_delta < 0 ? "text-red-400" : "text-slate-500";

  return (
    <div className="flex gap-3 py-3">
      <div className="flex flex-col items-center">
        <div className={cn("w-2 h-2 rounded-full mt-1 border", colorClass)} />
        <div className="w-px flex-1 bg-slate-700/50 mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colorClass)}>
            {event.event_type.replace("_", " ")}
          </Badge>
          {event.trust_delta !== 0 && (
            <span className={cn("text-[10px] font-mono", trustColor)}>
              {event.trust_delta > 0 ? "+" : ""}{event.trust_delta} trust
            </span>
          )}
          <span className="text-[10px] text-slate-500 ml-auto">
            {new Date(event.occurred_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-white mt-1 font-medium">{event.event_title}</p>
        {event.event_narrative && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{event.event_narrative}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────── Main Page ───────────────────

export default function MemoryExplorer() {
  const [searchParams] = useSearchParams();
  const initialProfileId = searchParams.get("contactId") ?? undefined;

  const { data: contacts } = useContacts();
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(initialProfileId);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveQuery, setLiveQuery] = useState("");

  const {
    semanticFacts,
    episodicEvents,
    convergenceScore,
    behavioralState,
    contradictions,
    isLoading,
    refetch,
  } = useMemoryExplorer(selectedProfileId);

  const { data: searchResults, isFetching: isSearching } = useSemanticSearch(
    selectedProfileId,
    liveQuery,
    { enabled: liveQuery.length >= 3 }
  );

  const consolidate = useConsolidateMemory();

  const selectedContact = contacts?.find((c) => c.id === selectedProfileId);

  function handleSearch() {
    setLiveQuery(searchQuery);
  }

  const dimensionLabels: Record<string, string> = {
    behavioral: "Behavioral",
    intelligence_depth: "Intel Depth",
    biometric: "Biometric",
    semantic: "Semantic",
    temporal: "Temporal",
    psychological: "Psych Model",
    network: "Network",
  };

  const darkTriadItems = behavioralState ? [
    { label: "Machiavellianism", value: behavioralState.machiavellianism, color: "#8b5cf6" },
    { label: "Narcissism", value: behavioralState.narcissism, color: "#ec4899" },
    { label: "Psychopathy", value: behavioralState.psychopathy, color: "#ef4444" },
  ] : [];

  const psychoItems = behavioralState ? [
    { label: "Trust Score", value: behavioralState.trust_score, color: "#22c55e" },
    { label: "Stress Level", value: behavioralState.stress_level, color: "#f59e0b" },
    { label: "Deception Risk", value: behavioralState.deception_risk, color: "#ef4444" },
    { label: "Openness", value: behavioralState.openness_index, color: "#3b82f6" },
    { label: "Agreeableness", value: behavioralState.agreeableness, color: "#06b6d4" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0d1421]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-semibold text-white">Memory Explorer</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">Phase 1</Badge>
          </div>

          <div className="flex-1" />

          {/* Contact selector */}
          <select
            value={selectedProfileId ?? ""}
            onChange={(e) => setSelectedProfileId(e.target.value || undefined)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Select contact…</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>

          {selectedProfileId && (
            <Button
              size="sm"
              variant="outline"
              className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
              onClick={() => consolidate.mutate(selectedProfileId)}
              disabled={consolidate.isPending}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              {consolidate.isPending ? "Consolidating…" : "Consolidate"}
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={refetch}>
            <Activity className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {!selectedProfileId ? (
        <div className="flex items-center justify-center h-[60vh] text-slate-500">
          <div className="text-center">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Select a contact to explore their intelligence memory</p>
            <p className="text-sm mt-1">4-layer memory: Working → Episodic → Semantic → Procedural</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Convergence Score Overview */}
          {convergenceScore && (
            <Card className="bg-[#0d1421] border-slate-800/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  Intelligence Convergence Score
                  <Badge
                    className={cn("ml-auto", convergenceScore.overall >= 70
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : convergenceScore.overall >= 40
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                    )}
                  >
                    {convergenceScore.overall}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="flex items-center justify-center col-span-2 sm:col-span-1">
                    <ConvergenceRing score={convergenceScore.overall} label="Overall" size={90} />
                  </div>
                  {Object.entries(convergenceScore.dimensions).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs text-slate-400">{dimensionLabels[key] ?? key}</div>
                      <Progress value={val as number} className="h-2" />
                      <div className="text-xs font-mono text-white">{Math.round(val as number)}%</div>
                    </div>
                  ))}
                </div>
                {convergenceScore.gapCategories.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Gaps:</span>
                    {convergenceScore.gapCategories.map((g: string) => (
                      <Badge key={g} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                        {dimensionLabels[g] ?? g}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Behavioral State */}
            <div className="space-y-4">
              {behavioralState && (
                <Card className="bg-[#0d1421] border-slate-800/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Behavioral State
                      {behavioralState.anomaly_score > 20 && (
                        <Badge className="ml-auto bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">
                          Anomaly: {Math.round(behavioralState.anomaly_score)}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                {psychoItems.map((item) => (
                    <BehaviorGauge key={item.label} label={item.label} value={item.value} color={item.color} />
                ))}
                <Separator className="bg-slate-700/50" />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Dark Triad</p>
                {darkTriadItems.map((item) => (
                    <BehaviorGauge key={item.label} label={item.label} value={item.value} color={item.color} />
                ))}
                    {behavioralState.vulnerability_window_active && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <p className="text-xs text-orange-300 font-medium">⚡ Vulnerability Window Active</p>
                        {behavioralState.vulnerability_window_expires_at && (
                          <p className="text-[10px] text-orange-400/70 mt-0.5">
                            Expires: {new Date(behavioralState.vulnerability_window_expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contradictions */}
              {contradictions.length > 0 && (
                <Card className="bg-[#0d1421] border-red-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      Belief Conflicts ({contradictions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contradictions.slice(0, 3).map((c: Record<string, unknown>) => (
                      <div key={c.id as string} className="p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="text-[10px] bg-red-500/20 text-red-300 border-red-500/30">
                            {String(c.contradiction_type ?? '').replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-red-400 font-mono">
                            {Math.round((c.conflict_score as number ?? 0) * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{String(c.existing_fact ?? '')}</p>
                        <p className="text-[10px] text-red-300 mt-1 line-clamp-1">
                          ↳ Contradicted by new evidence
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center + Right: Memory Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="episodic">
                <TabsList className="bg-slate-800/60 border border-slate-700/50">
                  <TabsTrigger value="search">
                    <Search className="w-3.5 h-3.5 mr-1.5" />Semantic Search
                  </TabsTrigger>
                  <TabsTrigger value="episodic">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />Timeline ({episodicEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="semantic">
                    <Brain className="w-3.5 h-3.5 mr-1.5" />Semantic Facts ({semanticFacts.length})
                  </TabsTrigger>
                </TabsList>

                {/* Semantic Search */}
                <TabsContent value="search" className="mt-4">
                  <Card className="bg-[#0d1421] border-slate-800/60">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search intelligence memory…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>

                      {searchResults && (
                        <>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Badge variant="outline" className="text-[10px]">{searchResults.searchMethod}</Badge>
                            <span>{searchResults.sourceCount} sources found</span>
                          </div>
                          <ScrollArea className="h-80">
                            <div className="space-y-3">
                              {searchResults.citations.map((c, i) => (
                                <div key={c.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-violet-400 font-medium">
                                      Source {i + 1} · {c.type}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {Math.round(c.relevance * 100)}% match
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 line-clamp-3">{c.content}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Episodic Timeline */}
                <TabsContent value="episodic" className="mt-4">
                  <Card className="bg-[#0d1421] border-slate-800/60">
                    <CardContent className="pt-4">
                      {isLoading ? (
                        <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                          Loading timeline…
                        </div>
                      ) : episodicEvents.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                          No episodic events recorded yet
                        </div>
                      ) : (
                        <ScrollArea className="h-[32rem]">
                          <div className="pr-4">
                            {episodicEvents.map((event) => (
                              <TimelineEvent key={event.id} event={{
                                event_type: event.event_type,
                                event_title: event.event_title,
                                event_narrative: event.event_narrative,
                                significance_score: event.significance_score,
                                trust_delta: event.trust_delta,
                                occurred_at: event.occurred_at,
                              }} />
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Semantic Facts */}
                <TabsContent value="semantic" className="mt-4">
                  <Card className="bg-[#0d1421] border-slate-800/60">
                    <CardContent className="pt-4">
                      {semanticFacts.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
                          <Brain className="w-8 h-8 opacity-30" />
                          <p>No semantic facts extracted yet</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
                            onClick={() => consolidate.mutate(selectedProfileId!)}
                            disabled={consolidate.isPending}
                          >
                            <Zap className="w-3.5 h-3.5 mr-1.5" />
                            Run Consolidation
                          </Button>
                        </div>
                      ) : (
                        <ScrollArea className="h-[32rem]">
                          <div className="space-y-3 pr-4">
                            {semanticFacts.map((fact) => (
                              <div key={fact.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-500/30">
                                    {fact.fact_category}
                                  </Badge>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-violet-500 rounded-full"
                                        style={{ width: `${fact.confidence * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {Math.round(fact.confidence * 100)}%
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-white">{fact.fact_statement}</p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {fact.evidence_count} evidence sources · {new Date(fact.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
