import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface DecayContact {
  id: string;
  name: string;
  relationshipType: string;
  lastContactDate: Date | null;
  decayDays: number;
  isFavorite: boolean;
  email?: string;
  phone?: string;
}

export function DecayAlertWidget() {
  const { user } = useAuth();

  const { data: decayContacts, isLoading } = useQuery({
    queryKey: ['decay-contacts', user?.id],
    queryFn: async () => {
      // Fetch profiles with contact methods
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, relationship_type, is_favorite, last_contact_date,
          contact_methods(contact_type, value, is_primary)
        `)
        .eq('user_id', user!.id);

      if (!profiles) return [];

      // Fetch latest communications per profile
      const { data: comms } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false });

      // Fetch latest messages per profile
      const { data: msgs } = await supabase
        .from('messages')
        .select('sent_at, conversations!inner(profile_id)')
        .eq('user_id', user!.id)
        .order('sent_at', { ascending: false });

      const now = new Date();
      const contacts: DecayContact[] = [];

      for (const profile of profiles) {
        // Find last contact date from communications
        const lastComm = comms?.find(c => c.profile_id === profile.id);
        const lastMsg = msgs?.find(m => (m.conversations as any)?.profile_id === profile.id);

        const dates = [
          lastComm?.occurred_at ? new Date(lastComm.occurred_at) : null,
          lastMsg?.sent_at ? new Date(lastMsg.sent_at) : null,
          profile.last_contact_date ? new Date(profile.last_contact_date) : null,
        ].filter(Boolean) as Date[];

        const lastContactDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
        const decayDays = lastContactDate ? differenceInDays(now, lastContactDate) : 999;

        // Only include if decay is significant (>30 days for favorites, >60 for others)
        const threshold = profile.is_favorite ? 30 : 60;
        if (decayDays >= threshold) {
          const contactMethods = profile.contact_methods || [];
          const primaryEmail = contactMethods.find((m: any) => m.contact_type === 'email' && m.is_primary)?.value 
            || contactMethods.find((m: any) => m.contact_type === 'email')?.value;
          const primaryPhone = contactMethods.find((m: any) => m.contact_type === 'phone' && m.is_primary)?.value 
            || contactMethods.find((m: any) => m.contact_type === 'phone')?.value;

          contacts.push({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
            relationshipType: profile.relationship_type || 'other',
            lastContactDate,
            decayDays,
            isFavorite: profile.is_favorite || false,
            email: primaryEmail,
            phone: primaryPhone,
          });
        }
      }

      // Sort by favorites first, then by decay days
      return contacts.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return b.decayDays - a.decayDays;
      }).slice(0, 5);
    },
    enabled: !!user,
  });

  const handleEmail = (email: string, name: string) => {
    window.location.href = `mailto:${email}?subject=Hey ${name.split(' ')[0]}!`;
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=Hey ${encodeURIComponent(name.split(' ')[0])}!`, '_blank');
  };

  const getDecaySeverity = (days: number, isFavorite: boolean) => {
    if (isFavorite) {
      if (days >= 60) return 'destructive';
      if (days >= 30) return 'secondary';
    } else {
      if (days >= 90) return 'destructive';
      if (days >= 60) return 'secondary';
    }
    return 'outline';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={decayContacts && decayContacts.length > 0 ? 'border-orange-500/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${decayContacts && decayContacts.length > 0 ? 'text-orange-500' : ''}`} />
          Needs Attention
        </CardTitle>
        <CardDescription>
          Relationships that haven't had recent contact
        </CardDescription>
      </CardHeader>
      <CardContent>
        {decayContacts && decayContacts.length > 0 ? (
          <div className="space-y-3">
            {decayContacts.map((contact) => (
              <a 
                key={contact.id} 
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.isFavorite && (
                      <span className="text-yellow-500">★</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getDecaySeverity(contact.decayDays, contact.isFavorite) as any}>
                      <Clock className="h-3 w-3 mr-1" />
                      {contact.decayDays} days
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {contact.relationshipType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                  {contact.email && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => { e.preventDefault(); handleEmail(contact.email!, contact.name); }}
                      title="Send email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  {contact.phone && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => { e.preventDefault(); handleCall(contact.phone!); }}
                        title="Call"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-green-600"
                        onClick={(e) => { e.preventDefault(); handleWhatsApp(contact.phone!, contact.name); }}
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </a>
            ))}
            <Button variant="outline" className="w-full mt-2" onClick={() => window.location.href = '/network'}>
              View Full Network
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-muted-foreground">
              All your relationships are well-maintained!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Keep up the great work staying connected.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
