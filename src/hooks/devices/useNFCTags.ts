import { supabase } from '@/integrations/supabase/client';

export interface NFCContact {
  id: string;
  first_name: string;
  last_name: string | null;
}

export interface NFCTagRow {
  id: string;
  tag_id: string;
  tag_label: string;
  contact_id: string | null;
  created_at: string;
  contact?: { id: string; first_name: string; last_name: string };
  tap_count?: number;
  last_tapped?: string;
}

export async function fetchNFCTags(): Promise<NFCTagRow[]> {
  const { data, error } = await supabase
    .from('nfc_tags')
    .select(`
      *,
      profiles:contact_id (id, first_name, last_name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  type Row = NFCTagRow & { profiles: { id: string; first_name: string; last_name: string } | null };
  return ((data ?? []) as unknown as Row[]).map((tag) => ({
    ...tag,
    contact: tag.profiles ?? undefined,
  }));
}

export async function fetchAllProfilesMinimal(): Promise<NFCContact[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name');
  if (error) throw error;
  return ((data ?? []) as unknown) as NFCContact[];
}

export interface InsertNFCTagInput {
  tagId: string;
  tagLabel: string;
  contactId: string | null;
}

export async function insertNFCTag(input: InsertNFCTagInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('nfc_tags').insert({
    user_id: user.id,
    tag_id: input.tagId,
    tag_label: input.tagLabel,
    contact_id: input.contactId,
  });
  if (error) throw error;
}

export async function deleteNFCTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('nfc_tags').delete().eq('id', tagId);
  if (error) throw error;
}
