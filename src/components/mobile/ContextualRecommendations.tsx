/**
 * ContextualRecommendations - AI-generated suggestions based on follow-up needs
 * Integrates with suggest-followups edge function for intelligent contact recommendations
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, User, Clock, MessageSquare, Phone, 
  Calendar, Camera, ChevronRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';

interface ContextualRecommendationsProps {
  className?: string;
  maxItems?: number;
}

interface FollowUpSuggestion {
  contactId: string;
  contactName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  daysSinceContact: number;
}

interface Recommendation {
  id: string;
  type: 'contact' | 'action' | 'capture' | 'reminder';
  title: string;
  description: string;
  profileId?: string;
  profileName?: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const ACTION_ICONS: Record<string, typeof Lightbulb> = {
  contact: User,
  action: Lightbulb,
  capture: Camera,
  reminder: Clock,
  call: Phone,
  message: MessageSquare,
  meeting: Calendar,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-red-500 bg-red-500/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  low: 'border-l-blue-500 bg-blue-500/5',
};

export function ContextualRecommendations({ className, maxItems = 5 }: ContextualRecommendationsProps) {
  const navigate = useNavigate();
  
  // Fetch AI-powered follow-up suggestions
  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['contextual-followup-suggestions'],
    queryFn: async () => {
      const { data } = await invokeFunction('suggest-followups');
      return (data?.suggestions || []) as FollowUpSuggestion[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Transform suggestions into recommendations
  const recommendations = useMemo((): Recommendation[] => {
    return suggestions.map((s) => ({
      id: `suggestion-${s.contactId}`,
      type: 'contact' as const,
      title: `Follow up with ${s.contactName}`,
      description: s.suggestedAction,
      profileId: s.contactId,
      profileName: s.contactName,
      priority: s.priority,
      reason: s.reason,
    }));
  }, [suggestions]);

  const displayRecommendations = useMemo(() => {
    return recommendations.slice(0, maxItems);
  }, [recommendations, maxItems]);

  const currentContext = 'intelligence'; // Context-aware mode based on page

  const handleAction = (rec: Recommendation) => {
    if (rec.profileId) {
      navigate(`/contacts/${rec.profileId}`);
    } else if (rec.type === 'capture') {
      navigate('/analysis');
    } else if (rec.type === 'action') {
      console.log('Executing action:', rec.title);
    }
  };

  const getIcon = (type: string) => ACTION_ICONS[type] || Lightbulb;

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart Recommendations
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {currentContext} mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : displayRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recommendations right now</p>
            <p className="text-xs">Suggestions appear based on your contacts</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              <AnimatePresence>
                {displayRecommendations.map((rec, index) => {
                  const Icon = getIcon(rec.type);
                  
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity",
                        PRIORITY_STYLES[rec.priority]
                      )}
                      onClick={() => handleAction(rec)}
                    >
                      <div className="flex items-start gap-3">
                        {rec.profileId ? (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {rec.profileName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{rec.title}</p>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] h-4",
                                rec.priority === 'high' && "border-red-500/50 text-red-400",
                                rec.priority === 'medium' && "border-amber-500/50 text-amber-400",
                                rec.priority === 'low' && "border-blue-500/50 text-blue-400"
                              )}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {rec.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1 italic">
                            {rec.reason}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
