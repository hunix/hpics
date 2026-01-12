/**
 * RestPanel - Context panel for rest mode
 * Shows: weekly summary, relationship health overview, reflection prompts
 */

import React from 'react';
import { 
  Moon, 
  TrendingUp, 
  Heart, 
  Calendar,
  Users,
  Star,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function RestPanel() {
  const { user } = useAuth();

  // Fetch relationship health summary
  const { data: healthSummary } = useQuery({
    queryKey: ['rest-health', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('relationship_scores')
        .select('health_score')
        .eq('user_id', user.id);
      
      if (!data?.length) return null;
      
      const scores = data.map(d => d.health_score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const healthy = scores.filter(s => s >= 0.7).length;
      const atRisk = scores.filter(s => s < 0.5).length;
      
      return { average: avg, healthy, atRisk, total: scores.length };
    },
    enabled: !!user?.id,
  });

  // Fetch top relationships
  const { data: topRelationships } = useQuery({
    queryKey: ['rest-top-relationships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('relationship_scores')
        .select(`
          id, health_score, interaction_count,
          profile:profiles!relationship_scores_profile_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('health_score', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch weekly stats
  const { data: weeklyStats } = useQuery({
    queryKey: ['rest-weekly', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const [{ count: interactionsCount }, { count: newContactsCount }] = await Promise.all([
        supabase
          .from('proximity_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekAgo),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekAgo),
      ]);
      
      return {
        interactions: interactionsCount || 0,
        newContacts: newContactsCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  const reflectionPrompts = [
    "Who made you smile this week?",
    "Which relationship needs more attention?",
    "What conversation do you want to have tomorrow?",
  ];

  const randomPrompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];

  return (
    <div className="p-4 space-y-4">
      {/* Weekly Summary */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-5 w-5 text-violet-500" />
            <span className="font-medium">This Week</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{weeklyStats?.interactions || 0}</p>
              <p className="text-xs text-muted-foreground">Interactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{weeklyStats?.newContacts || 0}</p>
              <p className="text-xs text-muted-foreground">New Contacts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Health */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-medium">Network Health</span>
        </div>
        {healthSummary && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Health</span>
              <span className="font-medium">
                {Math.round(healthSummary.average * 100)}%
              </span>
            </div>
            <Progress value={healthSummary.average * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{healthSummary.healthy} healthy</span>
              <span>{healthSummary.atRisk} at risk</span>
              <span>{healthSummary.total} total</span>
            </div>
          </div>
        )}
      </div>

      {/* Top Relationships */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Strongest Bonds</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {topRelationships?.map((rel: any) => {
            const profile = rel.profile;
            const name = profile ? `${profile.first_name || ''}`.trim() : '?';
            return (
              <div 
                key={rel.id}
                className="flex flex-col items-center p-2 rounded-lg bg-muted/50 min-w-[70px]"
              >
                <Avatar className="h-10 w-10 mb-1">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-sm">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-xs font-medium truncate max-w-[60px]">{name}</p>
                <Badge variant="secondary" className="text-[10px] h-4 mt-1">
                  {Math.round(rel.health_score * 100)}%
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflection Prompt */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Reflect</p>
              <p className="text-sm text-muted-foreground mt-1">{randomPrompt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="justify-start">
          <Calendar className="h-4 w-4 mr-2" />
          Weekly Report
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Users className="h-4 w-4 mr-2" />
          Network Map
        </Button>
      </div>
    </div>
  );
}
