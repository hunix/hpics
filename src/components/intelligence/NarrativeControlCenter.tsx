import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newNarrative, setNewNarrative] = useState("");
  
  const { 
    campaigns, 
    nodes, 
    perceptionData, 
    isLoading, 
    createCampaign,
    deployCampaign,
    pauseCampaign
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

  const getPenetrationColor = (rate: number) => {
    if (rate >= 0.7) return "text-green-500";
    if (rate >= 0.4) return "text-yellow-500";
    return "text-orange-500";
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalReach = campaigns.reduce((acc, c) => acc + (c.reach_count || 0), 0);
  const avgPenetration = campaigns.length > 0 
    ? campaigns.reduce((acc, c) => acc + (c.penetration_rate || 0), 0) / campaigns.length 
    : 0;

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
                <p className="text-3xl font-bold text-indigo-500">{activeCampaigns.length}</p>
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
                <p className="text-3xl font-bold text-blue-500">{totalReach.toLocaleString()}</p>
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
                <p className={`text-3xl font-bold ${getPenetrationColor(avgPenetration)}`}>
                  {Math.round(avgPenetration * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Penetration</p>
              </div>
              <Target className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-500">{nodes.length}</p>
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
                      <CardTitle className="text-base">{campaign.campaign_name}</CardTitle>
                      <Badge className={`${getStatusColor(campaign.status || 'draft')} text-white capitalize`}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.target_narrative}
                      </p>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Penetration Rate</span>
                          <span className={`font-medium ${getPenetrationColor(campaign.penetration_rate || 0)}`}>
                            {Math.round((campaign.penetration_rate || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(campaign.penetration_rate || 0) * 100} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reach:</span>
                          <span className="ml-1 font-medium">{(campaign.reach_count || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Engagement:</span>
                          <span className="ml-1 font-medium">{(campaign.engagement_count || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(campaign.platforms as string[] || []).map((platform, i) => (
                          <Badge key={i} variant="secondary" className="text-xs capitalize">
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {campaign.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => pauseCampaign(campaign.id)}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => deployCampaign(campaign.id)}
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
                            <Badge variant="outline">{node.node_type}</Badge>
                            <Badge variant="secondary">{node.platform}</Badge>
                          </div>
                          <Badge className={`${getStatusColor(node.status || 'pending')} text-white`}>
                            {node.status}
                          </Badge>
                        </div>
                        <p className="text-sm">{node.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Reach: {(node.reach || 0).toLocaleString()}</span>
                          <span>Engagement: {(node.engagement || 0).toLocaleString()}</span>
                          {node.scheduled_at && (
                            <span>Scheduled: {new Date(node.scheduled_at).toLocaleDateString()}</span>
                          )}
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
                            <span className="font-medium">{data.metric_type}</span>
                            <div className="flex items-center gap-1">
                              {(data.sentiment_score || 0) >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`font-medium ${
                                (data.sentiment_score || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {data.sentiment_score > 0 ? '+' : ''}{Math.round((data.sentiment_score || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Visibility</span>
                                <span>{Math.round((data.visibility_score || 0) * 100)}%</span>
                              </div>
                              <Progress value={(data.visibility_score || 0) * 100} className="h-1" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Influence</span>
                                <span>{Math.round((data.influence_score || 0) * 100)}%</span>
                              </div>
                              <Progress value={(data.influence_score || 0) * 100} className="h-1" />
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
