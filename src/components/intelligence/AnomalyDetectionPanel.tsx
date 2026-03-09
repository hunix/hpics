/**
 * Anomaly Detection Panel (v3.9.0)
 * Advanced behavioral and communication anomaly detection with ML-powered insights
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  TrendingDown, 
  TrendingUp,
  Eye,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Anomaly {
  id: string;
  profileId: string | null;
  profileName?: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  confidence: number;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  metadata: Record<string, unknown>;
}

export function AnomalyDetectionPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [isScanning, setIsScanning] = useState(false);

  const anomaliesQuery = useQuery({
    queryKey: ['anomalies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavioral_anomalies')
        .select(`
          *,
          profiles:profile_id (first_name, last_name)
        `)
        .order('detected_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        profileId: row.profile_id,
        profileName: row.profiles ? `${row.profiles.first_name || ''} ${row.profiles.last_name || ''}`.trim() : 'Unknown',
        anomalyType: row.anomaly_type,
        severity: row.severity || 'medium',
        description: row.description || 'Anomaly detected',
        detectedAt: row.detected_at,
        confidence: row.confidence_score || 0.5,
        status: row.status || 'new',
        metadata: row.metadata || {},
      })) as Anomaly[];
    },
    enabled: !!user,
  });

  const updateAnomalyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
       const { error } = await supabase
        .from('behavioral_anomalies')
        .update({ is_resolved: status === 'resolved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      toast.success('Anomaly status updated');
    },
  });

  const runAnomalyScan = async () => {
    setIsScanning(true);
    try {
      const { error } = await supabase.functions.invoke('detect-communication-anomalies', {
        body: { scanAll: true },
      });
      if (error) throw error;
      toast.success('Anomaly scan completed');
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    } catch (err) {
      toast.error('Failed to run anomaly scan');
    } finally {
      setIsScanning(false);
    }
  };

  const anomalies = anomaliesQuery.data || [];
  const activeAnomalies = anomalies.filter(a => a.status === 'new' || a.status === 'investigating');
  const resolvedAnomalies = anomalies.filter(a => a.status === 'resolved' || a.status === 'dismissed');

  const severityCounts = {
    critical: activeAnomalies.filter(a => a.severity === 'critical').length,
    high: activeAnomalies.filter(a => a.severity === 'high').length,
    medium: activeAnomalies.filter(a => a.severity === 'medium').length,
    low: activeAnomalies.filter(a => a.severity === 'low').length,
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-500 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    communication_drop: <TrendingDown className="h-4 w-4" />,
    sentiment_shift: <Activity className="h-4 w-4" />,
    behavior_change: <Zap className="h-4 w-4" />,
    trust_erosion: <Shield className="h-4 w-4" />,
    engagement_spike: <TrendingUp className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-500">{severityCounts.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-orange-500">{severityCounts.high}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium</p>
                <p className="text-2xl font-bold text-amber-500">{severityCounts.medium}</p>
              </div>
              <Activity className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-blue-500">{severityCounts.low}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={runAnomalyScan} 
              disabled={isScanning}
              className="w-full h-full"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isScanning && "animate-spin")} />
              {isScanning ? 'Scanning...' : 'Run Scan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Detected Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active ({activeAnomalies.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedAnomalies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {activeAnomalies.length > 0 ? (
                    activeAnomalies.map(anomaly => (
                      <AnomalyCard 
                        key={anomaly.id} 
                        anomaly={anomaly}
                        severityColors={severityColors}
                        typeIcons={typeIcons}
                        onStatusChange={(status) => updateAnomalyStatus.mutate({ id: anomaly.id, status })}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No active anomalies detected</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resolved">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {resolvedAnomalies.length > 0 ? (
                    resolvedAnomalies.map(anomaly => (
                      <AnomalyCard 
                        key={anomaly.id} 
                        anomaly={anomaly}
                        severityColors={severityColors}
                        typeIcons={typeIcons}
                        onStatusChange={(status) => updateAnomalyStatus.mutate({ id: anomaly.id, status })}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4" />
                      <p>No resolved anomalies</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface AnomalyCardProps {
  anomaly: Anomaly;
  severityColors: Record<string, string>;
  typeIcons: Record<string, React.ReactNode>;
  onStatusChange: (status: string) => void;
}

function AnomalyCard({ anomaly, severityColors, typeIcons, onStatusChange }: AnomalyCardProps) {
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      anomaly.status === 'resolved' || anomaly.status === 'dismissed' 
        ? "bg-muted/20 opacity-70" 
        : "bg-card"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", severityColors[anomaly.severity])}>
            {typeIcons[anomaly.anomalyType] || <AlertTriangle className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{anomaly.profileName || 'Unknown Contact'}</span>
              <Badge variant="outline" className={severityColors[anomaly.severity]}>
                {anomaly.severity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {anomaly.anomalyType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={anomaly.confidence * 100} className="w-16 h-2" />
          <span className="text-xs text-muted-foreground">{(anomaly.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <p className="text-sm mb-3">{anomaly.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(anomaly.detectedAt).toLocaleString()}
        </span>
        {anomaly.status !== 'resolved' && anomaly.status !== 'dismissed' && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStatusChange('investigating')}
              disabled={anomaly.status === 'investigating'}
            >
              <Eye className="h-3 w-3 mr-1" />
              Investigate
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStatusChange('resolved')}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
