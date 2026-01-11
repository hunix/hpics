import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit, Trash2, Star, Brain, Mail, UserCheck 
} from 'lucide-react';
import { ShareContactDialog } from '@/components/collaboration/ShareContactDialog';
import { ContactStorageBadge } from '@/components/contacts/ContactStorageBadge';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { 
  relationship_subtype?: string; 
  hierarchy_level?: string;
  is_self_profile?: boolean;
};

interface ContactDetailHeaderProps {
  contact: Profile;
  contactName: string;
  showAIPanel: boolean;
  onToggleAIPanel: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onSendEmail: () => void;
  onToggleSelfProfile: () => void;
}

const relationshipColors: Record<string, string> = {
  family: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  friend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  colleague: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  client: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  mentor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  mentee: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  acquaintance: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function ContactDetailHeader({
  contact,
  contactName,
  showAIPanel,
  onToggleAIPanel,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSendEmail,
  onToggleSelfProfile,
}: ContactDetailHeaderProps) {
  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg sm:text-xl shrink-0">
              {contact.avatar_url ? (
                <img src={contact.avatar_url} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover" />
              ) : (
                <>{contact.first_name?.[0]}{contact.last_name?.[0]}</>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap">
                <span className="truncate">{contact.first_name} {contact.last_name}</span>
                {contact.nickname && <span className="text-muted-foreground font-normal text-sm">({contact.nickname})</span>}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {contact.relationship_type && (() => {
                  const display = formatRelationshipDisplay(
                    contact.relationship_type,
                    contact.relationship_subtype || null,
                    contact.hierarchy_level || null
                  );
                  return (
                    <>
                      <Badge className={relationshipColors[contact.relationship_type]}>
                        {display.primary}
                      </Badge>
                      {display.secondary && (
                        <Badge variant="outline" className="hidden sm:inline-flex">
                          {display.secondary}
                        </Badge>
                      )}
                    </>
                  );
                })()}
                <ContactStorageBadge profileId={contact.id} />
                {contact.organization && (
                  <span className="text-sm text-muted-foreground hidden md:inline">{contact.organization}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button 
              variant={contact.is_self_profile ? "default" : "outline"} 
              size="sm"
              className="hidden sm:flex"
              onClick={onToggleSelfProfile}
              title="Mark this contact as yourself for family tree anchoring"
            >
              <UserCheck className={`h-4 w-4 mr-1 ${contact.is_self_profile ? '' : 'opacity-50'}`} />
              {contact.is_self_profile ? 'This is me' : 'Set as me'}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onSendEmail}
              title="Send Email"
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggleFavorite}>
              <Star className={`h-5 w-5 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
            <ShareContactDialog profileId={contact.id} profileName={contactName} />
            <Button 
              variant={showAIPanel ? "default" : "outline"} 
              size="icon" 
              onClick={onToggleAIPanel} 
              title="AI Insights" 
              className="hidden lg:flex"
            >
              <Brain className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (confirm('Are you sure you want to delete this contact?')) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
