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
    name: "Phase 1: Dashboard & Core Widgets",
    description: "Apply is_active filter to dashboard and core widget queries",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t1-1", name: "NetworkIntelligence.tsx profile queries", status: "completed" },
      { id: "t1-2", name: "BiometricStatusWidget.tsx", status: "completed" },
      { id: "t1-3", name: "RelationshipOverviewWidget.tsx", status: "completed" },
      { id: "t1-4", name: "NetworkResiliencePanel.tsx", status: "completed" },
      { id: "t1-5", name: "AuditCompliancePanel.tsx", status: "completed" },
    ],
  },
  {
    id: "phase-2",
    name: "Phase 2: Intelligence Panels",
    description: "Filter active contacts in all intelligence analysis panels",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t2-1", name: "NetworkIntelligencePanel.tsx", status: "completed" },
      { id: "t2-2", name: "EntityResolutionPanel.tsx", status: "completed" },
      { id: "t2-3", name: "InformationFlowPanel.tsx", status: "completed" },
      { id: "t2-4", name: "DeceptionAnalysisPanel.tsx", status: "completed" },
      { id: "t2-5", name: "BehavioralAnomalyDashboard.tsx", status: "completed" },
    ],
  },
  {
    id: "phase-3",
    name: "Phase 3: Behavioral & Prediction",
    description: "Active filter for behavioral analysis and prediction components",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t3-1", name: "BehavioralDNAPanel.tsx", status: "completed" },
      { id: "t3-2", name: "BehavioralPredictionsPanel.tsx", status: "completed" },
      { id: "t3-3", name: "FortuneTrajectoryPanel.tsx", status: "completed" },
      { id: "t3-4", name: "RelationshipTrajectoryPanel.tsx", status: "completed" },
    ],
  },
  {
    id: "phase-4",
    name: "Phase 4: AI & Command Center",
    description: "Filter active contacts in AI hubs and command panels",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t4-1", name: "CrossModalIntelligenceHub.tsx", status: "completed" },
      { id: "t4-2", name: "GlobalAICommand.tsx", status: "completed" },
      { id: "t4-3", name: "ConversationCopilot.tsx", status: "completed" },
      { id: "t4-4", name: "SocialPanel.tsx", status: "completed" },
    ],
  },
  {
    id: "phase-5",
    name: "Phase 5: Media & Offline",
    description: "Active filter for media gallery and offline sync",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t5-1", name: "MediaIntelligenceGallery.tsx", status: "completed" },
      { id: "t5-2", name: "useOfflineData.tsx hook", status: "completed" },
      { id: "t5-3", name: "QuickCaptureFlow.tsx", status: "completed" },
    ],
  },
  {
    id: "phase-6",
    name: "Phase 6: Edge Functions (Batch 1)",
    description: "Apply is_active filter to prediction and analysis edge functions",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t6-1", name: "predict-contact-needs", status: "completed" },
      { id: "t6-2", name: "power-network-analyzer", status: "completed" },
      { id: "t6-3", name: "predict-churn & predict-churn-enhanced", status: "completed" },
      { id: "t6-4", name: "detect-shadow-networks", status: "completed" },
    ],
  },
  {
    id: "phase-7",
    name: "Phase 7: Edge Functions (Batch 2)",
    description: "Apply filter to generation and inference edge functions",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t7-1", name: "generate-influence-strategy, generate-dossier", status: "completed" },
      { id: "t7-2", name: "generate-gift-suggestions, generate-meeting-prep", status: "completed" },
      { id: "t7-3", name: "infer-relationships, detect-life-milestones", status: "completed" },
      { id: "t7-4", name: "analyze-behavioral, analyze-facial, analyze-vocal", status: "completed" },
    ],
  },
  {
    id: "phase-8",
    name: "Phase 8: Edge Functions (Batch 3)",
    description: "Apply filter to AI analysis and synthesis edge functions",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t8-1", name: "deep-intelligence-engine, cross-modal-synthesis", status: "completed" },
      { id: "t8-2", name: "behavioral-future-modeler, behavioral-dna-sequencer", status: "completed" },
      { id: "t8-3", name: "personality-dna-extractor, aggregate-contact-intelligence", status: "completed" },
      { id: "t8-4", name: "analyze-romantic-intelligence, manipulation-vulnerability-assessment", status: "completed" },
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
