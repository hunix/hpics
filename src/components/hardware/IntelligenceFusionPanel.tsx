import { useState } from 'react';
import { 
  Combine, 
  Zap, 
  Target, 
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  BarChart3,
  Radio,
  Thermometer,
  Plane,
  Cpu,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntelligenceFusion, type FusionEvent, type ThreatLevel } from '@/hooks/useIntelligenceFusion';
import { formatDistanceToNow } from 'date-fns';

const threatColors: Record<ThreatLevel, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-green-500',
};

const sourceIcons: Record<string, typeof Radio> = {
  rf: Radio,
  thermal: Thermometer,
  aerial: Plane,
  sensor: Cpu,
  tscm: Target,
  sdr: BarChart3,
};

interface FusionEventCardProps {
  event: FusionEvent;
  onProcess: (id: string) => void;
}

function FusionEventCard({ event, onProcess }: FusionEventCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg ${threatColors[event.threat_level || 'none']} flex items-center justify-center`}>
            <Combine className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <Badge variant="outline" className="text-xs">
                {event.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </p>
            
            {/* Sources */}
            <div className="flex items-center gap-2 mt-2">
              {event.sources?.map((source, idx) => {
                const Icon = sourceIcons[source.type] || Cpu;
                return (
                  <div key={idx} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                    <Icon className="h-3 w-3" />
                    <span>{source.type.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium">
              {Math.round((event.confidence_score || 0) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">confidence</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t">
          {/* Fusion Result */}
          {event.fusion_result && Object.keys(event.fusion_result).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Fusion Analysis</h4>
              <div className="bg-muted/50 rounded p-2 text-xs font-mono">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(event.fusion_result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {event.recommendations && event.recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Recommendations</h4>
              <div className="space-y-2">
                {event.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="font-medium">{rec.action}</span>
                      <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!event.is_processed && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onProcess(event.id)}
            >
              Mark as Processed
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function IntelligenceFusionPanel() {
  const {
    fusionEvents,
    unprocessedEvents,
    criticalEvents,
    highThreatEvents,
    fusionStats,
    isLoading,
    triggerFusion,
    markProcessed,
    isFusing,
  } = useIntelligenceFusion();

  const handleManualFusion = () => {
    triggerFusion({
      sources: [
        { type: 'rf', data: {} },
        { type: 'thermal', data: {} },
        { type: 'sensor', data: {} },
      ],
      analysis_type: 'comprehensive',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Combine className="h-5 w-5" />
            Intelligence Fusion Engine
          </CardTitle>
          <Button 
            size="sm" 
            onClick={handleManualFusion}
            disabled={isFusing}
          >
            {isFusing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Fusing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" />
                Trigger Fusion
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Events</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{fusionStats.totalEvents}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unprocessed</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{fusionStats.unprocessedCount}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Critical</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-red-500">{fusionStats.criticalCount}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Confidence</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(fusionStats.avgConfidence * 100)}%
            </div>
          </div>
        </div>

        {/* Source Types */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Active Source Types</h4>
          <div className="flex flex-wrap gap-2">
            {fusionStats.sourceTypes.map((type) => {
              const Icon = sourceIcons[type] || Cpu;
              return (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {type.toUpperCase()}
                </Badge>
              );
            })}
            {fusionStats.sourceTypes.length === 0 && (
              <span className="text-xs text-muted-foreground">No active sources</span>
            )}
          </div>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="unprocessed">
          <TabsList className="mb-4">
            <TabsTrigger value="unprocessed" className="gap-2">
              Unprocessed
              {unprocessedEvents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{unprocessedEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical" className="gap-2">
              Critical
              {criticalEvents.length > 0 && (
                <Badge variant="destructive" className="ml-1">{criticalEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
          </TabsList>

          <TabsContent value="unprocessed">
            <ScrollArea className="h-[300px]">
              {unprocessedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3" />
                  <p>All events processed</p>
                </div>
              ) : (
                unprocessedEvents.map((event) => (
                  <FusionEventCard 
                    key={event.id} 
                    event={event} 
                    onProcess={markProcessed}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="critical">
            <ScrollArea className="h-[300px]">
              {criticalEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No critical events</p>
                </div>
              ) : (
                criticalEvents.map((event) => (
                  <FusionEventCard 
                    key={event.id} 
                    event={event} 
                    onProcess={markProcessed}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : fusionEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Combine className="h-12 w-12 mx-auto mb-3" />
                  <p>No fusion events yet</p>
                </div>
              ) : (
                fusionEvents.slice(0, 20).map((event) => (
                  <FusionEventCard 
                    key={event.id} 
                    event={event} 
                    onProcess={markProcessed}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
