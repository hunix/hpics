import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Eye, Plus } from 'lucide-react';
import { useSyntheticConsensus } from '@/hooks/intelligence/useSyntheticConsensus';

interface SyntheticConsensusPanelProps {
  profileId?: string;
}

export function SyntheticConsensusPanel({ profileId }: SyntheticConsensusPanelProps) {
  const {
    campaigns,
    isLoading,
    createCampaign,
    isCreating,
    generateStrategy,
    isGenerating,
    calculateConsensusGap,
  } = useSyntheticConsensus();

  const [campaignName, setCampaignName] = useState('');
  const [consensusNarrative, setConsensusNarrative] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);

  const audienceOptions = ['General Public', 'Industry Leaders', 'Policy Makers', 'Media', 'Academia', 'Youth'];

  const handleCreateCampaign = () => {
    if (!campaignName.trim() || !consensusNarrative.trim()) return;
    
    createCampaign({
      name: campaignName,
      consensusNarrative,
      targetAudience,
    });
    
    setCampaignName('');
    setConsensusNarrative('');
    setTargetAudience([]);
  };

  const toggleAudience = (audience: string) => {
    setTargetAudience(prev => 
      prev.includes(audience) 
        ? prev.filter(a => a !== audience)
        : [...prev, audience]
    );
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'saturated': return 'bg-violet-500/20 text-violet-400';
      case 'planning': return 'bg-amber-500/20 text-amber-400';
      case 'paused': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <CardTitle>Synthetic Consensus Generator</CardTitle>
          </div>
          <Badge variant="outline" className="border-blue-500/50">
            {campaigns.length} Campaigns
          </Badge>
        </div>
        <CardDescription>
          Manufacture perception of widespread agreement through coordinated messaging
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
            <TabsTrigger value="create">New Campaign</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No consensus campaigns yet. Create one to begin manufacturing agreement.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{campaign.campaign_name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {campaign.consensus_narrative}
                          </p>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status || 'planning'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(campaign.astroturf_networks || []).map((network) => (
                          <Badge key={network} variant="outline" className="text-xs">
                            {network}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center mb-3">
                        <div>
                          <p className="text-lg font-bold">{campaign.perceived_consensus_level || 0}%</p>
                          <p className="text-xs text-muted-foreground">Perceived</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{campaign.actual_consensus_level || 0}%</p>
                          <p className="text-xs text-muted-foreground">Actual</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Consensus Gap</span>
                          <span>{calculateConsensusGap(campaign)}%</span>
                        </div>
                        <Progress 
                          value={Math.abs(calculateConsensusGap(campaign))} 
                          className="h-2" 
                        />
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        <span>Effectiveness: {campaign.effectiveness_score || 0}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Campaign Name</label>
                <Input
                  placeholder="e.g., Operation Echo Chamber"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Consensus Narrative</label>
                <Textarea
                  placeholder="The consensus you want to manufacture..."
                  value={consensusNarrative}
                  onChange={(e) => setConsensusNarrative(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {audienceOptions.map((audience) => (
                    <Badge
                      key={audience}
                      variant={targetAudience.includes(audience) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleAudience(audience)}
                    >
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateCampaign} 
                disabled={isCreating || !campaignName.trim() || !consensusNarrative.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Launch Consensus Campaign'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-400" />
            <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-violet-400" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + (c.astroturf_networks?.length || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Networks</p>
          </div>
          <div className="text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold">
              {Math.round(campaigns.reduce((acc, c) => acc + (c.perceived_consensus_level || 0), 0) / Math.max(campaigns.length, 1))}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Perception</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
