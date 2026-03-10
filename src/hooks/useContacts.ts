/**
 * useContacts — Lightweight contact list hook
 * 
 * Provides a simple query returning all user contacts (profiles).
 * For advanced features (infinite scroll, filtering), use @/domains/profile hooks.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ContactSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  job_title: string | null;
  relationship_type: string | null;
}

export function useContacts() {
  const { user } = useAuth();

  return useQuery<ContactSummary[]>({
    queryKey: ["contacts-simple", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, organization, job_title, relationship_type")
        .eq("user_id", user!.id)
        .order("first_name")
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as ContactSummary[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
