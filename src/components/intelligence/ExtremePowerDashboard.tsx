import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Dna, 
  Skull, 
  Eye, 
  Radio,
  Zap,
  Shield
} from "lucide-react";

import { FutureTimelineVisualization } from "./FutureTimelineVisualization";
import { CampaignEvolutionDashboard } from "./CampaignEvolutionDashboard";
import { DarkWebIntelligenceCenter } from "./DarkWebIntelligenceCenter";
import { MicroExpressionAnalyzer } from "./MicroExpressionAnalyzer";
import { NarrativeControlCenter } from "./NarrativeControlCenter";

interface ExtremePowerDashboardProps {
  profileId?: string;
}

export function ExtremePowerDashboard({ profileId }: ExtremePowerDashboardProps) {
  const [activeModule, setActiveModule] = useState("timeline");

  const modules = [
    { 
      id: "timeline", 
      name: "Future Timeline", 
      icon: Brain, 
      color: "text-primary",
      description: "Predictive life modeling"
    },
    { 
      id: "evolution", 
      name: "Campaign Evolution", 
      icon: Dna, 
      color: "text-green-500",
      description: "Self-evolving strategies"
    },
    { 
      id: "darkweb", 
      name: "Dark Web Intel", 
      icon: Skull, 
      color: "text-purple-500",
      description: "Underground monitoring"
    },
    { 
      id: "microexp", 
      name: "Micro-Expressions", 
      icon: Eye, 
      color: "text-cyan-500",
      description: "Deception detection"
    },
    { 
      id: "narrative", 
      name: "Narrative Control", 
      icon: Radio, 
      color: "text-indigo-500",
      description: "Perception warfare"
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <Zap className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Extreme Power Suite</h1>
            <p className="text-muted-foreground">
              Advanced intelligence capabilities for absolute dominance
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-red-500 border-red-500/50">
          <Shield className="h-3 w-3 mr-1" />
          Maximum Power Mode
        </Badge>
      </div>

      {/* Module Selector */}
      <div className="grid grid-cols-5 gap-4">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              activeModule === module.id 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setActiveModule(module.id)}
          >
            <CardContent className="pt-6 text-center">
              <module.icon className={`h-8 w-8 mx-auto mb-2 ${module.color}`} />
              <p className="font-medium text-sm">{module.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Module Content */}
      <div className="mt-6">
        {activeModule === "timeline" && (
          <FutureTimelineVisualization profileId={profileId} />
        )}
        {activeModule === "evolution" && (
          <CampaignEvolutionDashboard profileId={profileId} />
        )}
        {activeModule === "darkweb" && (
          <DarkWebIntelligenceCenter profileId={profileId} />
        )}
        {activeModule === "microexp" && (
          <MicroExpressionAnalyzer profileId={profileId} />
        )}
        {activeModule === "narrative" && (
          <NarrativeControlCenter profileId={profileId} />
        )}
      </div>
    </div>
  );
}
