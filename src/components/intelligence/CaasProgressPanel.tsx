import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

interface Phase {
  id: string;
  name: string;
  description: string;
  status: "completed" | "in_progress" | "pending" | "blocked";
  progress: number;
  tasks: Task[];
}

interface Task {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "pending";
}

const phases: Phase[] = [
  {
    id: "phase-1",
    name: "Phase 1: Core Infrastructure",
    description: "Database schema, event sourcing, and orchestrator",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t1-1", name: "Create analysis_events table with hash-chaining", status: "completed" },
      { id: "t1-2", name: "Create analysis_aggregates table", status: "completed" },
      { id: "t1-3", name: "Create orchestrator_jobs table", status: "completed" },
      { id: "t1-4", name: "Build analysis-orchestrator edge function", status: "completed" },
      { id: "t1-5", name: "Implement circuit breaker pattern", status: "completed" },
    ],
  },
  {
    id: "phase-2",
    name: "Phase 2: Data Retention Manager",
    description: "UI for managing data deletion with intelligence preservation",
    status: "in_progress",
    progress: 50,
    tasks: [
      { id: "t2-1", name: "Create DataRetentionManager component", status: "in_progress" },
      { id: "t2-2", name: "Build deletion request flow", status: "pending" },
      { id: "t2-3", name: "Implement soft-delete with event preservation", status: "pending" },
    ],
  },
  {
    id: "phase-3",
    name: "Phase 3: Analysis Timeline",
    description: "Timeline visualization for contact analysis history",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "t3-1", name: "Create AnalysisTimeline component", status: "pending" },
      { id: "t3-2", name: "Build event visualization", status: "pending" },
      { id: "t3-3", name: "Implement confidence trend charts", status: "pending" },
    ],
  },
  {
    id: "phase-4",
    name: "Phase 4: Source Asset Registry",
    description: "Track and link source assets to analysis events",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "t4-1", name: "Create SourceAssetRegistry component", status: "pending" },
      { id: "t4-2", name: "Build asset-to-event linking UI", status: "pending" },
      { id: "t4-3", name: "Implement provenance tracking", status: "pending" },
    ],
  },
  {
    id: "phase-5",
    name: "Phase 5: Cross-Modal Correlation",
    description: "Fusion visualization for multi-modal analysis",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "t5-1", name: "Create CrossModalCorrelationViewer", status: "pending" },
      { id: "t5-2", name: "Implement modality alignment visualization", status: "pending" },
      { id: "t5-3", name: "Build contradiction detection UI", status: "pending" },
    ],
  },
];

const getStatusIcon = (status: Phase["status"] | Task["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "in_progress":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "blocked":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: Phase["status"]) => {
  const variants: Record<Phase["status"], string> = {
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    pending: "bg-muted text-muted-foreground border-border",
    blocked: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };
  
  const labels: Record<Phase["status"], string> = {
    completed: "Completed",
    in_progress: "In Progress",
    pending: "Pending",
    blocked: "Blocked",
  };
  
  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
};

export function CaasProgressPanel() {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const totalPhases = phases.length;
  const overallProgress = Math.round((completedPhases / totalPhases) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">CAAS Implementation Progress</CardTitle>
          <Badge variant="outline" className="text-primary">
            {completedPhases}/{totalPhases} Phases
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(phase.status)}
                <span className="font-medium text-sm">{phase.name}</span>
              </div>
              {getStatusBadge(phase.status)}
            </div>
            <p className="text-xs text-muted-foreground pl-6">{phase.description}</p>
            {phase.status !== "pending" && (
              <div className="pl-6 space-y-1">
                <Progress value={phase.progress} className="h-1" />
                <div className="grid grid-cols-1 gap-1 mt-2">
                  {phase.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getStatusIcon(task.status)}
                      <span className={task.status === "completed" ? "line-through opacity-60" : ""}>
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
