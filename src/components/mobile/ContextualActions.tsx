/**
 * Contextual Actions - Smart quick actions based on context
 * Integrates with AI suggest-followups edge function for intelligent recommendations
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Phone, Heart, Coffee, Sparkles, Gift, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

interface ContextualAction {
  id: string;
  icon: typeof MessageSquare;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
  action: () => void;
  badge?: string;
}

interface ContextualActionsProps {
  profileId: string;
  profileName: string;
  onAction?: (actionType: string, data?: unknown) => void;
  className?: string;
}

export function ContextualActions({ profileId, profileName, onAction, className }: ContextualActionsProps) {
  const { data: contact } = useQuery({
    queryKey: ['contact-context', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, contact_personal_info (*)')
        .eq('id', profileId)
        .maybeSingle();
      return data;
    },
  });

  const { data: communications } = useQuery({
    queryKey: ['contact-communications', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('communications')
        .select('occurred_at, channel')
        .eq('profile_id', profileId)
        .order('occurred_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Fetch AI-powered follow-up suggestion for this profile
  const { data: aiSuggestion, refetch: refetchSuggestion, isFetching: isFetchingAI } = useQuery({
    queryKey: ['ai-followup-suggestion', profileId],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('suggest-followups');
      const suggestions = (data?.suggestions || []) as Array<{
        contactId: string;
        contactName: string;
        priority: 'high' | 'medium' | 'low';
        reason: string;
        suggestedAction: string;
        daysSinceContact: number;
      }>;
      return suggestions.find(s => s.contactId === profileId) || null;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: !!profileId,
  });

  const actions = useMemo(() => {
    const result: ContextualAction[] = [];
    const now = new Date();
    const hour = now.getHours();
    const firstName = profileName.split(' ')[0];

    // Time-based suggestions
    if (hour >= 8 && hour < 12) {
      result.push({
        id: 'morning-greeting',
        icon: Coffee,
        label: 'Good Morning',
        description: `Send a morning message to ${firstName}`,
        priority: 'low',
        color: 'text-amber-500',
        action: () => onAction?.('message', { template: 'morning' }),
      });
    }

    // Last contact analysis
    const lastComm = communications?.[0];
    const daysSinceContact = lastComm ? differenceInDays(now, new Date(lastComm.occurred_at)) : 999;

    if (daysSinceContact > 14) {
      result.push({
        id: 'reconnect',
        icon: Heart,
        label: 'Time to Reconnect',
        description: `You haven't talked in ${daysSinceContact} days`,
        priority: 'high',
        color: 'text-red-500',
        action: () => onAction?.('call'),
        badge: `${daysSinceContact}d`,
      });
    } else if (daysSinceContact > 7) {
      result.push({
        id: 'follow-up',
        icon: MessageSquare,
        label: 'Quick Check-in',
        description: 'A week since your last chat',
        priority: 'medium',
        color: 'text-orange-500',
        action: () => onAction?.('message'),
        badge: `${daysSinceContact}d`,
      });
    }

    // Birthday check
    const personalInfo = (contact as any)?.contact_personal_info;
    if (personalInfo?.birth_date) {
      const birthday = new Date(personalInfo.birth_date);
      const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
      const daysUntilBirthday = differenceInDays(thisYearBirthday, now);

      if (daysUntilBirthday === 0) {
        result.push({
          id: 'birthday-today',
          icon: Gift,
          label: "It's Their Birthday! 🎂",
          description: `Send ${firstName} birthday wishes`,
          priority: 'high',
          color: 'text-pink-500',
          action: () => onAction?.('message', { template: 'birthday' }),
          badge: 'Today!',
        });
      } else if (daysUntilBirthday > 0 && daysUntilBirthday <= 7) {
        result.push({
          id: 'birthday-soon',
          icon: Gift,
          label: 'Birthday Coming Up',
          description: `${firstName}'s birthday in ${daysUntilBirthday} days`,
          priority: 'medium',
          color: 'text-pink-500',
          action: () => onAction?.('gift-ideas'),
          badge: `${daysUntilBirthday}d`,
        });
      }
    }

    // AI-powered follow-up suggestion (from edge function)
    if (aiSuggestion) {
      result.push({
        id: 'ai-followup',
        icon: Sparkles,
        label: aiSuggestion.suggestedAction.slice(0, 20) + (aiSuggestion.suggestedAction.length > 20 ? '...' : ''),
        description: aiSuggestion.reason,
        priority: aiSuggestion.priority,
        color: aiSuggestion.priority === 'high' ? 'text-red-500' : aiSuggestion.priority === 'medium' ? 'text-amber-500' : 'text-purple-500',
        action: () => onAction?.('ai-followup', { suggestion: aiSuggestion }),
        badge: `${aiSuggestion.daysSinceContact}d`,
      });
    } else {
      // Fallback AI Insight action
      result.push({
        id: 'ai-insight',
        icon: Sparkles,
        label: 'AI Insight',
        description: `Get tips for ${firstName}`,
        priority: 'low',
        color: 'text-purple-500',
        action: () => onAction?.('ai-insight'),
      });
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [contact, communications, profileName, onAction, aiSuggestion]);

  if (actions.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Actions</h4>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5" 
          onClick={() => refetchSuggestion()}
          disabled={isFetchingAI}
        >
          <RefreshCw className={cn("h-3 w-3 text-muted-foreground", isFetchingAI && "animate-spin")} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.slice(0, 4).map(action => (
          <Button key={action.id} variant="outline" size="sm" className={cn("h-auto py-2 px-3 flex items-center gap-2", action.priority === 'high' && "border-red-500/30 bg-red-500/5")} onClick={action.action}>
            <action.icon className={cn("h-4 w-4", action.color)} />
            <div className="text-left">
              <p className="text-xs font-medium leading-tight">{action.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{action.description}</p>
            </div>
            {action.badge && <Badge variant="secondary" className={cn("ml-1 text-[10px] px-1.5 py-0", action.priority === 'high' && "bg-red-100 text-red-700")}>{action.badge}</Badge>}
          </Button>
        ))}
      </div>
    </div>
  );
}
