import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isDeleting,
}: BulkDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {selectedCount} contact{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action <strong>cannot be undone</strong>. This will permanently delete the selected 
              contact{selectedCount > 1 ? 's' : ''} and all associated data including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Contact methods (emails, phones, addresses)</li>
              <li>Communications and messages</li>
              <li>Events and reminders</li>
              <li>Education, skills, and certifications</li>
              <li>Documents, media, and recordings</li>
              <li>Observations and analyses</li>
              <li>Financial records and transactions</li>
              <li>Relationship scores and goals</li>
              <li>All other related data</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${selectedCount} contact${selectedCount > 1 ? 's' : ''}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
