// Session Timeout Provider - Wraps app with session timeout functionality
import { useSessionTimeout } from '@/hooks/security/useSessionTimeout';
import { SessionTimeoutWarning } from '@/components/reliability/SessionTimeoutWarning';
import { useAuth } from '@/hooks/useAuth';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export function SessionTimeoutProvider({
  children,
  timeoutMinutes = 30,
  warningMinutes = 5,
}: SessionTimeoutProviderProps) {
  const { user } = useAuth();
  
  const {
    isWarningShown,
    formattedTimeRemaining,
    timeRemaining,
    extendSession,
    forceLogout,
  } = useSessionTimeout({
    timeoutMs: timeoutMinutes * 60 * 1000,
    warningBeforeMs: warningMinutes * 60 * 1000,
    enabled: !!user,
  });

  // Convert ms to seconds for the component
  const secondsRemaining = Math.floor(timeRemaining / 1000);

  return (
    <>
      {children}
      <SessionTimeoutWarning
        isOpen={isWarningShown}
        timeRemaining={formattedTimeRemaining}
        secondsRemaining={secondsRemaining}
        onExtendSession={extendSession}
        onLogout={forceLogout}
      />
    </>
  );
}
