import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Milestone, 
  Briefcase, 
  Heart, 
  Users, 
  MapPin, 
  GraduationCap, 
  Activity,
  Award,
  ChevronDown,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

interface LifeMilestone {
  id: string;
  profile_id: string;
  milestone_type: string;
  milestone_title: string;
  description: string;
  approximate_date: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence_score: number;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string | null;
  };
}

const milestoneTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  career: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  relationship: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  family: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  location: { icon: MapPin, color: 'text-green-500', bg: 'bg-green-500/10' },
  education: { icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  health: { icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10' },
  achievement: { icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  other: { icon: Milestone, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

const sentimentConfig = {
  positive: { color: 'text-green-500', label: '😊 Positive' },
  negative: { color: 'text-red-500', label: '😔 Difficult' },
  neutral: { color: 'text-gray-500', label: '😐 Neutral' },
};

interface MilestoneTimelineProps {
  profileId?: string;
  showHeader?: boolean;
  maxItems?: number;
}

export function MilestoneTimeline({ profileId, showHeader = true, maxItems = 20 }: MilestoneTimelineProps) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['life-milestones', user?.id, profileId],
    queryFn: async () => {
      // Query contact_activity_feed for milestone events instead
      let query = supabase
        .from('contact_activity_feed')
        .select(`
          id,
          profile_id,
          activity_subtype,
          title,
          description,
          occurred_at,
          importance_score,
          created_at,
          profiles:profile_id (first_name, last_name)
        `)
        .eq('user_id', user?.id)
        .eq('activity_type', 'milestone_detected')
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map to expected structure
      return (data || []).map((item: any) => ({
        id: item.id,
        profile_id: item.profile_id,
        milestone_type: item.activity_subtype || 'other',
        milestone_title: item.title?.replace('Life Milestone: ', '') || 'Unknown',
        description: item.description || '',
        approximate_date: item.occurred_at,
        sentiment: item.importance_score >= 8 ? 'positive' : item.importance_score >= 6 ? 'neutral' : 'negative',
        confidence_score: 0.8,
        created_at: item.created_at,
        profiles: item.profiles,
      })) as LifeMilestone[];
    },
    enabled: !!user,
  });

  // Group milestones by date
  const groupedMilestones = useMemo(() => {
    if (!milestones) return {};
    
    return milestones.reduce((acc, milestone) => {
      const date = milestone.approximate_date 
        ? format(parseISO(milestone.approximate_date), 'MMMM yyyy')
        : 'Unknown Date';
      
      if (!acc[date]) acc[date] = [];
      acc[date].push(milestone);
      return acc;
    }, {} as Record<string, LifeMilestone[]>);
  }, [milestones]);

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const content = (
    <ScrollArea className="h-[400px]">
      {Object.keys(groupedMilestones).length > 0 ? (
        <div className="space-y-6 pr-4">
          {Object.entries(groupedMilestones).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{date}</span>
              </div>
              <div className="space-y-2 ml-2 border-l-2 border-muted pl-4">
                {items.map((milestone) => {
                  const typeConfig = milestoneTypeConfig[milestone.milestone_type] || milestoneTypeConfig.other;
                  const Icon = typeConfig.icon;
                  const sentiment = sentimentConfig[milestone.sentiment];
                  const isExpanded = expandedId === milestone.id;
                  const profile = milestone.profiles;
                  const profileName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown';

                  return (
                    <Collapsible
                      key={milestone.id}
                      open={isExpanded}
                      onOpenChange={() => setExpandedId(isExpanded ? null : milestone.id)}
                    >
                      <div className={`rounded-lg border ${typeConfig.bg} overflow-hidden`}>
                        <CollapsibleTrigger className="w-full text-left">
                          <div className="p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full bg-background`}>
                                <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-medium text-sm">{milestone.milestone_title}</h4>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                                {!profileId && (
                                  <p className="text-xs text-muted-foreground">{profileName}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {milestone.milestone_type}
                                  </Badge>
                                  <span className={`text-xs ${sentiment.color}`}>{sentiment.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 border-t bg-background/50">
                            <p className="text-sm text-muted-foreground py-3">
                              {milestone.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {Math.round(milestone.confidence_score * 100)}% confident
                              </Badge>
                              {!profileId && (
                                <Link to={`/contacts/${milestone.profile_id}`}>
                                  <Button variant="ghost" size="sm">
                                    View Contact
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Milestone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">No milestones detected</p>
          <p className="text-xs">Life events will appear as they're detected from conversations</p>
        </div>
      )}
    </ScrollArea>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Milestone className="h-5 w-5 text-primary" />
          Life Milestones
        </CardTitle>
        <CardDescription>
          Significant life events detected from conversations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
