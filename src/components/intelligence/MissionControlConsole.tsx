/**
 * Mission Control Console
 * Unified tactical operations center for AGIS Phase 2 campaigns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Brain,
  Users,
  Clock,
  Zap,
  Activity,
  LayoutGrid,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useMissionControl, type ActiveOperation } from '@/hooks/intelligence/useMissionControl';
import { toast } from 'sonner';

interface MissionControlConsoleProps {
  profileId?: string;
}

export function MissionControlConsole({ profileId }: MissionControlConsoleProps) {
  const { 
    isLoading, 
    operations, 
    stats,
    refreshOperations,
    pauseOperation,
    resumeOperation,
    completeOperation
  } = useMissionControl(profileId);

  const [activeTab, setActiveTab] = useState('active');

  const handlePause = async (op: ActiveOperation) => {
    const success = await pauseOperation(op.id, op.type);
    if (success) {
      toast.success(`${op.type} operation paused`);
    }
  };

  const handleResume = async (op: ActiveOperation) => {
    const success = await resumeOperation(op.id, op.type);
    if (success) {
      toast.success(`${op.type} operation resumed`);
    }
  };

  const handleComplete = async (op: ActiveOperation) => {
    const success = await completeOperation(op.id, op.type);
    if (success) {
      toast.success(`${op.type} operation completed`);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'negotiation': return Target;
      case 'nudge': return LayoutGrid;
      case 'memory': return Brain;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-amber-500';
      case 'pending': return 'bg-blue-500';
      case 'completed': return 'bg-slate-500';
      default: return 'bg-muted';
    }
  };

  const activeOps = operations.filter(op => op.status === 'active');
  const pausedOps = operations.filter(op => op.status === 'paused');
  const pendingOps = operations.filter(op => op.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <Play className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mission Control</h2>
            <p className="text-sm text-muted-foreground">Unified Operations Center</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshOperations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Paused</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.paused}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Operations Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Active ({activeOps.length})
          </TabsTrigger>
          <TabsTrigger value="paused" className="flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Paused ({pausedOps.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending ({pendingOps.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            All ({operations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <OperationsList 
            operations={activeOps} 
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleComplete}
            getIcon={getOperationIcon}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="paused" className="mt-4">
          <OperationsList 
            operations={pausedOps}
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleComplete}
            getIcon={getOperationIcon}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <OperationsList 
            operations={pendingOps}
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleComplete}
            getIcon={getOperationIcon}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <OperationsList 
            operations={operations}
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleComplete}
            getIcon={getOperationIcon}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Launch */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Launch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col gap-1">
              <Target className="h-4 w-4 text-red-500" />
              <span className="text-xs">Negotiation</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col gap-1">
              <LayoutGrid className="h-4 w-4 text-orange-500" />
              <span className="text-xs">Nudge Campaign</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col gap-1">
              <Brain className="h-4 w-4 text-cyan-500" />
              <span className="text-xs">Memory</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface OperationsListProps {
  operations: ActiveOperation[];
  onPause: (op: ActiveOperation) => void;
  onResume: (op: ActiveOperation) => void;
  onComplete: (op: ActiveOperation) => void;
  getIcon: (type: string) => any;
  getStatusColor: (status: string) => string;
}

function OperationsList({ 
  operations, 
  onPause, 
  onResume, 
  onComplete,
  getIcon,
  getStatusColor 
}: OperationsListProps) {
  if (operations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No operations in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {operations.map((op) => {
          const Icon = getIcon(op.type);
          return (
            <Card key={`${op.type}-${op.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon & Type */}
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{op.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {op.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {op.target || 'No target specified'}
                    </p>
                    {op.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={op.progress} className="h-1" />
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(op.status)}`} />
                    <span className="text-xs capitalize text-muted-foreground">
                      {op.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {op.status === 'active' && (
                      <Button variant="ghost" size="icon" onClick={() => onPause(op)}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {op.status === 'paused' && (
                      <Button variant="ghost" size="icon" onClick={() => onResume(op)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {(op.status === 'active' || op.status === 'paused') && (
                      <Button variant="ghost" size="icon" onClick={() => onComplete(op)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default MissionControlConsole;
