import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Phone, Mail, Video, Users, MessageSquare, 
  ArrowUpRight, ArrowDownLeft, Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CommunicationDialog } from '@/components/communications/CommunicationDialog';
import { formatDistanceToNow, format } from 'date-fns';
import type { Communication as BaseCommunication } from '@/types/database-helpers';

type Communication = BaseCommunication & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export default function Communications() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: communications, isLoading } = useQuery({
    queryKey: ['communications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select('*, profiles(first_name, last_name)')
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data as Communication[];
    },
    enabled: !!user,
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'video_call': return <Video className="h-4 w-4" />;
      case 'in_person': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const channelColors: Record<string, string> = {
    email: 'bg-blue-100 text-blue-800',
    phone: 'bg-green-100 text-green-800',
    video_call: 'bg-purple-100 text-purple-800',
    in_person: 'bg-orange-100 text-orange-800',
    message: 'bg-pink-100 text-pink-800',
    social_media: 'bg-cyan-100 text-cyan-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <AppLayout title="Communications">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Track all your interactions and conversations
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Communication
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communications && communications.length > 0 ? (
          <div className="space-y-4">
            {communications.map((comm) => (
              <Card key={comm.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${channelColors[comm.channel]}`}>
                      {getChannelIcon(comm.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">
                          {comm.profiles?.first_name} {comm.profiles?.last_name}
                        </h3>
                        <Badge variant="secondary" className={channelColors[comm.channel]}>
                          {comm.channel.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {comm.direction === 'outbound' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3" />
                          )}
                          {comm.direction}
                        </Badge>
                      </div>
                      {comm.subject && (
                        <p className="font-medium mt-1">{comm.subject}</p>
                      )}
                      {comm.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {comm.content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(comm.occurred_at), 'PPp')}
                        </span>
                        {comm.duration_minutes && (
                          <span>{comm.duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No communications logged</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start tracking your interactions by logging your first communication.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Your First Communication
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CommunicationDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />
    </AppLayout>
  );
}
