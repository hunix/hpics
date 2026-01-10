import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeContacts } from '@/hooks/useRealtimeContacts';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, loading } = useAuth();
  
  // Only initialize realtime subscriptions when user is authenticated
  // This prevents errors when running queries before auth is ready
  useRealtimeContacts();
  
  return <>{children}</>;
}
