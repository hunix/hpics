import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, TrendingUp, Users, Zap, Plus, Play } from 'lucide-react';
import { useMemeticEngineering } from '@/hooks/intelligence/useMemeticEngineering';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MemeticEngineeringPanelProps {
  profileId?: string;
}

export function MemeticEngineeringPanel({ profileId }: MemeticEngineeringPanelProps) {
  const {
    campaigns,
    isLoading,
    analyzeMeme,
    isAnalyzing,
    analysisResult,
    createCampaign,
    isCreating,
    simulateTrajectory,
    calculateR0,
  } = useMemeticEngineering();

  const [campaignName, setCampaignName] = useState('');
  const [coreNarrative, setCoreNarrative] = useState('');
  const [targetEmotion, setTargetEmotion] = useState('outrage');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const handleCreateCampaign = () => {
    if (!campaignName.trim() || !coreNarrative.trim()) return;
    
    createCampaign({
      campaignName,
      coreNarrative,
      memeContent: { emotion: targetEmotion },
      susceptiblePopulation: 10000,
    });
    
    setCampaignName('');
    setCoreNarrative('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'viral': return 'bg-violet-500/20 text-violet-400';
      case 'planning': return 'bg-amber-500/20 text-amber-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const campaign = campaigns.find(c => c.id === selectedCampaign);
  const trajectoryData = campaign ? simulateTrajectory(campaign, 30) : [];

  return (
    <Card className="border-violet-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <CardTitle>Memetic Engineering Lab</CardTitle>
          </div>
          <Badge variant="outline" className="border-violet-500/50">
            {campaigns.length} Campaigns
          </Badge>
        </div>
        <CardDescription>
          Viral idea propagation with SIR epidemiological modeling
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No memetic campaigns yet. Create one to begin viral engineering.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => {
                  const r0 = calculateR0(campaign.infection_rate || 0.15, campaign.recovery_rate || 0.1);
                  return (
                    <Card 
                      key={campaign.id} 
                      className={`bg-background/50 cursor-pointer transition-colors ${selectedCampaign === campaign.id ? 'ring-2 ring-violet-500' : ''}`}
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{campaign.campaign_name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {campaign.core_narrative}
                            </p>
                          </div>
                          <Badge className={getStatusColor(campaign.status || 'planning')}>
                            {campaign.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-bold">{campaign.current_reach?.toLocaleString() || 0}</p>
                            <p className="text-xs text-muted-foreground">Infected</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{r0.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">R₀</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{campaign.susceptible_population?.toLocaleString() || 0}</p>
                            <p className="text-xs text-muted-foreground">Target Pop</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Saturation</span>
                            <span>{Math.round(((campaign.current_reach || 0) / (campaign.susceptible_population || 1)) * 100)}%</span>
                          </div>
                          <Progress 
                            value={((campaign.current_reach || 0) / (campaign.susceptible_population || 1)) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="simulation" className="space-y-4">
            {!selectedCampaign ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a campaign to view its propagation simulation.
              </div>
            ) : (
              <>
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">30-Day Propagation Forecast</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trajectoryData}>
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="susceptible" 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeWidth={2}
                            dot={false}
                            name="Susceptible"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="infected" 
                            stroke="hsl(142, 76%, 36%)" 
                            strokeWidth={2}
                            dot={false}
                            name="Infected"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="recovered" 
                            stroke="hsl(221, 83%, 53%)" 
                            strokeWidth={2}
                            dot={false}
                            name="Recovered"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-emerald-500/10 border-emerald-500/30">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                      <p className="text-2xl font-bold">
                        {trajectoryData.length > 0 
                          ? Math.max(...trajectoryData.map(d => d.I)).toLocaleString() 
                          : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Peak Infection</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                      <p className="text-2xl font-bold">
                        {trajectoryData.length > 0 
                          ? trajectoryData[trajectoryData.length - 1].R.toLocaleString() 
                          : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Final Reach</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Campaign Name</label>
                <Input
                  placeholder="e.g., Operation Mind Share"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Core Narrative</label>
                <Textarea
                  placeholder="The central idea you want to propagate..."
                  value={coreNarrative}
                  onChange={(e) => setCoreNarrative(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Emotion</label>
                <Select value={targetEmotion} onValueChange={setTargetEmotion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outrage">Outrage</SelectItem>
                    <SelectItem value="fear">Fear</SelectItem>
                    <SelectItem value="hope">Hope</SelectItem>
                    <SelectItem value="pride">Pride</SelectItem>
                    <SelectItem value="disgust">Disgust</SelectItem>
                    <SelectItem value="awe">Awe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateCampaign} 
                disabled={isCreating || !campaignName.trim() || !coreNarrative.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Launch Memetic Campaign'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <Sparkles className="h-5 w-5 mx-auto mb-1 text-violet-400" />
            <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + (c.current_reach || 0), 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Reach</p>
          </div>
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-400" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + (c.susceptible_population || 0), 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Target Pop</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
