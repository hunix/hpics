/**
 * Mobile-Optimized Dashboard
 * Streamlined, action-focused dashboard for on-the-go use
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, Star, Calendar, AlertTriangle, 
  MessageSquare, Brain, Plus, Camera, Mic,
  ChevronRight, TrendingUp, Clock, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { ClickableContactChip } from '@/components/contacts/ClickableContactChip';
import { differenceInDays, format } from 'date-fns';

export function MobileDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['mobile-dashboard-stats', user?.id],
    queryFn: async () => {
      const [profilesRes, favoritesRes, eventsRes, capturesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_favorite', true),
        supabase.from('events').select('id', { count: 'exact' })
          .eq('is_active', true)
          .gte('event_date', new Date().toISOString()),
        supabase.from('device_captures').select('id', { count: 'exact' })
          .eq('status', 'pending'),
      ]);

      return {
        contacts: profilesRes.count ?? 0,
        favorites: favoritesRes.count ?? 0,
        upcomingEvents: eventsRes.count ?? 0,
        pendingCaptures: capturesRes.count ?? 0,
      };
    },
    enabled: !!user,
  });

  // Fetch contacts needing attention (decay)
  const { data: needsAttention, isLoading: decayLoading } = useQuery({
    queryKey: ['mobile-decay-contacts', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, last_contact_date, is_favorite')
        .eq('user_id', user!.id)
        .order('last_contact_date', { ascending: true, nullsFirst: true })
        .limit(5);

      return (data || []).filter(p => {
        if (!p.last_contact_date) return true;
        const days = differenceInDays(new Date(), new Date(p.last_contact_date));
        return p.is_favorite ? days > 30 : days > 60;
      }).slice(0, 4);
    },
    enabled: !!user,
  });

  // Fetch recent contacts
  const { data: recentContacts, isLoading: recentLoading } = useQuery({
    queryKey: ['mobile-recent-contacts', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!user,
  });

  const handleQuickAction = async (action: string) => {
    await hapticFeedback('medium');
    switch (action) {
      case 'capture':
        navigate('/intelligence');
        break;
      case 'add':
        navigate('/contacts');
        break;
      case 'ai':
        navigate('/ai-chat');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header Stats */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        
        <div className="grid grid-cols-4 gap-2">
          {statsLoading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard 
                icon={Users} 
                value={stats?.contacts || 0} 
                label="Contacts" 
                color="text-primary"
                onClick={() => navigate('/contacts')}
              />
              <StatCard 
                icon={Star} 
                value={stats?.favorites || 0} 
                label="Favorites" 
                color="text-yellow-500"
                onClick={() => navigate('/contacts')}
              />
              <StatCard 
                icon={Calendar} 
                value={stats?.upcomingEvents || 0} 
                label="Events" 
                color="text-green-500"
                onClick={() => navigate('/calendar')}
              />
              <StatCard 
                icon={Zap} 
                value={stats?.pendingCaptures || 0} 
                label="Pending" 
                color="text-orange-500"
                onClick={() => navigate('/intelligence')}
              />
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-14 flex-col gap-1 bg-blue-500/10 border-blue-500/30"
            onClick={() => handleQuickAction('capture')}
          >
            <Camera className="h-5 w-5 text-blue-500" />
            <span className="text-xs">Capture</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-14 flex-col gap-1 bg-green-500/10 border-green-500/30"
            onClick={() => handleQuickAction('add')}
          >
            <Plus className="h-5 w-5 text-green-500" />
            <span className="text-xs">Add Contact</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-14 flex-col gap-1 bg-purple-500/10 border-purple-500/30"
            onClick={() => handleQuickAction('ai')}
          >
            <Brain className="h-5 w-5 text-purple-500" />
            <span className="text-xs">AI Chat</span>
          </Button>
        </div>
      </div>

      {/* Needs Attention */}
      {(needsAttention?.length ?? 0) > 0 && (
        <div className="px-4 py-2">
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {needsAttention?.map((contact) => {
                  const days = contact.last_contact_date 
                    ? differenceInDays(new Date(), new Date(contact.last_contact_date))
                    : 999;
                  return (
                    <ClickableContactChip
                      key={contact.id}
                      contactId={contact.id}
                      name={`${contact.first_name} ${contact.last_name || ''}`}
                      avatarUrl={contact.avatar_url}
                      className="w-full bg-background/50"
                    >
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {days}d
                      </Badge>
                    </ClickableContactChip>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Contacts - Horizontal Scroll */}
      <div className="py-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Contacts
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/contacts')}
            className="text-xs"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 px-4 pb-2">
            {recentLoading ? (
              [...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-20 h-24 rounded-xl shrink-0" />
              ))
            ) : (
              recentContacts?.map((contact) => (
                <motion.button
                  key={contact.id}
                  onClick={async () => {
                    await hapticFeedback('light');
                    navigate(`/contacts/${contact.id}`);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 w-20 shrink-0"
                >
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                    <AvatarImage src={contact.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {contact.first_name}
                  </span>
                </motion.button>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Today's Intelligence Summary */}
      <div className="px-4 py-2 pb-24">
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Network Health
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Score</span>
                <span className="text-lg font-bold text-green-500">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Your network is healthy! {needsAttention?.length || 0} contacts need attention.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
  onClick?: () => void;
}

function StatCard({ icon: Icon, value, label, color, onClick }: StatCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border text-center"
    >
      <Icon className={`h-5 w-5 mb-1 ${color}`} />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </motion.button>
  );
}
