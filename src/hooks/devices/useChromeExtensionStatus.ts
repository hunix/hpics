import { supabase } from '@/integrations/supabase/client';

export interface ExtensionStatusData {
  isActive: boolean;
  lastSeen: Date | null;
}

export async function fetchExtensionStatus(thresholdMs: number): Promise<ExtensionStatusData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isActive: false, lastSeen: null };

  const { data, error } = await supabase
    .from('device_presence')
    .select('last_seen_at')
    .eq('user_id', user.id)
    .eq('device_type', 'chrome_extension')
    .maybeSingle();
  if (error) return { isActive: false, lastSeen: null };

  if (data?.last_seen_at) {
    const lastPingTime = new Date(data.last_seen_at);
    const isActive = (Date.now() - lastPingTime.getTime()) < thresholdMs;
    return { isActive, lastSeen: lastPingTime };
  }
  return { isActive: false, lastSeen: null };
}

export interface ExtensionSession {
  id: string;
  platform: string;
  profile_url: string | null;
  pages_captured: number | null;
  posts_captured: number | null;
  comments_captured: number | null;
  status: string | null;
  created_at: string | null;
}

export async function fetchExtensionSessions(limit = 10): Promise<ExtensionSession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('extension_scrape_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown) as ExtensionSession[];
}
