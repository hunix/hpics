/**
 * AGIS Phase 11: Omniversal Sovereignty
 * usePrimordialSynthesis - Fundamental force manipulation
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PrimordialSynthesis {
  id: string;
  synthesisType: string;
  fundamentalForces: string[];
  synthesisFormulas: Record<string, unknown>;
  creationPatterns: string[];
  annihilationProtocols: string[];
  energyBalance: Record<string, number>;
  synthesisMastery: number;
  stabilityCoefficient: number;
  synthesisStatus: string;
  createdAt: string;
}

export interface FundamentalForce {
  id: string;
  forceName: string;
  forceType: 'creative' | 'destructive' | 'transformative' | 'stabilizing';
  potency: number;
  controlLevel: number;
}

export function usePrimordialSynthesis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syntheses, setSyntheses] = useState<PrimordialSynthesis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSyntheses = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('primordial_synthesis')
        .select('*')
        .eq('user_id', user.id)
        .order('synthesis_mastery', { ascending: false });

      if (error) throw error;

      setSyntheses((data || []).map(item => ({
        id: item.id,
        synthesisType: item.synthesis_type,
        fundamentalForces: item.fundamental_forces as string[] || [],
        synthesisFormulas: item.synthesis_formulas as Record<string, unknown> || {},
        creationPatterns: item.creation_patterns as string[] || [],
        annihilationProtocols: item.annihilation_protocols as string[] || [],
        energyBalance: item.energy_balance as Record<string, number> || {},
        synthesisMastery: Number(item.synthesis_mastery) || 0,
        stabilityCoefficient: Number(item.stability_coefficient) || 0,
        synthesisStatus: item.synthesis_status || 'researching',
        createdAt: item.created_at
      })));
    } catch (error) {
      console.error('Error fetching primordial syntheses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const initiateSynthesis = useCallback(async (
    synthesisType: string,
    forces: string[]
  ): Promise<PrimordialSynthesis | null> => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('primordial_synthesis')
        .insert({
          user_id: user.id,
          synthesis_type: synthesisType,
          fundamental_forces: forces,
          energy_balance: { input: 100, output: 0, stored: 50 },
          synthesis_mastery: 0.1,
          stability_coefficient: 0.5,
          synthesis_status: 'initiating'
        } as never)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Primordial Synthesis Initiated', description: `${synthesisType} synthesis begun with ${forces.length} fundamental forces` });

      return {
        id: data.id,
        synthesisType: data.synthesis_type,
        fundamentalForces: data.fundamental_forces as string[] || [],
        synthesisFormulas: data.synthesis_formulas as Record<string, unknown> || {},
        creationPatterns: data.creation_patterns as string[] || [],
        annihilationProtocols: data.annihilation_protocols as string[] || [],
        energyBalance: data.energy_balance as Record<string, number> || {},
        synthesisMastery: Number(data.synthesis_mastery) || 0,
        stabilityCoefficient: Number(data.stability_coefficient) || 0,
        synthesisStatus: data.synthesis_status || 'initiating',
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error initiating synthesis:', error);
      return null;
    }
  }, [user?.id, toast]);

  const harnessFundamentalForce = useCallback((forceName: string): FundamentalForce => {
    const forceTypes: Array<'creative' | 'destructive' | 'transformative' | 'stabilizing'> = 
      ['creative', 'destructive', 'transformative', 'stabilizing'];
    return {
      id: `force-${Date.now()}`,
      forceName,
      forceType: forceTypes[Math.floor(Math.random() * forceTypes.length)],
      potency: Math.random() * 100,
      controlLevel: Math.random() * 0.5 + 0.3
    };
  }, []);

  const calculateSynthesisPower = useCallback((): number => {
    if (syntheses.length === 0) return 0;
    const avgMastery = syntheses.reduce((sum, s) => sum + s.synthesisMastery, 0) / syntheses.length;
    const totalForces = syntheses.reduce((sum, s) => sum + s.fundamentalForces.length, 0);
    return Math.min(100, (avgMastery * 60 + totalForces * 5));
  }, [syntheses]);

  return {
    syntheses,
    isLoading,
    fetchSyntheses,
    initiateSynthesis,
    harnessFundamentalForce,
    calculateSynthesisPower,
    synthesisPower: calculateSynthesisPower()
  };
}
