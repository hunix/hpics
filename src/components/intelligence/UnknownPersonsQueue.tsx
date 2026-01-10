import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserX, User, UserPlus, Link as LinkIcon, X, Eye, Search, Filter
} from 'lucide-react';

interface UnknownPersonsQueueProps {
  profileId?: string;
}

export function UnknownPersonsQueue({ profileId }: UnknownPersonsQueueProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStatus, setSelectedStatus] = useState<string>('unidentified');
  const [searchQuery, setSearchQuery] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch unknown persons
  const { data: persons, isLoading } = useQuery({
    queryKey: ['unknown-persons', profileId, selectedStatus, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('unknown_persons')
        .select(`*`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch profiles for assignment
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user!.id)
        .order('first_name');
      if (error) throw error;
      return (data || []).map(p => ({ ...p, full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() }));
    },
    enabled: !!user,
  });

  // Assign to existing profile
  const assignMutation = useMutation({
    mutationFn: async ({ personId, profileId }: { personId: string; profileId: string }) => {
      const { error } = await supabase
        .from('unknown_persons')
        .update({
          assigned_profile_id: profileId,
          status: 'identified',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', personId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unknown-persons'] });
      toast({ title: 'Person assigned to contact' });
      setSelectedPerson(null);
    },
  });

  // Create new contact from unknown person
  const createContactMutation = useMutation({
    mutationFn: async ({ personId, name }: { personId: string; name: string }) => {
      // Get the person data
      const { data: person } = await supabase
        .from('unknown_persons')
        .select('*')
        .eq('id', personId)
        .single();

      if (!person) throw new Error('Person not found');

      const nameParts = name.trim().split(' ');
      // Create new profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          first_name: nameParts[0] || name,
          last_name: nameParts.slice(1).join(' ') || undefined,
          relationship_type: 'other',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update unknown person with new profile
      const { error: updateError } = await supabase
        .from('unknown_persons')
        .update({
          assigned_profile_id: newProfile.id,
          status: 'new_contact_created',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', personId);

      if (updateError) throw updateError;

      // If we have facial features, create biometric entry
      if (person.facial_features) {
        await supabase.from('contact_biometrics').insert({
          user_id: user!.id,
          profile_id: newProfile.id,
          facial_features: person.facial_features,
          facial_confidence: 0.5,
          last_updated: new Date().toISOString(),
        });
      }

      return newProfile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['unknown-persons'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ 
        title: 'Contact created', 
        description: `${profile.full_name} has been added to your contacts.` 
      });
      setShowCreateDialog(false);
      setNewContactName('');
      setSelectedPerson(null);
    },
  });

  // Ignore person
  const ignoreMutation = useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from('unknown_persons')
        .update({ status: 'ignored' })
        .eq('id', personId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unknown-persons'] });
      toast({ title: 'Person ignored' });
    },
  });

  const unidentifiedCount = persons?.filter(p => p.status === 'unidentified').length || 0;
  const identifiedCount = persons?.filter(p => p.status === 'identified' || p.status === 'new_contact_created').length || 0;

  // Get signed URL for cropped face image
  const getImageUrl = async (person: any) => {
    if (person.cropped_image_url) return person.cropped_image_url;
    if (person.media?.storage_path) {
      const { data } = await supabase.storage
        .from('media')
        .createSignedUrl(person.media.storage_path, 3600);
      return data?.signedUrl;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Unknown Persons
            </CardTitle>
            <CardDescription>
              Unidentified faces detected in your media
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{unidentifiedCount} to review</Badge>
            <Badge variant="secondary">{identifiedCount} identified</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unidentified">Unidentified</SelectItem>
              <SelectItem value="identified">Identified</SelectItem>
              <SelectItem value="new_contact_created">New Contact</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Persons grid */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : persons?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <UserX className="h-8 w-8 mb-2" />
              <p>No unknown persons found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {persons?.map((person) => (
                <div
                  key={person.id}
                  className="relative group rounded-lg border bg-card overflow-hidden"
                >
                  {/* Face thumbnail */}
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {person.cropped_image_url ? (
                      <img 
                        src={person.cropped_image_url} 
                        alt="Detected face" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info overlay */}
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant={person.status === 'unidentified' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {person.status}
                      </Badge>
                    </div>
                    {person.estimated_age_range && (
                      <p className="text-xs text-muted-foreground">
                        {person.estimated_age_range} • {person.estimated_gender || 'Unknown'}
                      </p>
                    )}
                    {person.assigned_profile?.full_name && (
                      <p className="text-xs font-medium truncate">
                        → {person.assigned_profile.full_name}
                      </p>
                    )}
                  </div>

                  {/* Action buttons (on hover) */}
                  {person.status === 'unidentified' && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => setSelectedPerson(person)}
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign to Contact</DialogTitle>
                            <DialogDescription>
                              Select an existing contact or create a new one.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            {/* Person preview */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                              <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center overflow-hidden">
                                {person.cropped_image_url ? (
                                  <img 
                                    src={person.cropped_image_url} 
                                    alt="Face" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="h-8 w-8" />
                                )
                              }
                              </div>
                              <div>
                                <p className="text-sm">
                                  {person.estimated_age_range} • {person.estimated_gender}
                                </p>
                                {person.facial_features?.distinctive_features?.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {person.facial_features.distinctive_features.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Create new contact option */}
                            <div className="border-b pb-4">
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setShowCreateDialog(true)}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create New Contact
                              </Button>
                            </div>

                            {/* Existing contacts list */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Or assign to existing:</Label>
                              <ScrollArea className="h-[200px] mt-2">
                                <div className="space-y-1">
                                  {profiles?.map((profile) => (
                                    <button
                                      key={profile.id}
                                      onClick={() => assignMutation.mutate({ 
                                        personId: person.id, 
                                        profileId: profile.id 
                                      })}
                                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={profile.avatar_url || undefined} />
                                        <AvatarFallback>
                                          {profile.full_name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{profile.full_name}</span>
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => ignoreMutation.mutate(person.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Create contact dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
              <DialogDescription>
                Create a new contact from this unidentified person.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  placeholder="Enter name..."
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPerson && newContactName.trim()) {
                      createContactMutation.mutate({
                        personId: selectedPerson.id,
                        name: newContactName.trim(),
                      });
                    }
                  }}
                  disabled={!newContactName.trim() || createContactMutation.isPending}
                >
                  {createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
