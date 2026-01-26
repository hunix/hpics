/**
 * GPU Cluster Panel
 * 
 * Real-time dashboard showing GPU fleet status,
 * VRAM utilization, and inference capabilities.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Cpu, 
  Activity, 
  Thermometer, 
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { localAI, type LocalAIStatus, type GPUClusterStatus } from '@/lib/localAI';
import { cn } from '@/lib/utils';

interface GPUClusterPanelProps {
  className?: string;
  compact?: boolean;
}

export function GPUClusterPanel({ className, compact = false }: GPUClusterPanelProps) {
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [gpuCluster, setGpuCluster] = useState<GPUClusterStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = localAI.onStatusChange(setStatus);
    
    // Initial GPU cluster fetch
    fetchGPUStatus();
    
    return unsubscribe;
  }, []);

  const fetchGPUStatus = async () => {
    setIsRefreshing(true);
    try {
      const [aiStatus, clusterStatus] = await Promise.all([
        localAI.checkAllServices(),
        localAI.getGPUClusterStatus(),
      ]);
      setStatus(aiStatus);
      setGpuCluster(clusterStatus);
    } catch (error) {
      console.error('[GPUCluster] Failed to fetch status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const anyServiceAvailable = status && (
    status.llm.available || 
    status.whisper.available || 
    status.vectorStore.available || 
    status.videoAnalytics.available
  );

  if (compact) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Local AI Cluster</span>
            </div>
            <div className="flex items-center gap-2">
              {anyServiceAvailable ? (
                <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {gpuCluster && gpuCluster.gpus.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {gpuCluster.totalVramGb.toFixed(0)}GB VRAM
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            Local GPU Cluster
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchGPUStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ServiceStatusCard
            name="LLM"
            available={status?.llm.available || false}
            detail={status?.llm.currentModel || 'Not configured'}
            icon={<Cpu className="h-4 w-4" />}
          />
          <ServiceStatusCard
            name="Whisper"
            available={status?.whisper.available || false}
            detail={`${status?.whisper.activeJobs || 0} active`}
            icon={<Activity className="h-4 w-4" />}
          />
          <ServiceStatusCard
            name="Vectors"
            available={status?.vectorStore.available || false}
            detail={`${status?.vectorStore.totalVectors || 0} vectors`}
            icon={<Server className="h-4 w-4" />}
          />
          <ServiceStatusCard
            name="Video"
            available={status?.videoAnalytics.available || false}
            detail={`${status?.videoAnalytics.activeStreams || 0} streams`}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* GPU Cards */}
        {gpuCluster && gpuCluster.gpus.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">GPU Fleet ({gpuCluster.gpus.length})</h4>
            <div className="grid gap-2">
              {gpuCluster.gpus.map((gpu) => (
                <div 
                  key={gpu.index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Server className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{gpu.name}</p>
                      <p className="text-xs text-muted-foreground">GPU {gpu.index}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* VRAM Usage */}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">VRAM</p>
                      <p className="text-sm font-medium">
                        {((gpu.vramUsed / gpu.vramTotal) * 100).toFixed(0)}%
                      </p>
                    </div>
                    {/* Temperature */}
                    <div className="flex items-center gap-1">
                      <Thermometer className={cn(
                        'h-4 w-4',
                        gpu.temperature > 80 ? 'text-red-500' :
                        gpu.temperature > 60 ? 'text-yellow-500' : 'text-green-500'
                      )} />
                      <span className="text-sm">{gpu.temperature}°C</span>
                    </div>
                    {/* Utilization */}
                    <div className="w-20">
                      <Progress value={gpu.utilization} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total VRAM */}
        {gpuCluster && gpuCluster.totalVramGb > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Compute Power</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{gpuCluster.totalVramGb.toFixed(0)} GB</p>
              <p className="text-xs text-muted-foreground">VRAM Available</p>
            </div>
          </div>
        )}

        {/* No GPUs detected */}
        {(!gpuCluster || gpuCluster.gpus.length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <Server className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No local GPU servers detected</p>
            <p className="text-xs mt-1">
              Start Ollama, Faster-Whisper, or Faiss server to enable local AI
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceStatusCard({ 
  name, 
  available, 
  detail, 
  icon 
}: { 
  name: string; 
  available: boolean; 
  detail: string; 
  icon: React.ReactNode;
}) {
  return (
    <div className={cn(
      'p-3 rounded-lg border',
      available 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{name}</span>
        {available ? (
          <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />
        ) : (
          <XCircle className="h-3 w-3 text-muted-foreground ml-auto" />
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">{detail}</p>
    </div>
  );
}
