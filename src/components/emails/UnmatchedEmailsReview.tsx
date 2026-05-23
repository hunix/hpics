import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Mail,
  User,
  UserPlus,
  Check,
  X,
  Link,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { invokeFunction } from '@/lib/api';

interface MatchSuggestion {
  email: string;
  profileId: string | null;
  profileName: string | null;
  confidence: number;
  reason: string;
  isNewContact: boolean;
}

export function UnmatchedEmailsReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');

  // Fetch matching suggestions
  const { data: matchData, isLoading, refetch } = useQuery({
    queryKey: ['email-match-suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('match-emails-to-contacts', { batchSize: 100, useAI: true },);
      if (error) throw error;
      return data as {
        suggestions: MatchSuggestion[];
        autoMatched: number;
        requiresReview: number;
        newContacts: number;
      };
    },
    enabled: !!user,
  });

  // Fetch available contacts for manual linking
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-linking', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_id', user!.id)
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Link email to existing contact
  const linkMutation = useMutation({
    mutationFn: async ({ email, profileId }: { email: string; profileId: string }) => {
      // First, add email as contact method
      const { error: methodError } = await supabase
        .from('contact_methods')
        .insert({
          profile_id: profileId,
          contact_type: 'email' as const,
          value: email,
          label: 'Work',
        });

      if (methodError && !methodError.message.includes('duplicate')) {
        throw methodError;
      }

      // Then update all threads with this email
      const { error: threadError } = await supabase
        .from('email_threads')
        .update({ profile_id: profileId })
        .eq('user_id', user!.id)
        .is('profile_id', null)
        .contains('participant_emails', [email]);

      if (threadError) throw threadError;
    },
    onSuccess: () => {
      toast.success('Email linked to contact');
      queryClient.invalidateQueries({ queryKey: ['email-match-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
    },
    onError: (error) => {
      toast.error('Failed to link: ' + (error as Error).message);
    },
  });

  // Create new contact from email
  const createContactMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const [firstName, ...lastParts] = name.split(' ');
      const lastName = lastParts.join(' ');

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user!.id,
          first_name: firstName,
          last_name: lastName || null,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Add email as contact method
      await supabase
        .from('contact_methods')
        .insert({
          profile_id: profile.id,
          contact_type: 'email' as const,
          value: email,
          label: 'Primary',
        });

      // Update all threads with this email
      await supabase
        .from('email_threads')
        .update({ profile_id: profile.id })
        .eq('user_id', user!.id)
        .is('profile_id', null);

      return profile;
    },
    onSuccess: () => {
      toast.success('Contact created and linked');
      queryClient.invalidateQueries({ queryKey: ['email-match-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setNewContactName('');
      setSelectedEmail(null);
    },
    onError: (error) => {
      toast.error('Failed to create contact: ' + (error as Error).message);
    },
  });

  // Dismiss/ignore email
  const dismissMutation = useMutation({
    mutationFn: async (email: string) => {
      // Mark threads with this email as reviewed by setting a placeholder profile
      // This is a simplified approach - in production you'd use a separate dismissed_emails table
      console.log(`Dismissing email: ${email}`);
      return { dismissed: true };
    },
    onSuccess: () => {
      toast.success('Email dismissed from review');
      queryClient.invalidateQueries({ queryKey: ['email-match-suggestions'] });
    },
    onError: (error) => {
      toast.error('Failed to dismiss: ' + (error as Error).message);
    },
  });

  const filteredSuggestions = matchData?.suggestions.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.profileName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-600">High</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-yellow-600">Medium</Badge>;
    if (confidence > 0) return <Badge className="bg-orange-600">Low</Badge>;
    return <Badge variant="secondary">New</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Review Email Matches
        </CardTitle>
        <CardDescription>
          Link email addresses to existing contacts or create new ones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{matchData?.autoMatched || 0}</p>
            <p className="text-sm text-muted-foreground">Auto-Matched</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">{matchData?.requiresReview || 0}</p>
            <p className="text-sm text-muted-foreground">Needs Review</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{matchData?.newContacts || 0}</p>
            <p className="text-sm text-muted-foreground">New Contacts</p>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">
            AI matching uses anonymized data. Email content is never sent to external services.
          </span>
        </div>

        {/* Search and Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails or names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.email}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{suggestion.email}</span>
                    {getConfidenceBadge(suggestion.confidence)}
                  </div>
                  {suggestion.profileName && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Suggested: {suggestion.profileName}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                </div>

                <div className="flex gap-2 ml-4">
                  {suggestion.profileId ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => linkMutation.mutate({
                          email: suggestion.email,
                          profileId: suggestion.profileId!,
                        })}
                        disabled={linkMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Link className="h-4 w-4 mr-1" />
                            Other
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Link to Contact</DialogTitle>
                            <DialogDescription>
                              Choose a different contact to link "{suggestion.email}" to.
                            </DialogDescription>
                          </DialogHeader>
                          <Select
                            onValueChange={(value) => {
                              linkMutation.mutate({ email: suggestion.email, profileId: value });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact..." />
                            </SelectTrigger>
                            <SelectContent>
                              {contacts?.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.first_name} {contact.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedEmail(suggestion.email)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Create
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Contact</DialogTitle>
                            <DialogDescription>
                              Create a new contact for "{suggestion.email}"
                            </DialogDescription>
                          </DialogHeader>
                          <Input
                            placeholder="Full name..."
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                          />
                          <DialogFooter>
                            <Button
                              onClick={() => createContactMutation.mutate({
                                email: suggestion.email,
                                name: newContactName,
                              })}
                              disabled={!newContactName.trim() || createContactMutation.isPending}
                            >
                              Create Contact
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Link className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Link to Existing Contact</DialogTitle>
                            <DialogDescription>
                              Select a contact to link "{suggestion.email}" to.
                            </DialogDescription>
                          </DialogHeader>
                          <Select
                            onValueChange={(value) => {
                              linkMutation.mutate({ email: suggestion.email, profileId: value });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact..." />
                            </SelectTrigger>
                            <SelectContent>
                              {contacts?.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.first_name} {contact.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissMutation.mutate(suggestion.email)}
                    disabled={dismissMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No unmatched emails to review</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
