import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Calendar,
  Brain,
  Zap,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { useFutureTimeline } from "@/hooks/intelligence/useFutureTimeline";
import { format, addMonths } from "date-fns";

interface FutureTimelineVisualizationProps {
  profileId?: string;
}

export function FutureTimelineVisualization({ profileId }: FutureTimelineVisualizationProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"6m" | "12m" | "24m">("12m");
  const { 
    predictions, 
    decisionWindows, 
    isLoading, 
    generatePredictions 
  } = useFutureTimeline(profileId);

  const timeframeMonths = { "6m": 6, "12m": 12, "24m": 24 };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "career_change": return <TrendingUp className="h-4 w-4" />;
      case "relationship": return <Target className="h-4 w-4" />;
      case "financial": return <Zap className="h-4 w-4" />;
      case "health": return <AlertTriangle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return "text-green-500";
    if (probability >= 0.6) return "text-yellow-500";
    if (probability >= 0.4) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Future Timeline Engine</h2>
            <p className="text-sm text-muted-foreground">
              Predictive life event modeling • Monte Carlo simulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as any)}>
            <TabsList>
              <TabsTrigger value="6m">6 Months</TabsTrigger>
              <TabsTrigger value="12m">12 Months</TabsTrigger>
              <TabsTrigger value="24m">24 Months</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generatePredictions(timeframeMonths[selectedTimeframe])}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Generate
          </Button>
        </div>
      </div>

      {/* Decision Windows Alert */}
      {decisionWindows.filter(w => w.urgency === 'critical').length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-500">Critical Decision Windows Active</p>
                <p className="text-sm text-muted-foreground">
                  {decisionWindows.filter(w => w.urgency === 'critical').length} contacts are in 
                  high-influence moments right now
                </p>
              </div>
              <Button variant="destructive" size="sm" className="ml-auto">
                View Windows
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Predicted Events Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="relative pl-6 border-l-2 border-muted space-y-6">
                {predictions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No predictions generated yet</p>
                    <p className="text-sm">Click "Generate" to create future timeline</p>
                  </div>
                ) : (
                  predictions
                    .sort((a, b) => new Date(a.predicted_date).getTime() - new Date(b.predicted_date).getTime())
                    .map((prediction, index) => (
                      <div key={prediction.id} className="relative">
                        <div className="absolute -left-[25px] p-1 rounded-full bg-background border-2 border-primary">
                          {getEventIcon(prediction.event_type)}
                        </div>
                        <div className="ml-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {format(new Date(prediction.predicted_date), "MMM yyyy")}
                                </Badge>
                                <Badge className="text-xs capitalize">
                                  {prediction.event_type.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="font-medium">{prediction.description}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {prediction.reasoning}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getProbabilityColor(prediction.probability)}`}>
                                {Math.round(prediction.probability * 100)}%
                              </p>
                              <p className="text-xs text-muted-foreground">probability</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Progress value={prediction.probability * 100} className="flex-1" />
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Decision Windows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Decision Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {decisionWindows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active decision windows</p>
                  </div>
                ) : (
                  decisionWindows.map((window) => (
                    <div 
                      key={window.id}
                      className={`p-4 rounded-lg border ${
                        window.urgency === 'critical' 
                          ? 'border-red-500/50 bg-red-500/5' 
                          : window.urgency === 'high'
                          ? 'border-orange-500/50 bg-orange-500/5'
                          : 'border-muted bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant={window.urgency === 'critical' ? 'destructive' : 'outline'}
                          className="capitalize"
                        >
                          {window.urgency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(window.window_start), "MMM d")} - 
                          {format(new Date(window.window_end), "MMM d")}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-2">{window.window_type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {window.context?.description || "Optimal moment for intervention"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Influence: </span>
                          <span className="font-medium">{Math.round(window.influence_multiplier * 100)}%</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Plan Action
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{predictions.length}</p>
              <p className="text-sm text-muted-foreground">Predicted Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{decisionWindows.length}</p>
              <p className="text-sm text-muted-foreground">Decision Windows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {predictions.length > 0 
                  ? Math.round(predictions.reduce((acc, p) => acc + p.probability, 0) / predictions.length * 100)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">
                {decisionWindows.filter(w => w.urgency === 'critical').length}
              </p>
              <p className="text-sm text-muted-foreground">Critical Windows</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
