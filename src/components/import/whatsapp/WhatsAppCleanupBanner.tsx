import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface WhatsAppCleanupBannerProps {
  conversationCount: number;
  onCleanup: () => Promise<{ deletedConversations: number; deletedMedia: number }>;
  onDismiss: () => void;
}

export function WhatsAppCleanupBanner({
  conversationCount,
  onCleanup,
  onDismiss,
}: WhatsAppCleanupBannerProps) {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [result, setResult] = useState<{ deletedConversations: number; deletedMedia: number } | null>(null);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const cleanupResult = await onCleanup();
      setResult(cleanupResult);
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (result) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <AlertTitle className="flex items-center gap-2">
          ✓ Cleanup Complete
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Removed {result.deletedConversations} empty conversation{result.deletedConversations !== 1 ? 's' : ''}
            {result.deletedMedia > 0 && ` and ${result.deletedMedia} orphaned media file${result.deletedMedia !== 1 ? 's' : ''}`}.
          </span>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Failed Import Detected</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          Found {conversationCount} empty conversation{conversationCount !== 1 ? 's' : ''} from a previous failed import. 
          Would you like to clean up?
        </span>
        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDismiss}
            disabled={isCleaningUp}
          >
            Ignore
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleCleanup}
            disabled={isCleaningUp}
          >
            {isCleaningUp ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Cleaning...</>
            ) : (
              <><Trash2 className="h-3 w-3 mr-1" /> Clean Up</>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
