import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Star } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface ContactsAvatarsViewProps {
  contacts: Profile[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export function ContactsAvatarsView({
  contacts,
  selectedIds,
  onSelectionChange,
  onToggleFavorite,
}: ContactsAvatarsViewProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex flex-col items-center p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors relative group"
          onClick={() => navigate(`/contacts/${contact.id}`)}
        >
          {/* Selection Checkbox - shows on hover */}
          <div 
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selectedIds.has(contact.id)}
              onCheckedChange={(checked) => onSelectionChange(contact.id, !!checked)}
              className={selectedIds.has(contact.id) ? 'opacity-100' : ''}
            />
          </div>

          {/* Favorite Star */}
          <button 
            className="absolute top-2 right-2"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(contact.id, contact.is_favorite ?? false);
            }}
          >
            <Star 
              className={`h-4 w-4 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'}`} 
            />
          </button>

          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold mb-2">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <>
                {contact.first_name?.[0]}{contact.last_name?.[0]}
              </>
            )}
          </div>

          {/* Name */}
          <span className="text-sm font-medium text-center truncate w-full">
            {contact.first_name}
          </span>
          <span className="text-xs text-muted-foreground text-center truncate w-full">
            {contact.last_name}
          </span>
        </div>
      ))}
    </div>
  );
}
