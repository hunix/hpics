import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Sparkles, Copy, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplatesProps {
  profileId: string;
  contactName: string;
}

interface MessageTemplate {
  type: string;
  subject: string;
  body: string;
  context: string;
}

export function MessageTemplates({ profileId, contactName }: MessageTemplatesProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Fetch contact context
  const { data: contactData, isLoading: isLoadingContact } = useQuery({
    queryKey: ['contact-context', profileId],
    queryFn: async () => {
      const [profile, communications, interests, events] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(5),
        supabase.from('contact_interests').select('*').eq('profile_id', profileId),
        supabase.from('events').select('*').eq('profile_id', profileId).gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(3),
      ]);

      return {
        profile: profile.data,
        recentComms: communications.data || [],
        interests: interests.data || [],
        upcomingEvents: events.data || [],
      };
    },
  });

  const generateTemplates = async () => {
    if (!contactData) return;
    
    setIsGenerating(true);
    
    try {
      const context = {
        name: contactName,
        relationship: contactData.profile?.relationship_type,
        organization: contactData.profile?.organization,
        jobTitle: contactData.profile?.job_title,
        interests: contactData.interests.map(i => i.name),
        upcomingEvents: contactData.upcomingEvents.map(e => ({ title: e.title, date: e.event_date, type: e.event_type })),
        recentTopics: contactData.recentComms.map(c => c.subject).filter(Boolean),
      };

      const { data, error } = await supabase.functions.invoke('generate-message-templates', {
        body: { profileId, context }
      });

      if (error) throw error;
      
      setTemplates(data?.templates || []);
    } catch (error) {
      console.error('Error generating templates:', error);
      // Fallback templates
      setTemplates([
        {
          type: 'check-in',
          subject: `Checking in`,
          body: `Hi ${contactName},\n\nI hope this message finds you well! It's been a while since we last connected, and I wanted to reach out to see how things are going.\n\nWould love to catch up when you have a moment.\n\nBest regards`,
          context: 'General check-in message',
        },
        {
          type: 'follow-up',
          subject: `Following up`,
          body: `Hi ${contactName},\n\nI wanted to follow up on our last conversation. I hope everything is progressing well on your end.\n\nLet me know if there's anything I can help with.\n\nBest`,
          context: 'Follow-up after previous interaction',
        },
        {
          type: 'meeting-request',
          subject: `Quick catch-up?`,
          body: `Hi ${contactName},\n\nI'd love to schedule a quick call or coffee to catch up. It would be great to hear what you've been working on lately.\n\nDo you have any availability in the next week or two?\n\nLooking forward to connecting!`,
          context: 'Meeting or call request',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoadingContact) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Message Templates
            </CardTitle>
            <CardDescription>
              AI-generated personalized messages for {contactName}
            </CardDescription>
          </div>
          <Button 
            onClick={generateTemplates}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {templates.length > 0 ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Click "Generate" to create personalized message templates</p>
            <p className="text-sm">Based on your relationship and recent interactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {template.type.replace('-', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{template.context}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`Subject: ${template.subject}\n\n${template.body}`, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                    <p className="text-sm font-medium">{template.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Body:</span>
                    <Textarea 
                      value={template.body}
                      readOnly
                      className="mt-1 min-h-[100px] text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
