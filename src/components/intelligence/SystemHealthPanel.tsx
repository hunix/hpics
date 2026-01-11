import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Cpu,
  Database,
  Zap,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Json } from "@/integrations/supabase/types";

interface SystemHealth {
  component: string;
  status: string | null;
  last_heartbeat: string | null;
  metrics: unknown;
}

interface SystemHealthPanelProps {
  health: SystemHealth[];
  isLoading: boolean;
}

const DEFAULT_COMPONENTS = [
  { name: "orchestrator", label: "Analysis Orchestrator", icon: Cpu },
  { name: "event_store", label: "Event Store", icon: Database },
  { name: "circuit_breaker", label: "Circuit Breaker", icon: Shield },
  { name: "aggregate_builder", label: "Aggregate Builder", icon: Zap },
];

export function SystemHealthPanel({ health, isLoading }: SystemHealthPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "degraded": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "down": return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "degraded": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "down": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getComponentHealth = (componentName: string) => {
    return health.find(h => h.component === componentName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            System Health
          </CardTitle>
          <CardDescription>CAAS component status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallHealth = health.length === 0 
    ? "unknown" 
    : health.every(h => h.status === "healthy") 
      ? "healthy" 
      : health.some(h => h.status === "down") 
        ? "down" 
        : "degraded";

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Health
              </CardTitle>
              <CardDescription>
                Centralized AI Analysis System status
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`text-sm ${getStatusColor(overallHealth)}`}
            >
              {getStatusIcon(overallHealth)}
              <span className="ml-2 capitalize">{overallHealth}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {DEFAULT_COMPONENTS.map(({ name, label, icon: Icon }) => {
              const componentHealth = getComponentHealth(name);
              const status = componentHealth?.status || "unknown";
              const lastHeartbeat = componentHealth?.last_heartbeat;
              
              return (
                <div 
                  key={name}
                  className={`p-4 rounded-lg border transition-colors ${
                    status === "healthy" 
                      ? "border-emerald-500/20 bg-emerald-500/5" 
                      : status === "degraded"
                        ? "border-amber-500/20 bg-amber-500/5"
                        : status === "down"
                          ? "border-destructive/20 bg-destructive/5"
                          : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{label}</span>
                    </div>
                    {getStatusIcon(status)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {lastHeartbeat ? (
                      <span>
                        Last seen {formatDistanceToNow(new Date(lastHeartbeat), { addSuffix: true })}
                      </span>
                    ) : (
                      <span>No heartbeat recorded</span>
                    )}
                  </div>
                  
                  {componentHealth?.metrics && typeof componentHealth.metrics === 'object' && !Array.isArray(componentHealth.metrics) && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(componentHealth.metrics).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="font-medium">
                              {typeof value === "number" ? value.toLocaleString() : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Circuit Breaker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Circuit Breaker Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["ai_gateway", "database", "storage", "embeddings"].map((circuit) => (
              <div key={circuit} className="flex items-center justify-between">
                <span className="text-sm capitalize">{circuit.replace(/_/g, " ")}</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Closed
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
