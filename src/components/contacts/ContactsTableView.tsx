import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { relationship_subtype?: string; hierarchy_level?: string };

interface ContactsTableViewProps {
  contacts: Profile[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  relationshipColors: Record<string, string>;
}

export function ContactsTableView({
  contacts,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  onToggleFavorite,
  relationshipColors,
}: ContactsTableViewProps) {
  const navigate = useNavigate();
  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = someSelected;
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const display = contact.relationship_type 
              ? formatRelationshipDisplay(
                  contact.relationship_type,
                  contact.relationship_subtype || null,
                  contact.hierarchy_level || null
                )
              : null;

            return (
              <TableRow 
                key={contact.id}
                className="cursor-pointer"
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(contact.id)}
                    onCheckedChange={(checked) => onSelectionChange(contact.id, !!checked)}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onToggleFavorite(contact.id, contact.is_favorite ?? false)}>
                    <Star 
                      className={`h-4 w-4 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                    />
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <>
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </>
                      )}
                    </div>
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.organization || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.job_title || '-'}
                </TableCell>
                <TableCell>
                  {display && (
                    <Badge variant="secondary" className={relationshipColors[contact.relationship_type || '']}>
                      {display.primary}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(contact.tags?.length || 0) > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{(contact.tags?.length || 0) - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
