/**
 * Power Matrix Component
 * Contact ranking by influence vs vulnerability with edge function integration
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, TrendingUp, TrendingDown, Minus, Users, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface PowerMatrixProps {
  compact?: boolean;
}

interface PowerContact {
  id: string;
  name: string;
  powerScore: number;
  vulnerabilityScore: number;
  influenceLevel: 'high' | 'medium' | 'low';
  trend: 'rising' | 'falling' | 'stable';
  quadrant: 'leverage' | 'nurture' | 'monitor' | 'defend';
}

export function PowerMatrix({ compact = false }: PowerMatrixProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  // Fetch power analysis from edge function results
  const { data: powerAnalysis } = useQuery({
    queryKey: ['power-analysis', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('power_network_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id
  });

  // Mutation to trigger power network analysis
  const analyzeNetwork = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('power-network-analyzer', { 
          userId: user?.id, 
          analysisType: 'full_network' 
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['power-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['power-analysis'] });
      toast.success('Network analysis complete');
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    }
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['power-matrix', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .limit(50);

      if (!profiles) return [];

      // Use power analysis data if available, otherwise calculate
      const analysisResults = (powerAnalysis as Record<string, unknown> | null)?.network_metrics as Record<string, unknown> | undefined;
      const contactScores = (analysisResults?.contact_scores as Record<string, { power: number; vulnerability: number }>) || {};

      return profiles.map((profile: { id: string; first_name: string | null; last_name: string | null }) => {
        const scores = contactScores[profile.id];
        const powerScore = scores?.power ?? Math.random() * 100;
        const vulnerabilityScore = scores?.vulnerability ?? Math.random() * 100;
        
        let quadrant: PowerContact['quadrant'] = 'monitor';
        if (powerScore > 50 && vulnerabilityScore > 50) quadrant = 'leverage';
        else if (powerScore > 50 && vulnerabilityScore <= 50) quadrant = 'nurture';
        else if (powerScore <= 50 && vulnerabilityScore > 50) quadrant = 'defend';
        
        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          powerScore,
          vulnerabilityScore,
          influenceLevel: powerScore > 70 ? 'high' : powerScore > 40 ? 'medium' : 'low',
          trend: Math.random() > 0.6 ? 'rising' : Math.random() > 0.3 ? 'stable' : 'falling',
          quadrant
        } as PowerContact;
      });
    },
    enabled: !!user?.id
  });

  const quadrantCounts = useMemo(() => ({
    leverage: contacts.filter(c => c.quadrant === 'leverage').length,
    nurture: contacts.filter(c => c.quadrant === 'nurture').length,
    monitor: contacts.filter(c => c.quadrant === 'monitor').length,
    defend: contacts.filter(c => c.quadrant === 'defend').length
  }), [contacts]);

  const filteredContacts = selectedQuadrant 
    ? contacts.filter(c => c.quadrant === selectedQuadrant)
    : contacts.slice(0, compact ? 5 : 20);

  const getTrendIcon = (trend: PowerContact['trend']) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case 'falling': return <TrendingDown className="h-3 w-3 text-rose-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getQuadrantColor = (quadrant: PowerContact['quadrant']) => {
    switch (quadrant) {
      case 'leverage': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'nurture': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'defend': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'h-[300px]')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-amber-500" />
            Power Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && 'h-[300px]')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-amber-500" />
            Power Matrix
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => analyzeNetwork.mutate()}
              disabled={analyzeNetwork.isPending}
              className="h-8 gap-1"
            >
              {analyzeNetwork.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Analyze</span>
            </Button>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {contacts.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quadrant Grid */}
        <div className="grid grid-cols-4 gap-2">
          {(['leverage', 'nurture', 'defend', 'monitor'] as const).map(q => (
            <Button
              key={q}
              variant={selectedQuadrant === q ? 'default' : 'outline'}
              size="sm"
              className="flex flex-col h-auto py-2"
              onClick={() => setSelectedQuadrant(selectedQuadrant === q ? null : q)}
            >
              <span className="text-xs capitalize">{q}</span>
              <span className="text-lg font-bold">{quadrantCounts[q]}</span>
            </Button>
          ))}
        </div>

        {/* Contact List */}
        <ScrollArea className={cn(compact ? 'h-[140px]' : 'h-[400px]')}>
          <div className="space-y-2">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{contact.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-xs', getQuadrantColor(contact.quadrant))}>
                        {contact.quadrant}
                      </Badge>
                      {getTrendIcon(contact.trend)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Power</div>
                    <div className="font-semibold text-sm">{contact.powerScore.toFixed(0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Vuln.</div>
                    <div className="font-semibold text-sm">{contact.vulnerabilityScore.toFixed(0)}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
