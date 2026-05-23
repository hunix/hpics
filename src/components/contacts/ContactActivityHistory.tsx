import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, Brain, Eye, Volume2, Image, FileText, Sparkles,
  Clock, DollarSign, CheckCircle, XCircle, Loader2, Filter, Download,
  Users, MessageSquare, Target
} from 'lucide-react';
import { format } from 'date-fns';

interface ContactActivityHistoryProps {
  profileId: string;
  contactName: string;
}

type ActivityType = 'all' | 'analysis' | 'generation' | 'enrichment';

export function ContactActivityHistory({ profileId, contactName }: ContactActivityHistoryProps) {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<ActivityType>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch AI usage logs for this contact
  const { data: usageLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['contact-ai-usage', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch media analyses for this contact
  const { data: mediaAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['contact-media-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_analyses')
        .select('id, created_at, model_used, confidence_score, analysis_depth, media:media_id(file_name, media_type)')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch behavioral analyses
  const { data: behavioralAnalyses, isLoading: behavioralLoading } = useQuery({
    queryKey: ['contact-behavioral-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch AI analyses (personality, sentiment, playbook, relationship_score)
  const { data: aiAnalyses, isLoading: aiAnalysesLoading } = useQuery({
    queryKey: ['contact-ai-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch facial analyses
  const { data: facialAnalyses, isLoading: facialLoading } = useQuery({
    queryKey: ['contact-facial-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facial_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch vocal analyses
  const { data: vocalAnalyses, isLoading: vocalLoading } = useQuery({
    queryKey: ['contact-vocal-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocal_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch body language analyses
  const { data: bodyLanguageAnalyses, isLoading: bodyLanguageLoading } = useQuery({
    queryKey: ['contact-body-language-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_language_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profileId,
  });

  // Combine and sort all activities
  const allActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      type: string;
      subtype: string;
      timestamp: string;
      status: string;
      cost: number | null;
      model: string | null;
      details: string;
    }> = [];

    // Add AI usage logs
    usageLogs?.forEach((log) => {
      activities.push({
        id: log.id,
        type: 'ai_usage',
        subtype: log.function_name,
        timestamp: log.created_at,
        status: log.status,
        cost: log.actual_cost_cents ?? log.estimated_cost_cents,
        model: log.model_name,
        details: log.prompt_summary || log.function_name,
      });
    });

    // Add media analyses
    mediaAnalyses?.forEach((analysis) => {
      activities.push({
        id: analysis.id,
        type: 'media_analysis',
        subtype: analysis.analysis_depth || 'deep',
        timestamp: analysis.created_at ?? '',
        status: 'completed',
        cost: null,
        model: analysis.model_used,
        details: (analysis.media as any)?.file_name || 'Media analysis',
      });
    });

    // Add behavioral analyses
    behavioralAnalyses?.forEach((analysis) => {
      activities.push({
        id: analysis.id,
        type: 'behavioral',
        subtype: analysis.analysis_type,
        timestamp: analysis.created_at,
        status: 'completed',
        cost: null,
        model: analysis.ai_model_used,
        details: `Behavioral: ${analysis.analysis_type}`,
      });
    });

    // Add AI analyses (personality, sentiment, playbook, relationship_score)
    aiAnalyses?.forEach((analysis) => {
      activities.push({
        id: analysis.id,
        type: 'ai_analysis',
        subtype: analysis.analysis_type,
        timestamp: analysis.generated_at,
        status: 'completed',
        cost: null,
        model: null,
        details: `${analysis.analysis_type.charAt(0).toUpperCase() + analysis.analysis_type.slice(1).replace('_', ' ')} analysis`,
      });
    });

    // Add facial analyses
    facialAnalyses?.forEach((analysis) => {
      activities.push({
        id: analysis.id,
        type: 'facial',
        subtype: 'facial_analysis',
        timestamp: analysis.created_at,
        status: 'completed',
        cost: null,
        model: analysis.ai_model_used,
        details: 'Facial expression analysis',
      });
    });

    // Add vocal analyses
    vocalAnalyses?.forEach((analysis) => {
      activities.push({
        id: analysis.id,
        type: 'vocal',
        subtype: 'vocal_analysis',
        timestamp: analysis.created_at,
        status: 'completed',
        cost: null,
        model: analysis.ai_model_used,
        details: 'Vocal pattern analysis',
      });
    });

    // Add body language analyses
    bodyLanguageAnalyses?.forEach((analysis) => {
      activities.push({
        id: analysis.id,
        type: 'body_language',
        subtype: 'body_language_analysis',
        timestamp: analysis.created_at,
        status: 'completed',
        cost: null,
        model: analysis.ai_model_used,
        details: 'Body language analysis',
      });
    });

    // Sort by timestamp descending
    return activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [usageLogs, mediaAnalyses, behavioralAnalyses, aiAnalyses, facialAnalyses, vocalAnalyses, bodyLanguageAnalyses]);

  // Apply filters
  const filteredActivities = useMemo(() => {
    let result = allActivities;

    if (filterType !== 'all') {
      result = result.filter((a) => {
        if (filterType === 'analysis') {
          return (
            a.type === 'media_analysis' ||
            a.type === 'behavioral' ||
            a.type === 'ai_analysis' ||
            a.type === 'facial' ||
            a.type === 'vocal' ||
            a.type === 'body_language' ||
            a.subtype.includes('analyze')
          );
        }
        if (filterType === 'generation') {
          return a.subtype.includes('generate');
        }
        if (filterType === 'enrichment') {
          return a.subtype.includes('enrich');
        }
        return true;
      });
    }

    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      if (dateRange === '7d') cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (dateRange === '30d') cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (dateRange === '90d') cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      else cutoff = new Date(0);

      result = result.filter((a) => new Date(a.timestamp) >= cutoff);
    }

    return result;
  }, [allActivities, filterType, dateRange]);

  // Calculate totals
  const totalCost = useMemo(() => {
    return filteredActivities.reduce((sum, a) => sum + (a.cost || 0), 0);
  }, [filteredActivities]);

  const isLoading = logsLoading || analysesLoading || behavioralLoading || aiAnalysesLoading || facialLoading || vocalLoading || bodyLanguageLoading;

  const getActivityIcon = (type: string, subtype: string) => {
    if (type === 'behavioral' || subtype.includes('behavioral')) return Brain;
    if (type === 'facial' || subtype.includes('facial') || subtype.includes('face')) return Eye;
    if (type === 'vocal' || subtype.includes('vocal') || subtype.includes('audio')) return Volume2;
    if (type === 'body_language') return Users;
    if (type === 'ai_analysis') {
      if (subtype === 'personality') return Brain;
      if (subtype === 'sentiment') return MessageSquare;
      if (subtype === 'relationship_score') return Target;
      return Sparkles;
    }
    if (type === 'media_analysis') return Image;
    if (subtype.includes('generate')) return Sparkles;
    if (subtype.includes('enrich')) return FileText;
    return Activity;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'error':
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
      case 'processing':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Type', 'Operation', 'Status', 'Model', 'Cost (cents)', 'Details'].join(','),
      ...filteredActivities.map((a) =>
        [
          format(new Date(a.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          a.type,
          a.subtype,
          a.status,
          a.model || '',
          a.cost || 0,
          `"${a.details.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contactName.replace(/\s+/g, '_')}_activity_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity & Usage History
            </CardTitle>
            <CardDescription>
              AI operations, analyses, and transactions for {contactName}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Total Operations</p>
            <p className="text-2xl font-bold">{filteredActivities.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {(totalCost / 100).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">
              {filteredActivities.length > 0
                ? (
                    (filteredActivities.filter(
                      (a) => a.status === 'completed' || a.status === 'success'
                    ).length /
                      filteredActivities.length) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as ActivityType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="analysis">Analyses</SelectItem>
              <SelectItem value="generation">Generations</SelectItem>
              <SelectItem value="enrichment">Enrichment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No activity recorded for this contact yet.</p>
            <p className="text-sm">AI analyses, generations, and enrichments will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type, activity.subtype);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{activity.subtype}</span>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                        {activity.model && (
                          <span className="truncate">{activity.model}</span>
                        )}
                        {activity.cost !== null && activity.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {(activity.cost / 100).toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
