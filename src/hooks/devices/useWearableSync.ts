import { supabase } from '@/integrations/supabase/client';

export async function loadWearableSyncSettings<T>(): Promise<T | null> {
  const { data } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'wearable_sync_settings')
    .single();
  if (data?.setting_value) {
    return JSON.parse(data.setting_value as string) as T;
  }
  return null;
}

export async function saveWearableSyncSettings<T>(settings: T): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('app_settings').upsert({
    user_id: user.id,
    setting_key: 'wearable_sync_settings',
    setting_value: JSON.stringify(settings),
  });
}

export async function loadLastWearableSync(): Promise<string | null> {
  const { data } = await supabase
    .from('device_sync_log')
    .select('synced_at')
    .in('device_type', ['galaxy_watch_ultra', 'galaxy_watch_7', 'apple_watch'])
    .order('synced_at', { ascending: false })
    .limit(1)
    .single();
  return data?.synced_at ?? null;
}
