/**
 * Elicitation Session Hook
 * Manages real-time conversation tracking with FBI elicitation techniques
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TranscriptEntry {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'target';
  content: string;
  techniqueUsed?: string;
  extractedInfo?: string;
  confidence?: number;
}

export interface ElicitationSession {
  id: string;
  profileId: string;
  objective: string;
  status: 'active' | 'paused' | 'completed';
  techniques: string[];
  transcript: TranscriptEntry[];
  extractedInfo: Array<{
    content: string;
    confidence: number;
    technique: string;
    timestamp: Date;
  }>;
  techniqueEffectiveness: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export function useElicitationSession(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Fetch all sessions for a profile
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['elicitation-sessions', profileId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const baseQuery = supabase
        .from('elicitation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      const query = profileId 
        ? baseQuery.eq('profile_id', profileId)
        : baseQuery;
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create new session
  const createSession = useMutation({
    mutationFn: async ({ objective, techniques }: { objective: string; techniques: string[] }) => {
      if (!user?.id || !profileId) throw new Error('Missing required data');
      
      const { data, error } = await supabase
        .from('elicitation_sessions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          session_type: 'active',
          techniques_used: techniques,
          conversation_transcript: [],
          technique_effectiveness: {},
          extracted_intelligence: [],
          conversation_notes: objective,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ['elicitation-sessions'] });
      toast.success('Elicitation session started');
    },
    onError: (error) => {
      toast.error(`Failed to create session: ${error.message}`);
    },
  });

  // Add transcript entry
  const addTranscriptEntry = useMutation({
    mutationFn: async ({ 
      sessionId, 
      entry 
    }: { 
      sessionId: string; 
      entry: Omit<TranscriptEntry, 'id' | 'timestamp'> 
    }) => {
      const { data: session, error: fetchError } = await supabase
        .from('elicitation_sessions')
        .select('conversation_transcript')
        .eq('id', sessionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentTranscript = (session?.conversation_transcript as any[]) || [];
      const newEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('elicitation_sessions')
        .update({
          conversation_transcript: [...currentTranscript, newEntry] as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elicitation-sessions'] });
    },
  });

  // Extract information from conversation
  const extractInfo = useMutation({
    mutationFn: async ({ 
      sessionId, 
      info 
    }: { 
      sessionId: string; 
      info: { content: string; confidence: number; technique: string } 
    }) => {
      const { data: session, error: fetchError } = await supabase
        .from('elicitation_sessions')
        .select('extracted_intelligence')
        .eq('id', sessionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentInfo = (session?.extracted_intelligence as any[]) || [];
      const newInfo = {
        ...info,
        timestamp: new Date().toISOString(),
        verified: false,
      };
      
      const { error } = await supabase
        .from('elicitation_sessions')
        .update({
          extracted_intelligence: [...currentInfo, newInfo] as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      return newInfo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elicitation-sessions'] });
      toast.success('Information extracted');
    },
  });

  // Complete session
  const completeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('elicitation_sessions')
        .update({
          session_type: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      setActiveSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['elicitation-sessions'] });
      toast.success('Session completed');
    },
  });

  // Get active session
  const activeSession = sessions?.find(s => s.id === activeSessionId);

  return {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    setActiveSessionId,
    createSession: createSession.mutate,
    addTranscriptEntry: addTranscriptEntry.mutate,
    extractInfo: extractInfo.mutate,
    completeSession: completeSession.mutate,
    isCreating: createSession.isPending,
  };
}
