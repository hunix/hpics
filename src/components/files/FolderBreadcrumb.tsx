import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderBreadcrumbProps {
  contactName?: string;
  onBackToFolders: () => void;
}

export function FolderBreadcrumb({ contactName, onBackToFolders }: FolderBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-sm mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={onBackToFolders}
      >
        <Home className="h-3.5 w-3.5" />
        All Contacts
      </Button>
      {contactName && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{contactName}</span>
        </>
      )}
    </div>
  );
}
