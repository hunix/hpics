import { useRef, memo, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2 } from 'lucide-react';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import { CountryFlag } from './CountryFlag';
import type { Profile as BaseProfile } from '@/types/database-helpers';

type Profile = BaseProfile & { 
  relationship_subtype?: string; 
  hierarchy_level?: string; 
  country?: string | null;
};

interface VirtualizedContactsGridProps {
  contacts: Profile[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  relationshipColors: Record<string, string>;
  columns?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  totalCount?: number;
}

const ContactCard = memo(function ContactCard({
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
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow h-full ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
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
              <h3 className="font-semibold truncate text-sm">
                {contact.first_name} {contact.last_name}
              </h3>
              {contact.country && <CountryFlag country={contact.country} size="sm" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(contact.id, contact.is_favorite ?? false);
                }}
                className="shrink-0 ml-auto"
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
            {contact.organization && (
              <p className="text-xs text-muted-foreground truncate">{contact.organization}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {display && (
                <>
                  <Badge
                    variant="secondary"
                    className={`${relationshipColors[contact.relationship_type || '']} text-xs`}
                  >
                    {display.primary}
                  </Badge>
                  {display.secondary && (
                    <Badge variant="outline" className="text-[10px]">
                      {display.secondary}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function VirtualizedContactsGrid({
  contacts,
  selectedIds,
  onSelectionChange,
  onToggleFavorite,
  relationshipColors,
  columns = 3,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  totalCount,
}: VirtualizedContactsGridProps) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Calculate rows based on columns
  const rows = Math.ceil(contacts.length / columns);

  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 3,
  });

  // Track user interaction - only allow infinite scroll after user scrolls
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const markUserScrolled = () => {
      userHasScrolledRef.current = true;
    };

    scrollElement.addEventListener('wheel', markUserScrolled, { passive: true, once: true });
    scrollElement.addEventListener('touchmove', markUserScrolled, { passive: true, once: true });
    
    return () => {
      scrollElement.removeEventListener('wheel', markUserScrolled);
      scrollElement.removeEventListener('touchmove', markUserScrolled);
    };
  }, []);

  // Scroll-based infinite loading - only triggers after user interaction
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || !fetchNextPage) return;

    const handleScroll = () => {
      // Only load more if user has actually scrolled
      if (!userHasScrolledRef.current) return;
      if (!hasNextPage || isFetchingNextPage) return;
      
      // Throttle: only fetch once per 500ms
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 500) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      // Load more when 300px from bottom
      if (scrollHeight - scrollTop - clientHeight < 300) {
        lastFetchTimeRef.current = now;
        fetchNextPage();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClick = useCallback(
    (id: string) => {
      navigate(`/contacts/${id}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-2">
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
            const startIndex = virtualRow.index * columns;
            const rowContacts = contacts.slice(startIndex, startIndex + columns);

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: '1rem',
                  padding: '0 0.25rem',
                }}
              >
                {rowContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedIds.has(contact.id)}
                    onSelectionChange={onSelectionChange}
                    onToggleFavorite={onToggleFavorite}
                    relationshipColors={relationshipColors}
                    onClick={() => handleClick(contact.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Loading indicator inside scroll container */}
        {isFetchingNextPage && (
          <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2 text-sm text-muted-foreground">
        {totalCount !== undefined ? (
          <>
            Showing {contacts.length} of {totalCount} contacts
            {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
            {!hasNextPage && contacts.length === totalCount && ' • All loaded'}
          </>
        ) : (
          <>
            Showing {contacts.length} contacts
            {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
          </>
        )}
      </div>
    </div>
  );
}
