import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Play, Pause, Settings, CheckCircle2, XCircle, 
  Clock, Zap, TrendingUp, AlertTriangle, RotateCcw 
} from 'lucide-react';
import { useAutonomousOperations } from '@/hooks/intelligence/useAutonomousOperations';
import { formatDistanceToNow } from 'date-fns';

export function AutonomousOperationsPanel() {
  const { 
    campaigns, 
    executions,
    isLoading,
    activeCampaigns: activeList,
    overallSuccessRate,
  } = useAutonomousOperations();

  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Bot className="h-8 w-8 animate-pulse text-blue-400" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const recentExecutions = executions?.slice(0, 10) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Campaigns */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Bot className="h-5 w-5" />
            Active Autonomous Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activeList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active campaigns</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Create Campaign
                  </Button>
                </div>
              ) : (
                activeList.map((campaign) => (
                  <Card 
                    key={campaign.id} 
                    className={`cursor-pointer transition-all ${
                      selectedCampaign === campaign.id 
                        ? 'border-blue-500/50 bg-blue-500/10' 
                        : 'hover:border-blue-500/30'
                    }`}
                    onClick={() => setSelectedCampaign(campaign.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{campaign.campaignName}</h4>
                          <p className="text-xs text-muted-foreground">{campaign.objective}</p>
                        </div>
                        <Badge variant="outline" className={campaign.isActive ? 'border-green-500/50 text-green-400' : ''}>
                          {campaign.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Phase</p>
                          <p className="text-sm font-medium">{campaign.currentPhase || 'Initial'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                          <p className="text-sm font-medium text-green-400">
                            {((campaign.successRate || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Actions</p>
                          <p className="text-sm font-medium">
                            {campaign.actionsToday || 0}/{campaign.maxDailyActions || 10}
                          </p>
                        </div>
                      </div>
                      
                      <Progress 
                        value={(campaign.phaseProgress || 0) * 100} 
                        className="h-2 mb-2" 
                      />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Phase Progress</span>
                        <span>{((campaign.phaseProgress || 0) * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="ghost" className="flex-1">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1">
                          {campaign.isActive ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Recent Executions */}
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-400 text-sm">
              <Zap className="h-4 w-4" />
              Recent Agent Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {recentExecutions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent executions
                  </p>
                ) : (
                  recentExecutions.map((exec) => (
                    <div 
                      key={exec.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className={`p-1.5 rounded-full ${getStatusColor(exec.outcome || 'pending')}`}>
                        {exec.outcome === 'success' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : exec.outcome === 'failed' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{exec.actionTaken}</p>
                        <p className="text-xs text-muted-foreground">
                          {exec.agentType} • {exec.executionTimeMs || 0}ms
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {exec.executedAt && formatDistanceToNow(new Date(exec.executedAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Overall Stats */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Overall Success Rate</span>
                  <Badge variant="outline" className="text-xs">
                    {(overallSuccessRate * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={overallSuccessRate * 100} className="h-1.5" />
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Active Campaigns</span>
                  <span className="text-sm font-medium">{activeList.length}</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Executions</span>
                  <span className="text-sm font-medium">{executions?.length || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start">
                <RotateCcw className="h-3 w-3 mr-2" />
                Retry Failed Actions
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Pause className="h-3 w-3 mr-2" />
                Pause All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
