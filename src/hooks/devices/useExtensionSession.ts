import { supabase } from '@/integrations/supabase/client';

export interface ExtensionSessionData {
  token: string;
  expiresAt: Date;
}

export async function getExtensionSession(): Promise<ExtensionSessionData | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) return null;
  return {
    token: session.access_token,
    expiresAt: new Date(session.expires_at! * 1000),
  };
}
