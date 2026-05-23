import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRelationshipInferences } from '@/hooks/network/useRelationshipInferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch, Users, Target, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export function RelationshipGraphViewer() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inferences');

  const { data: inferences, isLoading } = useRelationshipInferences(50);

  const inferMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('infer-relationships', { fullScan: true, maxDepth: 3 },);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relationship-inferences'] });
      toast.success(`Discovered ${data.total_inferences} new connections`);
    },
    onError: (error) => {
      toast.error(`Failed to run inference: ${error.message}`);
    },
  });

  const transitiveConnections = inferences?.filter(i => i.inference_type === 'transitive_connection') || [];
  const sharedOrgs = inferences?.filter(i => i.inference_type === 'shared_organization') || [];
  const opportunities = inferences?.filter(i => (i.opportunity_score || 0) > 0.7) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Relationship Graph Intelligence
          </CardTitle>
          <CardDescription>
            AI-discovered connections and networking opportunities
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inferMutation.mutate()}
          disabled={inferMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${inferMutation.isPending ? 'animate-spin' : ''}`} />
          {inferMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inferences" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Connections ({transitiveConnections.length})
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              Shared Orgs ({sharedOrgs.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Opportunities ({opportunities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inferences" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {transitiveConnections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No transitive connections discovered yet</p>
                    <p className="text-sm">Run analysis to find hidden connections</p>
                  </div>
                ) : (
                  transitiveConnections.map((inf) => (
                    <div key={inf.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {inf.source_profile?.first_name} {inf.source_profile?.last_name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {inf.target_profile?.first_name} {inf.target_profile?.last_name}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          {inf.path_distance} degrees
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Confidence: {((inf.confidence_score || 0) * 100).toFixed(0)}%</span>
                        <Progress value={(inf.confidence_score || 0) * 100} className="w-24 h-2" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="organizations" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {sharedOrgs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No shared organization connections found</p>
                  </div>
                ) : (
                  sharedOrgs.map((inf) => (
                    <div key={inf.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {inf.source_profile?.first_name} & {inf.target_profile?.first_name}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            Both at {(inf.evidence as any)?.shared_company || 'Same Organization'}
                          </p>
                        </div>
                        <Badge variant="secondary">Colleagues</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {opportunities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No high-value opportunities identified yet</p>
                  </div>
                ) : (
                  opportunities.map((inf) => (
                    <div key={inf.id} className="p-3 border rounded-lg border-primary/20 bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          Connect with {inf.target_profile?.first_name} {inf.target_profile?.last_name}
                        </span>
                        <Badge className="bg-primary">
                          {((inf.opportunity_score || 0) * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inf.opportunity_type === 'strategic_alliance' && '🎯 Strategic Alliance Potential'}
                        {inf.opportunity_type === 'introduction' && '🤝 Introduction Opportunity'}
                        {inf.opportunity_type === 'collaboration' && '💡 Collaboration Potential'}
                      </p>
                      {inf.target_profile?.organization && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Works at {inf.target_profile.organization}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
