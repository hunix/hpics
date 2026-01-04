import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import { CountryFlag } from './CountryFlag';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { relationship_subtype?: string; hierarchy_level?: string; country?: string | null };

interface ContactsListViewProps {
  contacts: Profile[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  relationshipColors: Record<string, string>;
}

export function ContactsListView({
  contacts,
  selectedIds,
  onSelectionChange,
  onToggleFavorite,
  relationshipColors,
}: ContactsListViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {contacts.map((contact) => {
        const display = contact.relationship_type 
          ? formatRelationshipDisplay(
              contact.relationship_type,
              contact.relationship_subtype || null,
              contact.hierarchy_level || null
            )
          : null;

        return (
          <div
            key={contact.id}
            className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/contacts/${contact.id}`)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(contact.id)}
                onCheckedChange={(checked) => onSelectionChange(contact.id, !!checked)}
              />
            </div>
            
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
              {contact.avatar_url ? (
                <img src={contact.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <>
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {contact.first_name} {contact.last_name}
                </span>
                {contact.country && <CountryFlag country={contact.country} size="sm" />}
                {display && (
                  <>
                    <Badge variant="secondary" className={`${relationshipColors[contact.relationship_type || '']} text-xs`}>
                      {display.primary}
                    </Badge>
                    {display.secondary && (
                      <Badge variant="outline" className="text-xs">
                        {display.secondary}
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {[contact.job_title, contact.organization].filter(Boolean).join(' at ')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {contact.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs hidden sm:inline-flex">
                  {tag}
                </Badge>
              ))}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(contact.id, contact.is_favorite ?? false);
                }}
              >
                <Star 
                  className={`h-4 w-4 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
