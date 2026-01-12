/**
 * Native Contacts Hook
 * Sync phone contacts for face matching and relationship intelligence
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Contact types
interface PhoneContact {
  contactId: string;
  name?: {
    display?: string;
    given?: string;
    family?: string;
  };
  phones?: Array<{ type?: string; number?: string }>;
  emails?: Array<{ type?: string; address?: string }>;
  image?: { base64String?: string };
  organization?: { company?: string; title?: string };
  birthday?: string;
  note?: string;
}

interface SyncedContact {
  id: string;
  phoneContactId: string;
  name: string;
  phones: string[];
  emails: string[];
  organization?: string;
  title?: string;
  hasPhoto: boolean;
  linkedProfileId?: string;
  syncedAt: Date;
}

interface ContactSyncStats {
  totalContacts: number;
  newContacts: number;
  updatedContacts: number;
  withPhotos: number;
  linkedToProfiles: number;
  lastSyncAt?: Date;
}

interface UseNativeContactsReturn {
  contacts: SyncedContact[];
  isLoading: boolean;
  isSyncing: boolean;
  syncStats: ContactSyncStats | null;
  syncContacts: () => Promise<ContactSyncStats>;
  searchContacts: (query: string) => SyncedContact[];
  linkContactToProfile: (phoneContactId: string, profileId: string) => Promise<boolean>;
  getContactPhoto: (phoneContactId: string) => Promise<string | null>;
  findMatchingProfile: (contact: SyncedContact) => Promise<string | null>;
  importContactAsProfile: (phoneContactId: string) => Promise<string | null>;
}

export function useNativeContacts(): UseNativeContactsReturn {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<SyncedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<ContactSyncStats | null>(null);

  // Load synced contacts from database
  useEffect(() => {
    if (!user) return;

    const loadContacts = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('device_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (data) {
          setContacts(data.map((c: any) => ({
            id: c.id,
            phoneContactId: c.phone_contact_id,
            name: c.name,
            phones: c.phones || [],
            emails: c.emails || [],
            organization: c.organization,
            title: c.title,
            hasPhoto: c.has_photo || false,
            linkedProfileId: c.linked_profile_id,
            syncedAt: new Date(c.synced_at)
          })));
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, [user]);

  // Sync contacts from device
  const syncContacts = useCallback(async (): Promise<ContactSyncStats> => {
    if (!user) {
      return { totalContacts: 0, newContacts: 0, updatedContacts: 0, withPhotos: 0, linkedToProfiles: 0 };
    }

    setIsSyncing(true);
    const stats: ContactSyncStats = {
      totalContacts: 0,
      newContacts: 0,
      updatedContacts: 0,
      withPhotos: 0,
      linkedToProfiles: 0,
      lastSyncAt: new Date()
    };

    try {
      let deviceContacts: PhoneContact[] = [];

      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        // Dynamic import for native-only plugin
        try {
          const { Contacts } = await import('@capacitor/contacts');
          const result = await Contacts.getContacts({
            projection: {
              name: true,
              phones: true,
              emails: true,
              image: true,
              organization: true,
              birthday: true,
              note: true
            }
          });
          deviceContacts = result.contacts as PhoneContact[];
        } catch (e) {
          console.log('Contacts plugin not available');
        }
      }

      // For web/testing, use mock data or skip
      if (deviceContacts.length === 0) {
        toast.info('Contact sync requires native app');
        setIsSyncing(false);
        return stats;
      }

      stats.totalContacts = deviceContacts.length;

      // Get existing synced contacts
      const { data: existingContacts } = await supabase
        .from('device_contacts')
        .select('phone_contact_id, updated_at')
        .eq('user_id', user.id);

      const existingMap = new Map(
        (existingContacts || []).map((c: any) => [c.phone_contact_id, c.updated_at])
      );

      // Process each contact
      const contactsToUpsert = deviceContacts
        .filter(c => c.name?.display || c.name?.given)
        .map(contact => {
          const name = contact.name?.display || 
            `${contact.name?.given || ''} ${contact.name?.family || ''}`.trim();
          
          const phones = (contact.phones || [])
            .map(p => p.number)
            .filter((n): n is string => !!n);
          
          const emails = (contact.emails || [])
            .map(e => e.address)
            .filter((a): a is string => !!a);

          const hasPhoto = !!contact.image?.base64String;
          if (hasPhoto) stats.withPhotos++;

          const isNew = !existingMap.has(contact.contactId);
          if (isNew) stats.newContacts++;
          else stats.updatedContacts++;

          return {
            user_id: user.id,
            phone_contact_id: contact.contactId,
            name,
            phones,
            emails,
            organization: contact.organization?.company,
            title: contact.organization?.title,
            birthday: contact.birthday,
            notes: contact.note,
            has_photo: hasPhoto,
            photo_base64: contact.image?.base64String,
            synced_at: new Date().toISOString()
          };
        });

      // Batch upsert
      if (contactsToUpsert.length > 0) {
        const { error } = await supabase
          .from('device_contacts')
          .upsert(contactsToUpsert, {
            onConflict: 'user_id,phone_contact_id'
          });

        if (error) {
          console.error('Error syncing contacts:', error);
          toast.error('Failed to sync contacts');
        } else {
          toast.success(`Synced ${stats.totalContacts} contacts`);
        }
      }

      // Count linked profiles
      const { count } = await supabase
        .from('device_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('linked_profile_id', 'is', null);

      stats.linkedToProfiles = count || 0;

      setSyncStats(stats);

      // Reload contacts
      const { data: refreshedContacts } = await supabase
        .from('device_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (refreshedContacts) {
        setContacts(refreshedContacts.map((c: any) => ({
          id: c.id,
          phoneContactId: c.phone_contact_id,
          name: c.name,
          phones: c.phones || [],
          emails: c.emails || [],
          organization: c.organization,
          title: c.title,
          hasPhoto: c.has_photo || false,
          linkedProfileId: c.linked_profile_id,
          syncedAt: new Date(c.synced_at)
        })));
      }

    } catch (error) {
      console.error('Contact sync error:', error);
      toast.error('Contact sync failed');
    } finally {
      setIsSyncing(false);
    }

    return stats;
  }, [user]);

  // Search contacts
  const searchContacts = useCallback((query: string): SyncedContact[] => {
    if (!query.trim()) return contacts;
    
    const lowerQuery = query.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phones.some(p => p.includes(query)) ||
      c.emails.some(e => e.toLowerCase().includes(lowerQuery)) ||
      c.organization?.toLowerCase().includes(lowerQuery)
    );
  }, [contacts]);

  // Link contact to profile
  const linkContactToProfile = useCallback(async (
    phoneContactId: string,
    profileId: string
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('device_contacts')
      .update({ linked_profile_id: profileId })
      .eq('user_id', user.id)
      .eq('phone_contact_id', phoneContactId);

    if (!error) {
      setContacts(prev => prev.map(c => 
        c.phoneContactId === phoneContactId 
          ? { ...c, linkedProfileId: profileId }
          : c
      ));
      toast.success('Contact linked to profile');
      return true;
    }
    
    toast.error('Failed to link contact');
    return false;
  }, [user]);

  // Get contact photo
  const getContactPhoto = useCallback(async (
    phoneContactId: string
  ): Promise<string | null> => {
    if (!user) return null;

    const { data } = await supabase
      .from('device_contacts')
      .select('photo_base64')
      .eq('user_id', user.id)
      .eq('phone_contact_id', phoneContactId)
      .single();

    return data?.photo_base64 || null;
  }, [user]);

  // Find matching profile by name/email/phone
  const findMatchingProfile = useCallback(async (
    contact: SyncedContact
  ): Promise<string | null> => {
    if (!user) return null;

    // Search by exact name match first
    const { data: byName } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .ilike('full_name', contact.name)
      .limit(1)
      .single();

    if (byName) return byName.id;

    // Search by email
    for (const email of contact.emails) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .ilike('email', email)
        .limit(1)
        .single();

      if (byEmail) return byEmail.id;
    }

    // Search by phone
    for (const phone of contact.phones) {
      const { data: byPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .ilike('phone', `%${phone.replace(/\D/g, '').slice(-10)}%`)
        .limit(1)
        .single();

      if (byPhone) return byPhone.id;
    }

    return null;
  }, [user]);

  // Import contact as new profile
  const importContactAsProfile = useCallback(async (
    phoneContactId: string
  ): Promise<string | null> => {
    if (!user) return null;

    const contact = contacts.find(c => c.phoneContactId === phoneContactId);
    if (!contact) return null;

    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        full_name: contact.name,
        email: contact.emails[0] || null,
        phone: contact.phones[0] || null,
        company: contact.organization || null,
        title: contact.title || null,
        source: 'phone_contacts'
      })
      .select()
      .single();

    if (error || !data) {
      toast.error('Failed to create profile');
      return null;
    }

    // Link the contact to the new profile
    await linkContactToProfile(phoneContactId, data.id);

    // If contact has photo, try to extract face for biometrics
    const photo = await getContactPhoto(phoneContactId);
    if (photo) {
      try {
        await supabase.functions.invoke('enroll-from-contact-photo', {
          body: {
            profileId: data.id,
            photoBase64: photo
          }
        });
      } catch (e) {
        console.log('Face enrollment skipped');
      }
    }

    toast.success(`Created profile for ${contact.name}`);
    return data.id;
  }, [user, contacts, linkContactToProfile, getContactPhoto]);

  return {
    contacts,
    isLoading,
    isSyncing,
    syncStats,
    syncContacts,
    searchContacts,
    linkContactToProfile,
    getContactPhoto,
    findMatchingProfile,
    importContactAsProfile
  };
}
