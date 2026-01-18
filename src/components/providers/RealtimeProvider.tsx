import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeContacts } from '@/hooks/useRealtimeContacts';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, loading } = useAuth();

  // FIXED: Actually check authentication state before enabling subscriptions
  // This prevents errors when running queries before auth is ready
  const isEnabled = !!user && !loading;

  // Pass enabled flag to realtime hook
  useRealtimeContacts(isEnabled);

  return <>{children}</>;
}
