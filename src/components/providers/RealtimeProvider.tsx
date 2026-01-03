import { ReactNode } from 'react';
import { useRealtimeContacts } from '@/hooks/useRealtimeContacts';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Initialize realtime subscriptions
  useRealtimeContacts();
  
  return <>{children}</>;
}
