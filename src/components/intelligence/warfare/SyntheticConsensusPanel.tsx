import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, TrendingUp, Eye, Plus, Play } from 'lucide-react';
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
    generateContent,
    isGenerating,
  } = useSyntheticConsensus();

  const [campaignName, setCampaignName] = useState('');
  const [targetNarrative, setTargetNarrative] = useState('');
  const [platformTargets, setPlatformTargets] = useState<string[]>([]);

  const platforms = ['Twitter/X', 'Reddit', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube'];

  const handleCreateCampaign = () => {
    if (!campaignName.trim() || !targetNarrative.trim()) return;
    
    createCampaign({
      campaignName,
      targetNarrative,
      platformTargets,
    });
    
    setCampaignName('');
    setTargetNarrative('');
    setPlatformTargets([]);
  };

  const togglePlatform = (platform: string) => {
    setPlatformTargets(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getStatusColor = (status: string) => {
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
                            {campaign.target_narrative}
                          </p>
                        </div>
                        <Badge className={getStatusColor(campaign.status || 'planning')}>
                          {campaign.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(campaign.platform_targets as string[] || []).map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <p className="text-lg font-bold">{campaign.persona_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Personas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{campaign.content_generated || 0}</p>
                          <p className="text-xs text-muted-foreground">Content</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{campaign.engagement_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Engagements</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Perceived Consensus</span>
                          <span>{Math.round((campaign.perceived_consensus || 0) * 100)}%</span>
                        </div>
                        <Progress value={(campaign.perceived_consensus || 0) * 100} className="h-2" />
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => generateContent({ campaignId: campaign.id, count: 5 })}
                          disabled={isGenerating}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Generate Content
                        </Button>
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
                <label className="text-sm font-medium mb-2 block">Target Narrative</label>
                <Textarea
                  placeholder="The consensus you want to manufacture..."
                  value={targetNarrative}
                  onChange={(e) => setTargetNarrative(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Platform Targets</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant={platformTargets.includes(platform) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateCampaign} 
                disabled={isCreating || !campaignName.trim() || !targetNarrative.trim()}
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
            <p className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + (c.persona_count || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Personas</p>
          </div>
          <div className="text-center">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-violet-400" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + (c.content_generated || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Content Pieces</p>
          </div>
          <div className="text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold">
              {Math.round(campaigns.reduce((acc, c) => acc + (c.perceived_consensus || 0), 0) / Math.max(campaigns.length, 1) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Consensus</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
