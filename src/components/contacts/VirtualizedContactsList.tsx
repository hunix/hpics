import { useRef, memo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import { CountryFlag } from './CountryFlag';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { 
  relationship_subtype?: string; 
  hierarchy_level?: string; 
  country?: string | null;
};

interface VirtualizedContactsListProps {
  contacts: Profile[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  relationshipColors: Record<string, string>;
  viewMode: 'cards' | 'list' | 'table';
}

// Memoized contact row to prevent unnecessary re-renders
const ContactRow = memo(function ContactRow({
  contact,
  isSelected,
  onSelectionChange,
  onToggleFavorite,
  relationshipColors,
  onClick,
}: {
  contact: Profile;
  isSelected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  relationshipColors: Record<string, string>;
  onClick: () => void;
}) {
  const display = contact.relationship_type
    ? formatRelationshipDisplay(
        contact.relationship_type,
        contact.relationship_subtype || null,
        contact.hierarchy_level || null
      )
    : null;

  return (
    <div
      className="flex items-center gap-4 p-3 border-b bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(contact.id, !!checked)}
        />
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
        {contact.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <>
            {contact.first_name?.[0]}
            {contact.last_name?.[0]}
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
              <Badge
                variant="secondary"
                className={`${relationshipColors[contact.relationship_type || '']} text-xs`}
              >
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
            className={`h-4 w-4 ${
              contact.is_favorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      </div>
    </div>
  );
});

export function VirtualizedContactsList({
  contacts,
  selectedIds,
  onSelectionChange,
  onToggleFavorite,
  relationshipColors,
}: VirtualizedContactsListProps) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const handleClick = useCallback(
    (id: string) => {
      navigate(`/contacts/${id}`);
    },
    [navigate]
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          ref={parentRef}
          className="h-[calc(100vh-280px)] overflow-auto"
          style={{ contain: 'strict' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const contact = contacts[virtualRow.index];
              return (
                <div
                  key={contact.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ContactRow
                    contact={contact}
                    isSelected={selectedIds.has(contact.id)}
                    onSelectionChange={onSelectionChange}
                    onToggleFavorite={onToggleFavorite}
                    relationshipColors={relationshipColors}
                    onClick={() => handleClick(contact.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with contact count */}
        <div className="px-4 py-2 border-t bg-muted/50 text-sm text-muted-foreground">
          Showing {contacts.length} contacts
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </div>
      </CardContent>
    </Card>
  );
}
