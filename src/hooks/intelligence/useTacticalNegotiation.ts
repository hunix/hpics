/**
 * Tactical Negotiation Hook
 * FBI-inspired negotiation tactics and strategy generation
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface NegotiationTactic {
  type: 'mirror' | 'label' | 'calibrated_question' | 'accusation_audit' | 'tactical_empathy';
  technique: string;
  example: string;
  timing: string;
  effectiveness: number;
}

export interface NegotiationStrategy {
  sessionId: string;
  profileId: string;
  negotiationType: string;
  overallStrategy: string;
  tactics: NegotiationTactic[];
  openingMove: string;
  concessionStrategy: string;
  walkAwayPoint: string;
  bestAlternative: string;
  psychologicalProfile: {
    negotiationStyle: string;
    pressurePoints: string[];
    decisionMakingPattern: string;
    timePreference: string;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
}

export interface NegotiationSession {
  id: string;
  profileId: string;
  negotiationType: string;
  status: 'planning' | 'active' | 'completed' | 'abandoned';
  strategy: NegotiationStrategy;
  notes: string[];
  outcome?: {
    success: boolean;
    result: string;
    lessonsLearned: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export function useTacticalNegotiation() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSession, setCurrentSession] = useState<NegotiationSession | null>(null);
  const [sessions, setSessions] = useState<NegotiationSession[]>([]);

  const generateStrategy = useCallback(async (
    profileId: string,
    negotiationType: string,
    context: {
      stakes?: string;
      deadline?: string;
      relationship?: string;
      previousOutcomes?: string[];
    } = {}
  ): Promise<NegotiationStrategy | null> => {
    if (!user) return null;
    setIsAnalyzing(true);

    try {
      const { data, error } = await invokeFunction('tactical-negotiation-engine', {
          userId: user.id,
          profileId,
          negotiationType,
          context,
          action: 'generate_strategy'
        });

      if (error) throw error;

      const strategy = data?.strategy as NegotiationStrategy;
      
      // Save session to database
      const { data: sessionData, error: sessionError } = await supabase
        .from('negotiation_sessions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          session_type: negotiationType,
          status: 'planning',
          strategy_data: strategy,
          context: context
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const session: NegotiationSession = {
        id: sessionData.id,
        profileId,
        negotiationType,
        status: 'planning',
        strategy,
        notes: [],
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at)
      };

      setCurrentSession(session);
      setSessions(prev => [session, ...prev]);
      toast.success('Negotiation strategy generated');

      return strategy;
    } catch (error) {
      console.error('Error generating negotiation strategy:', error);
      toast.error('Failed to generate strategy');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const getTacticSuggestion = useCallback(async (
    sessionId: string,
    currentSituation: string
  ): Promise<NegotiationTactic | null> => {
    if (!user || !currentSession) return null;

    try {
      const { data, error } = await invokeFunction('tactical-negotiation-engine', {
          userId: user.id,
          sessionId,
          currentSituation,
          existingStrategy: currentSession.strategy,
          action: 'suggest_tactic'
        });

      if (error) throw error;
      return data?.tactic as NegotiationTactic;
    } catch (error) {
      console.error('Error getting tactic suggestion:', error);
      return null;
    }
  }, [user, currentSession]);

  const updateSessionStatus = useCallback(async (
    sessionId: string,
    status: NegotiationSession['status'],
    outcome?: NegotiationSession['outcome']
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('negotiation_sessions')
        .update({
          status,
          outcome_data: outcome,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status, outcome, updatedAt: new Date() } : s
      ));

      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, status, outcome } : null);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }, [user, currentSession]);

  const loadSessions = useCallback(async (profileId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('negotiation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const loadedSessions: NegotiationSession[] = (data || []).map(s => ({
        id: s.id,
        profileId: s.profile_id || '',
        negotiationType: s.session_type || 'general',
        status: (s.outcome === 'completed' ? 'completed' : 'active') as NegotiationSession['status'],
        strategy: {
          sessionId: s.id,
          profileId: s.profile_id || '',
          negotiationType: s.session_type || '',
          overallStrategy: '',
          tactics: [],
          openingMove: '',
          concessionStrategy: '',
          walkAwayPoint: '',
          bestAlternative: '',
          psychologicalProfile: { negotiationStyle: '', pressurePoints: [], decisionMakingPattern: '', timePreference: '' },
          riskAssessment: { level: 'medium' as const, factors: [], mitigation: [] }
        },
        notes: [],
        outcome: s.outcome ? { success: (s.success_score || 0) > 0.5, result: s.outcome, lessonsLearned: (s.lessons_learned as string[]) || [] } : undefined,
        createdAt: new Date(s.created_at || new Date()),
        updatedAt: new Date(s.updated_at || new Date())
      }));

      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [user]);

  return {
    isAnalyzing,
    currentSession,
    sessions,
    generateStrategy,
    getTacticSuggestion,
    updateSessionStatus,
    loadSessions,
    setCurrentSession
  };
}
