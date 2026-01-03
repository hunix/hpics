import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Star, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ContactDialog } from '@/components/contacts/ContactDialog';
import { ContactDetailDialog } from '@/components/contacts/ContactDetailDialog';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export default function Contacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', user?.id, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('first_name', { ascending: true });

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,organization.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
    <AppLayout title="Contacts">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {/* Contacts Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <Card 
                key={contact.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedContact(contact)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <>
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.is_favorite ?? false });
                          }}
                          className="shrink-0"
                        >
                          <Star 
                            className={`h-4 w-4 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                          />
                        </button>
                      </div>
                      {contact.organization && (
                        <p className="text-sm text-muted-foreground truncate">{contact.organization}</p>
                      )}
                      {contact.job_title && (
                        <p className="text-sm text-muted-foreground truncate">{contact.job_title}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contact.relationship_type && (
                          <Badge variant="secondary" className={relationshipColors[contact.relationship_type]}>
                            {contact.relationship_type}
                          </Badge>
                        )}
                        {contact.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
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
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start building your personal CRM by adding your first contact.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ContactDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedContact && (
        <ContactDetailDialog
          contact={selectedContact}
          open={!!selectedContact}
          onOpenChange={(open) => !open && setSelectedContact(null)}
        />
      )}
    </AppLayout>
  );
}
