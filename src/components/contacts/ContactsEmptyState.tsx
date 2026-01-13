import { Users, Plus, Upload } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface ContactsEmptyStateProps {
  hasFilters: boolean;
  onAddContact: () => void;
  onImport: () => void;
  onClearFilters?: () => void;
}

export function ContactsEmptyState({
  hasFilters,
  onAddContact,
  onImport,
  onClearFilters,
}: ContactsEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts match your filters"
        description="Try adjusting your search or filters to find what you're looking for."
        action={
          onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Users}
      title="No contacts yet"
      description="Start building your personal CRM by adding your first contact or importing from your existing contacts."
      action={
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button onClick={onAddContact}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Contact
          </Button>
          <Button variant="outline" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
        </div>
      }
    />
  );
}
