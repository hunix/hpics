import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Share2, FileText, MessageSquare, Users, 
  ArrowRight, Clock, AlertTriangle, Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InformationShare {
  id: string;
  shared_with: { id: string; first_name: string; last_name: string | null };
  info_type: 'document' | 'media' | 'message' | 'event';
  title: string;
  shared_at: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
}

export function InformationFlowPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['information-flow', user?.id],
    queryFn: async () => {
      // Get documents shared with contacts
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title, profile_id, created_at, document_type, profiles(id, first_name, last_name)')
        .eq('user_id', user!.id)
        .not('profile_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get media shared with contacts
      const { data: media } = await supabase
        .from('media')
        .select('id, caption, profile_id, created_at, mime_type, profiles(id, first_name, last_name)')
        .eq('user_id', user!.id)
        .not('profile_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Build flow items
      const flows: InformationShare[] = [];

      documents?.forEach(d => {
        if (d.profiles) {
          flows.push({
            id: `doc-${d.id}`,
            shared_with: d.profiles as any,
            info_type: 'document',
            title: d.title,
            shared_at: d.created_at,
            sensitivity: 'low',
          });
        }
      });

      media?.forEach(m => {
        if (m.profiles) {
          flows.push({
            id: `media-${m.id}`,
            shared_with: m.profiles as any,
            info_type: 'media',
            title: m.caption || 'Untitled media',
            shared_at: m.created_at,
            sensitivity: 'low',
          });
        }
      });

      // Sort by date
      flows.sort((a, b) => new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime());

      // Calculate stats
      const contactShareCounts = new Map<string, { name: string; count: number; highSensitivity: number }>();
      flows.forEach(f => {
        const existing = contactShareCounts.get(f.shared_with.id) || { 
          name: `${f.shared_with.first_name} ${f.shared_with.last_name || ''}`.trim(),
          count: 0, 
          highSensitivity: 0 
        };
        existing.count++;
        if (f.sensitivity === 'high' || f.sensitivity === 'critical') {
          existing.highSensitivity++;
        }
        contactShareCounts.set(f.shared_with.id, existing);
      });

      const topRecipients = Array.from(contactShareCounts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      return {
        flows: flows.slice(0, 30),
        topRecipients,
        totalShares: flows.length,
        highSensitivityShares: flows.filter(f => f.sensitivity === 'high' || f.sensitivity === 'critical').length,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'media': return Eye;
      case 'message': return MessageSquare;
      default: return Share2;
    }
  };

  const sensitivityColors = {
    low: 'bg-green-500/10 text-green-600 border-green-500/50',
    medium: 'bg-blue-500/10 text-blue-600 border-blue-500/50',
    high: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50',
    critical: 'bg-red-500/10 text-red-600 border-red-500/50',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Information Flow Tracking
        </CardTitle>
        <CardDescription>
          Track what information has been shared with whom
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-card text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{data?.totalShares || 0}</div>
            <div className="text-xs text-muted-foreground">Total Shares</div>
          </div>
          <div className="p-4 rounded-lg border bg-card text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold text-amber-500">{data?.highSensitivityShares || 0}</div>
            <div className="text-xs text-muted-foreground">High Sensitivity</div>
          </div>
        </div>

        {/* Top Recipients */}
        {data?.topRecipients && data.topRecipients.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Information Recipients
            </h4>
            <div className="space-y-2">
              {data.topRecipients.map(([id, info]) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/contacts/${id}`)}
                >
                  <span className="font-medium">{info.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{info.count} items</Badge>
                    {info.highSensitivity > 0 && (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                        {info.highSensitivity} sensitive
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Shares */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Recent Information Flow</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {data?.flows.map(flow => {
                const Icon = getTypeIcon(flow.info_type);
                return (
                  <div
                    key={flow.id}
                    className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{flow.title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span>{flow.shared_with.first_name} {flow.shared_with.last_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${sensitivityColors[flow.sensitivity]}`}
                      >
                        {flow.sensitivity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(flow.shared_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!data?.flows || data.flows.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No information shares tracked</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
