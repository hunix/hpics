import { useState } from "react";
import {
  Radio, Shield, Search, Globe, AlertTriangle, Activity, Eye,
  Bell, Check, ChevronRight, ExternalLink, Radar, Zap, TrendingUp,
  TrendingDown, Minus, Newspaper, Scan, Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIntelligenceFeedPage } from "@/hooks/intelligence/useIntelligenceStream";
import { useContacts } from "@/hooks/useContacts";

// ─────────────────────────────────────── Severity Helpers ────────────────────

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: Zap },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Activity },
  low: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Bell },
  info: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", icon: Radio },
};

const THREAT_COLORS: Record<string, string> = {
  minimal: "text-green-400", low: "text-green-300", medium: "text-amber-400",
  elevated: "text-orange-400", high: "text-red-400", critical: "text-red-500",
};

// ─────────────────────────────────────── Event Card ──────────────────────────

function EventCard({
  event,
  onAcknowledge,
}: {
  event: { id: string; event_type: string; severity: string; title: string; description: string | null; anomaly_score: number | null; acknowledged: boolean; occurred_at: string; source_type: string | null };
  onAcknowledge: (id: string) => void;
}) {
  const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.info;
  const Icon = sev.icon;
  const ago = getTimeAgo(event.occurred_at);

  return (
    <div className={cn("p-3 rounded-xl border transition-all", sev.bg, sev.border, event.acknowledged && "opacity-50")}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", sev.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-[10px] border-current", sev.color)}>
              {event.event_type.replace(/([A-Z])/g, " $1").trim()}
            </Badge>
            <span className="text-[10px] text-slate-500">{ago}</span>
            {event.anomaly_score !== null && event.anomaly_score > 0 && (
              <span className="text-[10px] text-amber-400 font-mono ml-auto">
                ⚠ {Math.round(event.anomaly_score)}
              </span>
            )}
          </div>
          <p className="text-sm text-white font-medium">{event.title}</p>
          {event.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{event.description}</p>
          )}
          {event.source_type && (
            <span className="text-[10px] text-slate-600 mt-1 inline-block">{event.source_type}</span>
          )}
        </div>
        {!event.acknowledged && (
          <button
            onClick={() => onAcknowledge(event.id)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Acknowledge"
          >
            <Check className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Threat Radar ────────────────────────

function ThreatRadar({ threat }: { threat: { overall_threat_level: string; threat_score: number; deception_threat: number; financial_threat: number; operational_threat: number; loyalty_threat: number; external_threat: number; score_delta: number | null } }) {
  const dimensions = [
    { label: "Deception", value: threat.deception_threat, color: "bg-red-500" },
    { label: "Financial", value: threat.financial_threat, color: "bg-amber-500" },
    { label: "Operational", value: threat.operational_threat, color: "bg-violet-500" },
    { label: "Loyalty", value: threat.loyalty_threat, color: "bg-blue-500" },
    { label: "External", value: threat.external_threat, color: "bg-emerald-500" },
  ];

  const TrendIcon = (threat.score_delta ?? 0) > 0 ? TrendingUp : (threat.score_delta ?? 0) < 0 ? TrendingDown : Minus;
  const trendColor = (threat.score_delta ?? 0) > 0 ? "text-red-400" : (threat.score_delta ?? 0) < 0 ? "text-green-400" : "text-slate-500";

  return (
    <Card className="bg-[#0d1421] border-slate-800/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Radar className="w-4 h-4 text-red-400" />
          Threat Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <span className={cn("text-2xl font-bold", THREAT_COLORS[threat.overall_threat_level] ?? "text-slate-400")}>
            {Math.round(threat.threat_score)}
          </span>
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-wider", THREAT_COLORS[threat.overall_threat_level])}>
              {threat.overall_threat_level}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendIcon className={cn("w-3 h-3", trendColor)} />
              <span className={cn("text-[10px]", trendColor)}>
                {threat.score_delta !== null ? `${threat.score_delta > 0 ? "+" : ""}${Math.round(threat.score_delta)}` : "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {dimensions.map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-400">{d.label}</span>
                <span className="text-[10px] text-slate-500 font-mono">{Math.round(d.value)}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", d.color)} style={{ width: `${Math.min(100, d.value)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────── OSINT Status Panel ──────────────────

function OSINTStatusPanel({
  status,
  mentions,
  onCollect,
  isCollecting,
}: {
  status: Record<string, unknown> | null;
  mentions: Array<{ id: string; source_type: string; source_name: string | null; title: string | null; snippet: string; relevance_score: number; sentiment: string | null; is_actionable: boolean; source_url: string | null; discovered_at: string }>;
  onCollect: (type: string) => void;
  isCollecting: boolean;
}) {
  const collectionTypes = ["news", "social_media", "regulatory", "domain"];
  const byType = (status as Record<string, { collections_by_type: Record<string, { last_scan: string; mentions: number; status: string }> }>)?.collections_by_type ?? {};

  return (
    <div className="space-y-3">
      {/* Collection triggers */}
      <div className="grid grid-cols-2 gap-2">
        {collectionTypes.map((type) => {
          const info = byType[type];
          return (
            <button
              key={type}
              onClick={() => onCollect(type)}
              disabled={isCollecting}
              className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                {type === "news" ? <Newspaper className="w-3.5 h-3.5 text-blue-400" /> :
                 type === "social_media" ? <Globe className="w-3.5 h-3.5 text-violet-400" /> :
                 type === "regulatory" ? <Database className="w-3.5 h-3.5 text-amber-400" /> :
                 <Scan className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-xs text-white capitalize">{type.replace("_", " ")}</span>
              </div>
              {info ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{info.mentions} mentions</span>
                  <Badge className={cn("text-[10px]",
                    info.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                    info.status === "running" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                    "bg-slate-500/20 text-slate-400 border-slate-500/30"
                  )}>
                    {info.status}
                  </Badge>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600">Not scanned</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Recent mentions */}
      {mentions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Recent Mentions</p>
          {mentions.slice(0, 5).map((m) => (
            <div key={m.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                  {m.source_name ?? m.source_type}
                </Badge>
                {m.is_actionable && (
                  <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">actionable</Badge>
                )}
                <span className={cn("text-[10px] ml-auto",
                  m.sentiment === "positive" ? "text-green-400" :
                  m.sentiment === "negative" ? "text-red-400" : "text-slate-500"
                )}>
                  {m.sentiment}
                </span>
              </div>
              {m.title && <p className="text-xs text-white font-medium">{m.title}</p>}
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{m.snippet}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={m.relevance_score * 100} className="h-1 flex-1" />
                <span className="text-[10px] text-slate-500">{Math.round(m.relevance_score * 100)}%</span>
                {m.source_url && (
                  <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-white/5 rounded">
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────── Time Helper ─────────────────────────

function getTimeAgo(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

// ─────────────────────────────────────── Main Page ───────────────────────────

export default function IntelligenceFeed() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const { data: contacts } = useContacts();

  const {
    events, totalEvents, threat, osintStatus, osintMentions,
    isLoading, acknowledge, processRules, runOSINT, computeThreat,
  } = useIntelligenceFeedPage(selectedProfileId);

  const selectedContact = contacts?.find((c) => c.id === selectedProfileId);
  const contactName = selectedContact ? `${selectedContact.first_name ?? ""} ${selectedContact.last_name ?? ""}`.trim() : "";

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0d1421]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h1 className="text-lg font-semibold">Intelligence Feed</h1>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">Phase 3</Badge>
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

          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-700"
            onClick={() => processRules.mutate(selectedProfileId)}
            disabled={processRules.isPending}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Run CEP
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar: Threat + OSINT */}
          <div className="space-y-4">
            {/* Threat Assessment */}
            {threat ? (
              <ThreatRadar threat={threat} />
            ) : (
              <Card className="bg-[#0d1421] border-slate-800/60">
                <CardContent className="py-6 flex flex-col items-center gap-2">
                  <Shield className="w-8 h-8 text-slate-700" />
                  <p className="text-xs text-slate-500">No threat assessment</p>
                  {selectedProfileId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={() => computeThreat.mutate(selectedProfileId)}
                      disabled={computeThreat.isPending}
                    >
                      Compute
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* OSINT Panel */}
            {selectedProfileId && (
              <Card className="bg-[#0d1421] border-slate-800/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-violet-400" />
                    OSINT Collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OSINTStatusPanel
                    status={osintStatus ?? null}
                    mentions={osintMentions}
                    onCollect={(type) => runOSINT.mutate({
                      profileId: selectedProfileId,
                      contactName,
                      collectionType: type,
                    })}
                    isCollecting={runOSINT.isPending}
                  />
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <div className="text-lg font-bold text-white">{totalEvents}</div>
                <div className="text-[10px] text-slate-500">Total Events</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <div className="text-lg font-bold text-amber-400">
                  {events.filter((e) => !e.acknowledged && (e.severity === "high" || e.severity === "critical")).length}
                </div>
                <div className="text-[10px] text-slate-500">Urgent</div>
              </div>
            </div>
          </div>

          {/* Main: Event Feed */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="all">
              <TabsList className="bg-slate-800/60 border border-slate-700/50">
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="threats">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />Threats
                </TabsTrigger>
                <TabsTrigger value="anomalies">
                  <Activity className="w-3.5 h-3.5 mr-1" />Anomalies
                </TabsTrigger>
                <TabsTrigger value="osint">
                  <Search className="w-3.5 h-3.5 mr-1" />OSINT
                </TabsTrigger>
              </TabsList>

              {(["all", "threats", "anomalies", "osint"] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <ScrollArea className="h-[calc(100vh-14rem)]">
                    <div className="space-y-2 pr-4">
                      {events
                        .filter((e) => {
                          if (tab === "threats") return e.event_type === "ThreatDetected" || e.severity === "high" || e.severity === "critical";
                          if (tab === "anomalies") return e.event_type === "BehaviorAnomaly" || (e.anomaly_score ?? 0) > 50;
                          if (tab === "osint") return e.event_type === "OSINTHit" || e.source_type === "osint";
                          return true;
                        })
                        .map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onAcknowledge={(id) => acknowledge.mutate({ eventId: id })}
                          />
                        ))}
                      {events.length === 0 && (
                        <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                          {isLoading ? "Loading events…" : "No intelligence events yet"}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
