import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import { CountryFlag } from './CountryFlag';
import type { Profile as BaseProfile } from '@/types/database-helpers';

type Profile = BaseProfile & { relationship_subtype?: string; hierarchy_level?: string; country?: string | null };

interface ContactsCardsViewProps {
  contacts: Profile[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  relationshipColors: Record<string, string>;
}

export function ContactsCardsView({
  contacts,
  selectedIds,
  onSelectionChange,
  onToggleFavorite,
  relationshipColors,
}: ContactsCardsViewProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => {
        const display = contact.relationship_type 
          ? formatRelationshipDisplay(
              contact.relationship_type,
              contact.relationship_subtype || null,
              contact.hierarchy_level || null
            )
          : null;

        return (
          <Card 
            key={contact.id} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${selectedIds.has(contact.id) ? 'ring-2 ring-primary' : ''}`}
            onClick={() => navigate(`/contacts/${contact.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Selection Checkbox */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(contact.id)}
                    onCheckedChange={(checked) => onSelectionChange(contact.id, !!checked)}
                  />
                </div>

                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                  {contact.avatar_url ? (
                    <img src={contact.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <>
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    {contact.country && <CountryFlag country={contact.country} size="sm" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(contact.id, contact.is_favorite ?? false);
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
                    {display && (
                      <>
                        <Badge variant="secondary" className={relationshipColors[contact.relationship_type || '']}>
                          {display.primary}
                        </Badge>
                        {display.secondary && (
                          <Badge variant="outline" className="text-xs">
                            {display.secondary}
                          </Badge>
                        )}
                      </>
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
        );
      })}
    </div>
  );
}
