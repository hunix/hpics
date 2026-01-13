import { Plus, Upload, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCompactNumber } from '@/lib/design-system';

interface ContactsPageHeaderProps {
  totalCount: number;
  selectedCount: number;
  onAddContact: () => void;
  onImport: () => void;
  onBulkDelete: () => void;
}

export function ContactsPageHeader({
  totalCount,
  selectedCount,
  onAddContact,
  onImport,
  onBulkDelete,
}: ContactsPageHeaderProps) {
  return (
    <PageHeader
      title="Contacts"
      subtitle={`${formatCompactNumber(totalCount)} total contacts in your network`}
      icon={Users}
      badge={
        selectedCount > 0 ? (
          <Badge variant="secondary" className="ml-2">
            {selectedCount} selected
          </Badge>
        ) : undefined
      }
      actions={
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
            >
              Delete ({selectedCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={onAddContact}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      }
    />
  );
}
