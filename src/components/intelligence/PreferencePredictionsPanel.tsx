import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, RefreshCw, Utensils, GraduationCap, Briefcase, 
  Heart, Users, Gamepad2, Activity, DollarSign, Info,
  ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PreferencePredictionsPanelProps {
  profileId: string;
  profileName: string;
  className?: string;
}

interface Preference {
  id: string;
  preference_category: string;
  preference_key: string;
  predicted_value: string;
  confidence_score: number;
  evidence_sources: Array<{ type: string; id: string; snippet?: string }>;
  evidence_count: number;
  last_updated: string;
}

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'academic', label: 'Academic', icon: GraduationCap },
  { id: 'professional', label: 'Work', icon: Briefcase },
  { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'entertainment', label: 'Entertainment', icon: Gamepad2 },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'personal', label: 'Personal', icon: Target },
];

const getConfidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-green-500 bg-green-500/10';
  if (score >= 0.6) return 'text-yellow-500 bg-yellow-500/10';
  if (score >= 0.4) return 'text-orange-500 bg-orange-500/10';
  return 'text-red-500 bg-red-500/10';
};

const getConfidenceLabel = (score: number) => {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
};

export function PreferencePredictionsPanel({
  profileId,
  profileName,
  className,
}: PreferencePredictionsPanelProps) {
  const [activeCategory, setActiveCategory] = useState('food');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['contact-preferences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_predicted_preferences')
        .select('*')
        .eq('profile_id', profileId)
        .order('confidence_score', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        preference_category: p.preference_category,
        preference_key: p.preference_key,
        predicted_value: p.predicted_value,
        confidence_score: p.confidence_score,
        evidence_count: p.evidence_count,
        last_updated: p.last_updated,
        evidence_sources: (Array.isArray(p.evidence_sources) 
          ? p.evidence_sources.map((s: any) => ({
              type: s?.type || 'unknown',
              id: s?.id || '',
              snippet: s?.snippet
            }))
          : []) as Preference['evidence_sources'],
      })) as Preference[];
    },
    enabled: !!profileId,
  });

  // Regenerate preferences mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('predict-contact-preferences', {
        body: { profileId, regenerate: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Preferences Updated',
        description: 'AI predictions have been regenerated.',
      });
      queryClient.invalidateQueries({ queryKey: ['contact-preferences', profileId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to regenerate preferences',
        variant: 'destructive',
      });
    },
  });

  const categoryPreferences = preferences?.filter(p => p.preference_category === activeCategory) || [];
  
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = preferences?.filter(p => p.preference_category === cat.id).length || 0;
    return acc;
  }, {} as Record<string, number>);

  const lastUpdate = preferences?.[0]?.last_updated;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Predicted Preferences
            </CardTitle>
            <CardDescription>
              AI-inferred preferences for {profileName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <Badge variant="outline" className="text-xs">
                {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              <RefreshCw className={cn("h-4 w-4", regenerateMutation.isPending && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          {/* Category Tabs - Scrollable */}
          <div className="border-b px-4">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex h-10 w-max gap-1 bg-transparent p-0">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.id];
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="relative px-3 py-1.5 text-xs data-[state=active]:bg-muted rounded-md whitespace-nowrap"
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {cat.label}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Content */}
          <div className="p-4">
            {CATEGORIES.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="m-0">
                {categoryPreferences.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No preferences predicted yet</p>
                    <p className="text-xs mt-1">Run a full intelligence scan to generate predictions</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-3">
                      {categoryPreferences.map((pref) => (
                        <div
                          key={pref.id}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {pref.preference_key}
                              </div>
                              <div className="text-sm text-foreground mt-0.5">
                                {pref.predicted_value}
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs flex-shrink-0", getConfidenceColor(pref.confidence_score))}
                            >
                              {getConfidenceLabel(pref.confidence_score)}
                            </Badge>
                          </div>

                          {/* Confidence Bar */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Confidence</span>
                              <span>{Math.round(pref.confidence_score * 100)}%</span>
                            </div>
                            <Progress 
                              value={pref.confidence_score * 100} 
                              className="h-1.5"
                            />
                          </div>

                          {/* Evidence Sources */}
                          {pref.evidence_count > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <Info className="h-3 w-3" />
                              Based on {pref.evidence_count} evidence source{pref.evidence_count !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
