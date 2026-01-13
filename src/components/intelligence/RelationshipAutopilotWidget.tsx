import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  AlertTriangle, 
  Send, 
  Clock, 
  RefreshCw,
  Sparkles,
  Check,
  X,
  MessageSquare,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface ChurnRiskContact {
  id: string;
  name: string;
  avatar_url?: string;
  last_contact?: string;
  days_since_contact: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  suggested_action?: string;
  draft_message?: string;
  preferred_channel?: string;
}

export function RelationshipAutopilotWidget() {
  const queryClient = useQueryClient();
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>("");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const { data: churnRisks, isLoading, refetch } = useQuery({
    queryKey: ['churn-risks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get predictions or calculate from communications
      const { data: predictions } = await supabase
        .from('churn_predictions')
        .select(`
          *,
          profile:profiles(id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .gte('risk_score', 30)
        .order('risk_score', { ascending: false })
        .limit(10);

      if (predictions && predictions.length > 0) {
        return predictions.map(p => ({
          id: p.profile_id,
          name: `${p.profile?.first_name || ''} ${p.profile?.last_name || ''}`.trim() || 'Unknown',
          avatar_url: p.profile?.avatar_url || undefined,
          days_since_contact: p.predicted_days_to_churn || 0,
          risk_score: p.risk_score || 0,
          risk_level: (p.risk_level as ChurnRiskContact['risk_level']) || 'medium',
          suggested_action: p.intervention_recommended,
          preferred_channel: 'email'
        })) as ChurnRiskContact[];
      }

      // Fallback: calculate from last communication (active contacts only)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(100);

      if (!profiles) return [];

      const risks: ChurnRiskContact[] = [];
      
      for (const profile of profiles) {
        const { data: lastComm } = await supabase
          .from('communications')
          .select('occurred_at')
          .eq('profile_id', profile.id)
          .order('occurred_at', { ascending: false })
          .limit(1)
          .single();

        const daysSince = lastComm 
          ? differenceInDays(new Date(), new Date(lastComm.occurred_at))
          : 999;

        if (daysSince > 14) {
          const riskScore = Math.min(100, Math.floor(daysSince * 1.5));
          risks.push({
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
            avatar_url: profile.avatar_url || undefined,
            last_contact: lastComm?.occurred_at,
            days_since_contact: daysSince,
            risk_score: riskScore,
            risk_level: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            preferred_channel: 'email'
          });
        }
      }

      return risks.sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);
    }
  });

  const generateDraftMutation = useMutation({
    mutationFn: async (contact: ChurnRiskContact) => {
      setGeneratingFor(contact.id);
      const { data, error } = await supabase.functions.invoke('generate-outreach-draft', {
        body: { 
          profileId: contact.id,
          context: {
            daysSinceContact: contact.days_since_contact,
            riskLevel: contact.risk_level,
            channel: contact.preferred_channel
          }
        }
      });
      if (error) throw error;
      return { contactId: contact.id, draft: data.draft };
    },
    onSuccess: ({ contactId, draft }) => {
      setEditingDraft(contactId);
      setDraftContent(draft);
      setGeneratingFor(null);
      toast.success("Draft generated!");
    },
    onError: (error) => {
      setGeneratingFor(null);
      toast.error("Failed to generate draft: " + (error as Error).message);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ contactId, message, channel }: { contactId: string; message: string; channel: string }) => {
      // Log the outreach
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from('communications').insert({
        user_id: user.id,
        profile_id: contactId,
        channel: channel === 'email' ? 'email' : 'phone',
        direction: 'outbound',
        content: message,
        subject: 'Autopilot Outreach'
      });

      return contactId;
    },
    onSuccess: (contactId) => {
      setEditingDraft(null);
      setDraftContent("");
      queryClient.invalidateQueries({ queryKey: ['churn-risks'] });
      toast.success("Message logged! Remember to actually send it.");
    },
    onError: (error) => {
      toast.error("Failed to log message: " + (error as Error).message);
    }
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'phone': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Relationship Autopilot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Relationship Autopilot
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!churnRisks || churnRisks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>All relationships are healthy!</p>
            <p className="text-sm">No contacts at churn risk</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {churnRisks.map((contact) => (
                <div 
                  key={contact.id} 
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{contact.name}</span>
                        <Badge className={getRiskColor(contact.risk_level)}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {contact.risk_level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {contact.days_since_contact} days ago
                        </span>
                        <span className="flex items-center gap-1">
                          {getChannelIcon(contact.preferred_channel)}
                          {contact.preferred_channel}
                        </span>
                      </div>
                      
                      {contact.suggested_action && (
                        <p className="text-sm mt-1 text-muted-foreground">
                          💡 {contact.suggested_action}
                        </p>
                      )}

                      {editingDraft === contact.id ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            placeholder="Edit your message..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => sendMessageMutation.mutate({
                                contactId: contact.id,
                                message: draftContent,
                                channel: contact.preferred_channel || 'email'
                              })}
                              disabled={sendMessageMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Log & Send
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingDraft(null);
                                setDraftContent("");
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateDraftMutation.mutate(contact)}
                            disabled={generatingFor === contact.id}
                          >
                            {generatingFor === contact.id ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            Generate Outreach
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
