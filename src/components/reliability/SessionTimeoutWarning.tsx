// Session Timeout Warning Dialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  timeRemaining: string;
  secondsRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({
  isOpen,
  timeRemaining,
  secondsRemaining,
  onExtendSession,
  onLogout,
}: SessionTimeoutWarningProps) {
  const isUrgent = secondsRemaining <= 60;
  
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className={cn(
              "h-5 w-5",
              isUrgent ? "text-destructive animate-pulse" : "text-warning"
            )} />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Your session will expire due to inactivity. You will be logged out in:
            </p>
            <div className={cn(
              "text-3xl font-mono font-bold text-center py-4 rounded-lg",
              isUrgent 
                ? "bg-destructive/10 text-destructive" 
                : "bg-warning/10 text-warning"
            )}>
              {timeRemaining}
            </div>
            <p className="text-sm">
              Click "Stay Logged In" to continue your session, or "Log Out" to end it now.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              onClick={onExtendSession}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Stay Logged In
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}