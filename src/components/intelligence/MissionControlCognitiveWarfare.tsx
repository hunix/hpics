import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Swords, Play, Pause, CheckCircle, AlertTriangle, 
  Target, Users, Shield, Dna, MessageSquarePlus,
  ChevronRight, Clock, TrendingUp, BarChart3
} from 'lucide-react';
import { useSemanticWarfare } from '@/hooks/intelligence/useSemanticWarfare';
import { useMemeticEngineering } from '@/hooks/intelligence/useMemeticEngineering';
import { useSyntheticConsensus } from '@/hooks/intelligence/useSyntheticConsensus';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  type: 'semantic' | 'memetic' | 'consensus' | 'mice' | 'elicitation';
  status: 'planning' | 'active' | 'paused' | 'completed';
  progress: number;
  target?: string;
  startedAt?: Date;
  metrics: {
    reach?: number;
    engagement?: number;
    success?: number;
  };
}

const CAMPAIGN_TYPES = {
  semantic: { icon: Swords, label: 'Semantic Warfare', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  memetic: { icon: Dna, label: 'Memetic Engineering', color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
  consensus: { icon: Users, label: 'Synthetic Consensus', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  mice: { icon: Target, label: 'MICE Operation', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  elicitation: { icon: MessageSquarePlus, label: 'Elicitation Campaign', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
};

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' },
  paused: { label: 'Paused', color: 'bg-amber-500/20 text-amber-400' },
  completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-400' },
};

export function MissionControlCognitiveWarfare() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  const { operations: semanticOps } = useSemanticWarfare();
  const { campaigns: memeticCampaigns } = useMemeticEngineering();
  const { campaigns: consensusCampaigns } = useSyntheticConsensus();

  // Aggregate all campaigns
  const allCampaigns: Campaign[] = [
    ...(semanticOps || []).map(op => ({
      id: op.id,
      name: op.operation_name || 'Untitled Operation',
      type: 'semantic' as const,
      status: (op.status || 'planning') as Campaign['status'],
      progress: op.shift_progress || 0,
      target: op.target_term,
      startedAt: op.created_at ? new Date(op.created_at) : undefined,
      metrics: {
        success: op.shift_progress || 0,
      },
    })),
    ...(memeticCampaigns || []).map((c: { id: string; campaign_name?: string; status?: string; current_reach?: number; created_at?: string }) => ({
      id: c.id,
      name: c.campaign_name || 'Untitled Campaign',
      type: 'memetic' as const,
      status: (c.status || 'planning') as Campaign['status'],
      progress: Math.min(100, ((c.current_reach || 0) / 10000) * 100),
      startedAt: c.created_at ? new Date(c.created_at) : undefined,
      metrics: {
        reach: c.current_reach || 0,
      },
    })),
    ...(consensusCampaigns || []).map((c: { id: string; campaign_name?: string; status?: string; perceived_consensus?: number; actual_consensus?: number; created_at?: string }) => ({
      id: c.id,
      name: c.campaign_name || 'Untitled Campaign',
      type: 'consensus' as const,
      status: (c.status || 'planning') as Campaign['status'],
      progress: ((c.perceived_consensus || 0) + (c.actual_consensus || 0)) / 2 * 100,
      startedAt: c.created_at ? new Date(c.created_at) : undefined,
      metrics: {
        engagement: c.perceived_consensus || 0,
      },
    })),
  ];

  const activeCampaigns = allCampaigns.filter(c => c.status === 'active');
  const plannedCampaigns = allCampaigns.filter(c => c.status === 'planning');
  const pausedCampaigns = allCampaigns.filter(c => c.status === 'paused');
  const completedCampaigns = allCampaigns.filter(c => c.status === 'completed');

  const launchCampaign = (type: Campaign['type']) => {
    toast.info(`Launching new ${CAMPAIGN_TYPES[type].label}...`);
    // This would open a campaign creation modal
  };

  const pauseCampaign = (id: string) => {
    toast.success('Campaign paused');
  };

  const resumeCampaign = (id: string) => {
    toast.success('Campaign resumed');
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const typeConfig = CAMPAIGN_TYPES[campaign.type];
    const statusConfig = STATUS_CONFIG[campaign.status];
    const TypeIcon = typeConfig.icon;

    return (
      <Card 
        className={`bg-background/50 hover:bg-background/80 transition-colors cursor-pointer ${
          selectedCampaign === campaign.id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => setSelectedCampaign(campaign.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
              </div>
              <div>
                <h4 className="font-medium">{campaign.name}</h4>
                <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
              </div>
            </div>
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
          </div>

          {campaign.target && (
            <p className="text-sm text-muted-foreground mb-2">
              Target: <span className="font-medium">{campaign.target}</span>
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(campaign.progress)}%</span>
            </div>
            <Progress value={campaign.progress} className="h-1.5" />
          </div>

          {campaign.status === 'active' && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  pauseCampaign(campaign.id);
                }}
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  // View details
                }}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {campaign.status === 'paused' && (
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation();
                resumeCampaign(campaign.id);
              }}
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <CardTitle>Cognitive Warfare Mission Control</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-400">
              {activeCampaigns.length} Active
            </Badge>
            <Badge variant="outline" className="text-amber-400">
              {pausedCampaigns.length} Paused
            </Badge>
          </div>
        </div>
        <CardDescription>
          Unified command center for cross-domain cognitive warfare operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              Active ({activeCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="planning">
              Planning ({plannedCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused ({pausedCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="launch">
              Launch New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active campaigns</p>
                <p className="text-xs mt-1">Launch a new campaign to begin operations</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid gap-4">
                  {activeCampaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            {plannedCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No campaigns in planning</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid gap-4">
                  {plannedCampaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            {pausedCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pause className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No paused campaigns</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid gap-4">
                  {pausedCampaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="launch" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(CAMPAIGN_TYPES) as [Campaign['type'], typeof CAMPAIGN_TYPES[keyof typeof CAMPAIGN_TYPES]][]).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Card 
                    key={type}
                    className={`${config.bgColor} border-0 cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => launchCampaign(type)}
                  >
                    <CardContent className="p-6 text-center">
                      <Icon className={`h-8 w-8 mx-auto mb-3 ${config.color}`} />
                      <h4 className="font-semibold mb-1">{config.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        Click to launch
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats */}
            <Card className="bg-background/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Campaign Performance
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{allCampaigns.length}</p>
                    <p className="text-xs text-muted-foreground">Total Campaigns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{completedCampaigns.length}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-violet-400">
                      {allCampaigns.length > 0 
                        ? Math.round(allCampaigns.reduce((acc, c) => acc + c.progress, 0) / allCampaigns.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">
                      {allCampaigns.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Running Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
