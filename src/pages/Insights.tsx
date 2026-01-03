import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Sparkles, TrendingUp, Users, Zap, ArrowRight, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AIUsageLogs } from '@/components/ai/AIUsageLogs';

export default function Insights() {
  const { user } = useAuth();

  const { data: recentAnalyses } = useQuery({
    queryKey: ['recent-analyses', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analyses')
        .select('*, profiles(first_name, last_name)')
        .order('generated_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-insights', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type')
        .order('updated_at', { ascending: false })
        .limit(6);
      return data ?? [];
    },
    enabled: !!user,
  });

  const analysisTypeLabels: Record<string, string> = {
    personality: 'Personality Profile',
    sentiment: 'Sentiment Analysis',
    playbook: 'Social Playbook',
    relationship_score: 'Relationship Score',
  };

  const analysisTypeColors: Record<string, string> = {
    personality: 'bg-blue-100 text-blue-800',
    sentiment: 'bg-green-100 text-green-800',
    playbook: 'bg-purple-100 text-purple-800',
    relationship_score: 'bg-orange-100 text-orange-800',
  };

  return (
    <AppLayout title="AI Insights">
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            AI Usage & Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">AI-Powered Relationship Intelligence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get deep insights into your relationships. Open any contact and click the 
              <Brain className="inline h-4 w-4 mx-1" /> button to generate AI-powered analyses.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Personality</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Big Five personality traits and communication style recommendations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Sentiment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track emotional trends and relationship health over time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base">Social Playbook</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Meeting prep with conversation starters and key reminders.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-base">Relationship Score</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Overall health score with actionable improvement suggestions.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>AI insights you've generated</CardDescription>
              </CardHeader>
              <CardContent>
                {recentAnalyses && recentAnalyses.length > 0 ? (
                  <div className="space-y-3">
                    {recentAnalyses.map((analysis: any) => (
                      <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {analysis.profiles?.first_name?.[0]}{analysis.profiles?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                            </p>
                            <Badge variant="secondary" className={analysisTypeColors[analysis.analysis_type]}>
                              {analysisTypeLabels[analysis.analysis_type]}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(analysis.generated_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Brain className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No analyses yet. Open a contact profile to generate your first AI insight!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Generate insights for your contacts</CardDescription>
              </CardHeader>
              <CardContent>
                {contacts && contacts.length > 0 ? (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <Link 
                        key={contact.id}
                        to="/contacts"
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {contact.relationship_type?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                    <Button variant="ghost" className="w-full mt-2" asChild>
                      <Link to="/contacts">View All Contacts</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-3">
                      Add contacts to start generating AI insights.
                    </p>
                    <Button asChild>
                      <Link to="/contacts">Go to Contacts</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">How to use AI Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Open any contact → Click the <Brain className="inline h-4 w-4 mx-1" /> icon → Choose an analysis type → Get instant insights!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <AIUsageLogs />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
