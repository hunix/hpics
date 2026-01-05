import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Brain, MessageSquare, TrendingUp, Clock, 
  Sparkles, Loader2, RefreshCw, BarChart3, PieChart,
  Heart, Info, Lightbulb, FileText, ChevronDown,
  Target, Calendar, Zap, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  LineChart, Line, Area, AreaChart, ReferenceLine
} from 'recharts';

interface ConversationAnalysisPanelProps {
  conversationId: string;
  profileName: string;
  messageCount: number;
}

// Sentiment color scale
const getSentimentColor = (sentiment: number): string => {
  if (sentiment >= 70) return 'hsl(142, 76%, 36%)'; // green
  if (sentiment >= 50) return 'hsl(45, 93%, 47%)'; // yellow
  return 'hsl(0, 84%, 60%)'; // red
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',
  positive: '#10b981',
  excited: '#f59e0b',
  neutral: '#6b7280',
  sad: '#3b82f6',
  negative: '#ef4444',
  angry: '#dc2626',
  anxious: '#8b5cf6',
};

export function ConversationAnalysisPanel({ 
  conversationId, 
  profileName,
  messageCount 
}: ConversationAnalysisPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [anonymizeData, setAnonymizeData] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);

  // Fetch existing analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['conversation-analysis', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_analyses')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['conversation-summary', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Run analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: { 
          conversationId, 
          anonymize: anonymizeData,
          userId: user!.id
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis', conversationId] });
      toast({ title: 'Analysis complete', description: 'Conversation has been analyzed successfully.' });
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast({ title: 'Analysis failed', description: error.message, variant: 'destructive' });
    },
  });

  // Quick summary mutation
  const summaryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('summarize-conversation', {
        body: { 
          conversationId, 
          userId: user!.id,
          recentOnly: false
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-summary', conversationId] });
      toast({ title: 'Summary generated', description: 'Quick summary has been created.' });
    },
    onError: (error) => {
      toast({ title: 'Summary failed', description: error.message, variant: 'destructive' });
    },
  });

  const patterns = analysis?.messaging_patterns as any;
  const sentiment = analysis?.sentiment_analysis as any;
  const intents = analysis?.intent_breakdown as any;
  const topics = analysis?.topic_clusters as any;
  const dynamics = analysis?.communication_dynamics as any;
  const insights = analysis?.insights as string[] | null;

  // Prepare chart data
  const messageDistData = patterns ? [
    { name: profileName.split(' ')[0], value: patterns.from_contact || 0 },
    { name: 'You', value: patterns.from_user || 0 },
  ] : [];

  const intentData = intents ? Object.entries(intents).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
    value: value as number,
  })).filter(d => d.value > 0) : [];

  // Enhanced sentiment timeline with colors
  const sentimentTimelineData = sentiment?.timeline?.map((t: any) => ({
    period: t.period,
    sentiment: Math.round((t.sentiment || 0) * 100),
    emotion: t.dominant_emotion || 'neutral',
    color: getSentimentColor(Math.round((t.sentiment || 0) * 100)),
  })) || [];

  // Emotion breakdown for pie chart
  const emotionCounts: Record<string, number> = {};
  sentiment?.timeline?.forEach((t: any) => {
    const emotion = (t.dominant_emotion || 'neutral').toLowerCase();
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });
  const emotionData = Object.entries(emotionCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: EMOTION_COLORS[name] || '#6b7280',
  }));

  const topicsData = topics?.slice(0, 6).map((t: any) => ({
    name: t.topic,
    frequency: t.frequency,
    sentiment: Math.round((t.sentiment || 0) * 100),
  })) || [];

  if (analysisLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Summary Section */}
      <Card>
        <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-base">Quick Summary</CardTitle>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {summaryLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed">{summary.summary}</p>
                  
                  {(summary.key_topics as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" /> Key Topics
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(summary.key_topics as string[]).map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(summary.action_items as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Action Items
                      </p>
                      <ul className="text-sm space-y-1">
                        {(summary.action_items as string[]).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(summary.important_dates as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Important Dates
                      </p>
                      <ul className="text-sm space-y-1">
                        {(summary.important_dates as string[]).map((date, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Generated {format(new Date(summary.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 gap-3">
                  <p className="text-sm text-muted-foreground">No summary yet</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => summaryMutation.mutate()}
                    disabled={summaryMutation.isPending}
                  >
                    {summaryMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {summary && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="mt-3"
                  onClick={() => summaryMutation.mutate()}
                  disabled={summaryMutation.isPending}
                >
                  {summaryMutation.isPending ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-2" />
                  )}
                  Regenerate
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Header with Analyze Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Conversation Analysis
              </CardTitle>
              <CardDescription>
                Analyze messaging patterns, sentiment, and communication dynamics
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : analysis ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-analyze
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Conversation
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {analysis && (
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Last analyzed: {format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')}</span>
              <Badge variant="outline">{analysis.message_count_analyzed?.toLocaleString()} messages analyzed</Badge>
              <Badge variant="outline">Confidence: {analysis.confidence_score}%</Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Total Messages</span>
                  </div>
                  <p className="text-2xl font-bold">{patterns?.total_messages?.toLocaleString() || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Initiation Ratio</span>
                  </div>
                  <p className="text-2xl font-bold">{((patterns?.initiation_ratio || 0) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">by {profileName.split(' ')[0]}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Avg Response</span>
                  </div>
                  <p className="text-2xl font-bold">{patterns?.avg_response_time_minutes || 0}m</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">Overall Sentiment</span>
                  </div>
                  <p className="text-2xl font-bold capitalize">{sentiment?.overall || 'N/A'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Message Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Message Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={messageDistData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {messageDistData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Intent Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={intentData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Peak Activity Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patterns?.peak_hours?.map((hour: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{hour}</Badge>
                    )) || <span className="text-muted-foreground text-sm">No data</span>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Active Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patterns?.most_active_days?.map((day: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{day}</Badge>
                    )) || <span className="text-muted-foreground text-sm">No data</span>}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Communication Dynamics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Dominant Speaker</p>
                      <p className="font-medium capitalize">{dynamics?.dominant_speaker === 'user' ? 'You' : profileName.split(' ')[0]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={(dynamics?.balance_score || 0) * 100} className="flex-1" />
                        <span className="text-sm font-medium">{((dynamics?.balance_score || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Avg Message Length</p>
                      <p className="font-medium">{dynamics?.avg_message_length_user || 0} chars</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{profileName.split(' ')[0]}'s Avg Message Length</p>
                      <p className="font-medium">{dynamics?.avg_message_length_contact || 0} chars</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sentiment Tab - Enhanced */}
          <TabsContent value="sentiment" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sentiment Timeline with Gradient */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Sentiment Over Time</CardTitle>
                  <CardDescription>Hover to see details. Green = positive, Yellow = neutral, Red = negative</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sentimentTimelineData}>
                        <defs>
                          <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover p-3 rounded-lg border shadow-lg">
                                  <p className="font-medium">{data.period}</p>
                                  <p className="text-sm">
                                    Sentiment: <span style={{ color: data.color }}>{data.sentiment}%</span>
                                  </p>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    Dominant: {data.emotion}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                        <Area 
                          type="monotone" 
                          dataKey="sentiment" 
                          stroke="hsl(var(--primary))" 
                          fill="url(#sentimentGradient)"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sentiment" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={({ cx, cy, payload }) => (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={5} 
                              fill={payload.color}
                              stroke="white"
                              strokeWidth={2}
                            />
                          )}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Emotion Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emotion Breakdown</CardTitle>
                  <CardDescription>Distribution of emotions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {emotionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={emotionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            innerRadius={40}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {emotionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No emotion data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Sentiment Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Overall Conversation Sentiment</p>
                    <p className="text-3xl font-bold capitalize">{sentiment?.overall || 'Neutral'}</p>
                  </div>
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ 
                      backgroundColor: sentiment?.overall === 'positive' ? '#10b981' : 
                                       sentiment?.overall === 'negative' ? '#ef4444' : '#f59e0b' 
                    }}
                  >
                    {sentiment?.overall === 'positive' ? '😊' : 
                     sentiment?.overall === 'negative' ? '😟' : '😐'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Topics Discussed</CardTitle>
                <CardDescription>Main themes extracted from the conversation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topicsData.map((topic: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-8 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                        />
                        <div>
                          <p className="font-medium">{topic.name}</p>
                          <p className="text-sm text-muted-foreground">{topic.frequency} mentions</p>
                        </div>
                      </div>
                      <Badge variant={topic.sentiment >= 60 ? 'default' : topic.sentiment >= 40 ? 'secondary' : 'destructive'}>
                        {topic.sentiment}% positive
                      </Badge>
                    </div>
                  ))}
                  {topicsData.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No topics analyzed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Observations and recommendations based on the analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {insights?.map((insight, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                    {(!insights || insights.length === 0) && (
                      <p className="text-muted-foreground text-center py-8">No insights generated</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* No Analysis State */}
      {!analysis && !analysisLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Run an AI analysis to discover messaging patterns, sentiment trends, 
              communication dynamics, and actionable insights from this conversation.
            </p>
            <Button onClick={() => setShowConfirmDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze {messageCount.toLocaleString()} Messages
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyze Conversation?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will analyze {messageCount.toLocaleString()} messages to extract patterns, 
                sentiment, topics, and insights.
              </p>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Label htmlFor="anonymize">Anonymize names for privacy</Label>
                </div>
                <Switch 
                  id="anonymize" 
                  checked={anonymizeData} 
                  onCheckedChange={setAnonymizeData}
                />
              </div>
              
              <p className="text-sm">
                {anonymizeData 
                  ? "Names will be replaced with 'Person A' and 'Person B' before sending to AI."
                  : "Names will be sent as-is to the AI for analysis."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => analyzeMutation.mutate()}>
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Start Analysis'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
