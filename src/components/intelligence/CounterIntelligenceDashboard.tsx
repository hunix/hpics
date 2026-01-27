import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, AlertTriangle, Eye, Lock, Loader2, 
  TrendingUp, TrendingDown, Minus, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

interface CounterIntelligenceDashboardProps {
  userId: string;
}

interface ThreatData {
  overallThreatLevel: string;
  activeThreats: Array<{
    threatId: string;
    type: string;
    severity: number;
    description: string;
    recommendedActions: string[];
  }>;
  deceptionMatrix: {
    confirmedDeceptions: Array<{
      profileName: string;
      deceptionType: string;
      trustImpact: number;
    }>;
    deceptionTrends: string;
  };
  trustErosionMap: Array<{
    profileName: string;
    trustTrend: string;
    erosionRate: number;
    interventionUrgency: string;
  }>;
  counterSurveillanceRecommendations: Array<{
    priority: string;
    action: string;
    rationale: string;
  }>;
}

export function CounterIntelligenceDashboard({ userId }: CounterIntelligenceDashboardProps) {
  const [data, setData] = useState<ThreatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const { getThreatSummary } = useSecurityMonitor();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runCounterIntelScan = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('counter-intelligence-monitor', {
        body: { userId, scanType: 'full' }
      });

      if (!isMountedRef.current) return;
      if (error) throw error;
      setData(result.analysis);
      setLastScan(new Date());
      toast.success('Counter-intelligence scan complete');
    } catch (error: any) {
      if (isMountedRef.current) {
        toast.error(error.message || 'Scan failed');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getThreatLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'elevated': 'bg-amber-500 text-white',
      'guarded': 'bg-yellow-500 text-black',
      'low': 'bg-green-500 text-white'
    };
    return colors[level?.toLowerCase()] || 'bg-muted';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend?.toLowerCase()) {
      case 'deteriorating':
      case 'increasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'improving':
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-red-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-red-500" />
              Counter-Intelligence Command Center
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastScan && (
                <span className="text-xs text-muted-foreground">
                  Last scan: {lastScan.toLocaleTimeString()}
                </span>
              )}
              <Button 
                onClick={runCounterIntelScan} 
                disabled={loading}
                size="sm"
                className="bg-gradient-to-r from-red-500 to-orange-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Full Threat Scan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Run a counter-intelligence scan to identify active threats, deception patterns, and trust erosion across your network.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Threat Level Banner */}
              <div className={`p-4 rounded-lg ${getThreatLevelColor(data.overallThreatLevel)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-bold text-lg">
                      Threat Level: {data.overallThreatLevel?.toUpperCase()}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white/20 border-white/40">
                    {data.activeThreats?.length || 0} Active Threats
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="threats" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="threats">Active Threats</TabsTrigger>
                  <TabsTrigger value="deception">Deception Matrix</TabsTrigger>
                  <TabsTrigger value="trust">Trust Erosion</TabsTrigger>
                  <TabsTrigger value="actions">Counter-Measures</TabsTrigger>
                </TabsList>

                <TabsContent value="threats" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {data.activeThreats?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No active threats detected</p>
                      ) : (
                        data.activeThreats?.map((threat, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 border-l-4 border-red-500">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="destructive">{threat.type}</Badge>
                              <span className="text-sm font-medium">Severity: {threat.severity}/10</span>
                            </div>
                            <p className="text-sm mb-2">{threat.description}</p>
                            <div className="text-xs text-muted-foreground">
                              Actions: {threat.recommendedActions?.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="deception" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Deception Trend:</span>
                      {getTrendIcon(data.deceptionMatrix?.deceptionTrends)}
                      <span className="text-sm text-muted-foreground">
                        {data.deceptionMatrix?.deceptionTrends}
                      </span>
                    </div>
                    <ScrollArea className="h-52">
                      <div className="space-y-2">
                        {data.deceptionMatrix?.confirmedDeceptions?.map((deception, i) => (
                          <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{deception.profileName}</span>
                                <p className="text-xs text-muted-foreground">{deception.deceptionType}</p>
                              </div>
                              <Badge variant="destructive">
                                Trust Impact: {deception.trustImpact}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="trust" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {data.trustErosionMap?.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.profileName}</span>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(item.trustTrend)}
                              <Badge variant={item.interventionUrgency === 'immediate' ? 'destructive' : 'secondary'}>
                                {item.interventionUrgency}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={100 - item.erosionRate} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-12">
                              -{item.erosionRate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="actions" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {data.counterSurveillanceRecommendations?.map((rec, i) => (
                        <div key={i} className={`p-3 rounded-lg ${
                          rec.priority === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                          rec.priority === 'high' ? 'bg-orange-500/10 border border-orange-500/20' :
                          'bg-muted/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Lock className="h-4 w-4" />
                            <Badge variant="outline">{rec.priority}</Badge>
                          </div>
                          <p className="text-sm font-medium">{rec.action}</p>
                          <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
