import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Globe,
  Users, 
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Plus,
  Target,
  Zap,
  Radio,
  Share2
} from "lucide-react";
import { useNarrativeControl } from "@/hooks/intelligence/useNarrativeControl";

interface NarrativeControlCenterProps {
  profileId?: string;
}

export function NarrativeControlCenter({ profileId }: NarrativeControlCenterProps) {
  const [activeTab, setActiveTab] = useState("campaigns");
  
  const { 
    campaigns = [], 
    nodes = [], 
    perceptionData = [], 
    isLoading, 
    createCampaign,
    deployCampaign,
    activeCampaigns,
    totalReach,
    avgSentimentShift,
    activeNodes,
  } = useNarrativeControl(profileId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getSentimentColor = (shift: number) => {
    if (shift >= 0.3) return "text-green-500";
    if (shift >= 0) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Radio className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Narrative Control Engine</h2>
            <p className="text-sm text-muted-foreground">
              Multi-platform deployment • Perception warfare • Sentiment optimization
            </p>
          </div>
        </div>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-500">{activeCampaigns?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
              <Radio className="h-8 w-8 text-indigo-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-500">{totalReach?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Total Reach</p>
              </div>
              <Users className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${getSentimentColor(avgSentimentShift || 0)}`}>
                  {avgSentimentShift > 0 ? '+' : ''}{(avgSentimentShift || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Sentiment Shift</p>
              </div>
              <Target className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-500">{activeNodes || 0}</p>
                <p className="text-sm text-muted-foreground">Narrative Nodes</p>
              </div>
              <Share2 className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="nodes" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Narrative Nodes
          </TabsTrigger>
          <TabsTrigger value="perception" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Perception Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No narrative campaigns created yet</p>
                  <p className="text-sm">Create a campaign to begin perception warfare</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{campaign.campaignName}</CardTitle>
                      <Badge className={`${getStatusColor(campaign.status || 'draft')} text-white capitalize`}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.targetNarrative}
                      </p>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Sentiment Shift</span>
                          <span className={`font-medium ${getSentimentColor(campaign.sentimentShift || 0)}`}>
                            {campaign.sentimentShift > 0 ? '+' : ''}{(campaign.sentimentShift || 0).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(Math.abs(campaign.sentimentShift || 0) * 10, 100)} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reach:</span>
                          <span className="ml-1 font-medium">{(campaign.currentReach || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Channels:</span>
                          <span className="ml-1 font-medium">{campaign.deploymentChannels?.length || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(campaign.deploymentChannels || []).slice(0, 3).map((channel, i) => (
                          <Badge key={i} variant="secondary" className="text-xs capitalize">
                            {channel.channel}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {campaign.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => deployCampaign({ campaignId: campaign.id })}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Deploy
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Narrative Nodes & Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {nodes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No narrative nodes created</p>
                    </div>
                  ) : (
                    nodes.map((node) => (
                      <div 
                        key={node.id}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{node.nodeType}</Badge>
                            <Badge variant="secondary">{node.platform}</Badge>
                          </div>
                          <Badge className={`${node.isActive ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                            {node.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm">{node.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Amplification: {Math.round(node.amplificationScore * 100)}%</span>
                          <span>Authenticity: {Math.round(node.authenticityRating * 100)}%</span>
                          <span>Created: {new Date(node.createdAt ?? Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perception" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Perception Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {perceptionData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No perception data collected</p>
                      </div>
                    ) : (
                      perceptionData.map((data) => (
                        <div 
                          key={data.id}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{data.perceptionDimension}</span>
                            <div className="flex items-center gap-1">
                              {(data.currentValue - data.baselineValue) >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`font-medium ${
                                (data.currentValue - data.baselineValue) >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {(data.currentValue - data.baselineValue) > 0 ? '+' : ''}
                                {Math.round((data.currentValue - data.baselineValue) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Current Value</span>
                                <span>{Math.round(data.currentValue * 100)}%</span>
                              </div>
                              <Progress value={data.currentValue * 100} className="h-1" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Target Value</span>
                                <span>{Math.round(data.targetValue * 100)}%</span>
                              </div>
                              <Progress value={data.targetValue * 100} className="h-1" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sentiment Trajectory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sentiment visualization</p>
                    <p className="text-sm">Track perception changes over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
