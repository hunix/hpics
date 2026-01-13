import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProtectedContactDelete } from '@/hooks/mutations/useProtectedDelete';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Edit, Trash2, Star, MessageSquare, 
  Calendar, Building, Briefcase, Brain, MessagesSquare, History, GraduationCap, Sparkles, FileText, Gift, Heart, Target, Clock
} from 'lucide-react';
import { ContactDialog } from './ContactDialog';
import { ContactMethodsManager } from './ContactMethodsManager';
import { ContactEnrichment } from './ContactEnrichment';
import { ConversationsManager } from '@/components/conversations/ConversationsManager';
import { ContactTimeline } from './ContactTimeline';
import { EducationManager } from './EducationManager';
import { CertificationsManager } from './CertificationsManager';
import { SkillsManager } from './SkillsManager';
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel';
import { MeetingBriefing } from './MeetingBriefing';
import { GiftSuggestions } from './GiftSuggestions';
import { InterestsManager } from './InterestsManager';
import { RelationshipGoals } from './RelationshipGoals';
import { SharedExperiences } from './SharedExperiences';
import { OptimalOutreach } from './OptimalOutreach';
import { MessageTemplates } from './MessageTemplates';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface ContactDetailDialogProps {
  contact: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailDialog({ contact, open, onOpenChange }: ContactDetailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const { data: contactMethods } = useQuery({
    queryKey: ['contact-methods', contact.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('profile_id', contact.id);
      return data ?? [];
    },
  });

  const { data: recentCommunications } = useQuery({
    queryKey: ['contact-communications', contact.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('communications')
        .select('*')
        .eq('profile_id', contact.id)
        .order('occurred_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['contact-events', contact.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('profile_id', contact.id)
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  const { mutate: deleteContact, isPending: isDeleting } = useProtectedContactDelete({
    onSuccess: () => {
      toast({ title: 'Contact deleted', description: `${contact.first_name} has been removed.` });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_favorite: !contact.is_favorite })
        .eq('id', contact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const relationshipColors: Record<string, string> = {
    family: 'bg-red-100 text-red-800',
    friend: 'bg-blue-100 text-blue-800',
    colleague: 'bg-purple-100 text-purple-800',
    client: 'bg-green-100 text-green-800',
    mentor: 'bg-yellow-100 text-yellow-800',
    mentee: 'bg-orange-100 text-orange-800',
    acquaintance: 'bg-gray-100 text-gray-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shrink-0">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <>
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </>
                      )}
                    </div>
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        {contact.first_name} {contact.last_name}
                        {contact.nickname && <span className="text-muted-foreground font-normal">({contact.nickname})</span>}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {contact.relationship_type && (
                          <Badge className={relationshipColors[contact.relationship_type]}>
                            {contact.relationship_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavoriteMutation.mutate()}
                    >
                      <Star className={`h-5 w-5 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button 
                      variant={showAIPanel ? "default" : "outline"} 
                      size="icon" 
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      title="AI Insights"
                    >
                      <Brain className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      disabled={isDeleting}
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this contact?')) {
                          deleteContact({ id: contact.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {contact.organization && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.organization}</span>
                  </div>
                )}
                {contact.job_title && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.job_title}</span>
                  </div>
                )}
              </div>

              {contact.bio && (
                <p className="text-sm text-muted-foreground mb-4">{contact.bio}</p>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className={`grid gap-6 ${showAIPanel ? 'lg:grid-cols-2' : ''}`}>
                <div>
                  <Tabs defaultValue="contact">
                    <TabsList className="flex flex-wrap h-auto gap-1">
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                      <TabsTrigger value="outreach">Outreach</TabsTrigger>
                      <TabsTrigger value="templates">Templates</TabsTrigger>
                      <TabsTrigger value="briefing">Briefing</TabsTrigger>
                      <TabsTrigger value="interests">Interests</TabsTrigger>
                      <TabsTrigger value="gifts">Gifts</TabsTrigger>
                      <TabsTrigger value="goals">Goals</TabsTrigger>
                      <TabsTrigger value="experiences">Experiences</TabsTrigger>
                      <TabsTrigger value="education">Education</TabsTrigger>
                      <TabsTrigger value="messages">Messages</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="enrich">Enrich</TabsTrigger>
                    </TabsList>

                    <TabsContent value="contact" className="space-y-4 mt-4">
                      <ContactMethodsManager 
                        profileId={contact.id} 
                        contactMethods={contactMethods || []} 
                      />
                    </TabsContent>

                    <TabsContent value="outreach" className="mt-4">
                      <OptimalOutreach 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="templates" className="mt-4">
                      <MessageTemplates 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="briefing" className="mt-4">
                      <MeetingBriefing 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="interests" className="mt-4">
                      <InterestsManager 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="gifts" className="mt-4">
                      <GiftSuggestions 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="goals" className="mt-4">
                      <RelationshipGoals 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="experiences" className="mt-4">
                      <SharedExperiences 
                        profileId={contact.id}
                        contactName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="education" className="space-y-6 mt-4">
                      <EducationManager profileId={contact.id} />
                      <Separator />
                      <CertificationsManager profileId={contact.id} />
                      <Separator />
                      <SkillsManager profileId={contact.id} />
                    </TabsContent>

                    <TabsContent value="enrich" className="space-y-4 mt-4">
                      <ContactEnrichment 
                        profileId={contact.id}
                        profileName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                        linkedinUrl={contact.linkedin_url}
                      />
                    </TabsContent>

                    <TabsContent value="messages" className="space-y-4 mt-4">
                      <ConversationsManager 
                        profileId={contact.id} 
                        profileName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                      />
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-4 mt-4">
                      <ContactTimeline profileId={contact.id} />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* AI Panel */}
                {showAIPanel && (
                  <div>
                    <AIAnalysisPanel 
                      profileId={contact.id} 
                      profileName={`${contact.first_name} ${contact.last_name || ''}`.trim()}
                    />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ContactDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
      />
    </>
  );
}
