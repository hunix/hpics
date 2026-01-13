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
          <AlertDialogCancel 
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onExtendSession}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}