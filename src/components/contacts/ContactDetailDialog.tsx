import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, Trash2, Star, Mail, Phone, Linkedin, MessageSquare, 
  Calendar, FileText, Image, Building, Briefcase, User
} from 'lucide-react';
import { ContactDialog } from './ContactDialog';
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('profiles').delete().eq('id', contact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
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
                <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this contact?')) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 py-4">
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
            <p className="text-sm text-muted-foreground">{contact.bio}</p>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}

          <Tabs defaultValue="contact" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="communications">Activity</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="space-y-4">
              {contactMethods && contactMethods.length > 0 ? (
                <div className="space-y-2">
                  {contactMethods.map((method) => (
                    <div key={method.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      {getContactIcon(method.contact_type)}
                      <div>
                        <p className="font-medium">{method.value}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {method.label || method.contact_type}
                          {method.is_primary && ' • Primary'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No contact methods added yet.
                </p>
              )}
            </TabsContent>

            <TabsContent value="communications" className="space-y-4">
              {recentCommunications && recentCommunications.length > 0 ? (
                <div className="space-y-2">
                  {recentCommunications.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                      <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">{comm.channel.replace('_', ' ')}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comm.occurred_at), { addSuffix: true })}
                          </span>
                        </div>
                        {comm.subject && <p className="text-sm">{comm.subject}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No communications logged yet.
                </p>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                      <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No upcoming events.
                </p>
              )}
            </TabsContent>

            <TabsContent value="notes">
              {contact.notes ? (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No notes added yet.
                </p>
              )}
            </TabsContent>
          </Tabs>
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
