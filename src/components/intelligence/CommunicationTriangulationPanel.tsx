import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Triangle, Users, RefreshCw, ChevronRight, ArrowRight,
  Share2, Target, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CommunicationNode {
  id: string;
  name: string;
  totalMessages: number;
  inDegree: number;
  outDegree: number;
  betweennessCentrality: number;
  isBroker: boolean;
}

interface InformationFlow {
  from: string;
  to: string;
  through: string[];
  flowStrength: number;
}

interface TriangulationAnalysis {
  nodes: CommunicationNode[];
  edges: { source: string; target: string; weight: number; channels: string[] }[];
  brokers: CommunicationNode[];
  informationFlows: InformationFlow[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    networkDensity: number;
  };
}

export function CommunicationTriangulationPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('brokers');

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['communication-triangulation', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-communication-triangulation');
      if (error) throw error;
      return data.analysis as TriangulationAnalysis;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-communication-triangulation');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-triangulation'] });
      toast.success('Communication analysis refreshed');
    },
    onError: (err) => {
      toast.error('Analysis failed: ' + (err as Error).message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-destructive">Failed to load analysis</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refreshMutation.mutate()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Triangle className="h-5 w-5" />
              Communication Triangulation
            </CardTitle>
            <CardDescription>
              Who-contacts-whom analysis, information brokers, and flow patterns
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis && analysis.nodes.length > 0 ? (
          <>
            {/* Network Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xl font-bold">{analysis.metrics.totalNodes}</div>
                <div className="text-xs text-muted-foreground">Contacts</div>
              </div>
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xl font-bold">{analysis.metrics.totalEdges}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xl font-bold">{analysis.metrics.avgDegree.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Degree</div>
              </div>
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xl font-bold">{(analysis.metrics.networkDensity * 100).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Density</div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="brokers">
                  <Users className="h-4 w-4 mr-1" />
                  Brokers ({analysis.brokers.length})
                </TabsTrigger>
                <TabsTrigger value="centrality">
                  <Target className="h-4 w-4 mr-1" />
                  Centrality
                </TabsTrigger>
                <TabsTrigger value="flows">
                  <Share2 className="h-4 w-4 mr-1" />
                  Info Flows
                </TabsTrigger>
              </TabsList>

              <TabsContent value="brokers" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Information brokers are contacts who connect otherwise disconnected groups
                  </p>
                  <ScrollArea className="h-[250px]">
                    {analysis.brokers.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.brokers.map((broker) => (
                          <div
                            key={broker.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/contacts/${broker.id}`)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{broker.name}</span>
                                <Badge variant="default" className="text-[10px]">Broker</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>{broker.inDegree + broker.outDegree} connections</span>
                                <span>{broker.totalMessages} messages</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{broker.betweennessCentrality.toFixed(0)}</div>
                              <div className="text-[10px] text-muted-foreground">centrality</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No information brokers detected</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="centrality" className="mt-4">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {analysis.nodes.slice(0, 15).map((node, i) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/contacts/${node.id}`)}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{node.name}</span>
                            {node.isBroker && (
                              <Badge variant="outline" className="text-[10px]">Broker</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            In: {node.inDegree} • Out: {node.outDegree}
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Centrality</span>
                            <span>{node.betweennessCentrality.toFixed(0)}</span>
                          </div>
                          <Progress value={node.betweennessCentrality} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="flows" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Potential information pathways between contacts who aren't directly connected
                  </p>
                  <ScrollArea className="h-[250px]">
                    {analysis.informationFlows.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.informationFlows.slice(0, 10).map((flow, i) => {
                          const fromNode = analysis.nodes.find(n => n.id === flow.from);
                          const toNode = analysis.nodes.find(n => n.id === flow.to);
                          const throughNodes = flow.through.map(id => 
                            analysis.nodes.find(n => n.id === id)
                          ).filter(Boolean);

                          return (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  className="font-medium text-sm cursor-pointer hover:underline"
                                  onClick={() => navigate(`/contacts/${flow.from}`)}
                                >
                                  {fromNode?.name || 'Unknown'}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                {throughNodes.map((node, j) => (
                                  <span key={j} className="flex items-center gap-1">
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs cursor-pointer"
                                      onClick={() => navigate(`/contacts/${node!.id}`)}
                                    >
                                      {node!.name}
                                    </Badge>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                ))}
                                <span 
                                  className="font-medium text-sm cursor-pointer hover:underline"
                                  onClick={() => navigate(`/contacts/${flow.to}`)}
                                >
                                  {toNode?.name || 'Unknown'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Flow strength: {flow.flowStrength}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No indirect information flows detected</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Triangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No communication data to analyze</p>
            <p className="text-sm mb-4">Add communications and messages to see triangulation analysis</p>
            <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
              Run Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
