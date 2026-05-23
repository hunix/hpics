/**
 * useFamilySystems Hook
 * AGIS Phase 2 - Family Systems & Dynamics Analysis
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface FamilyRole {
  role: string;
  confidence: number;
  description: string;
  characteristics: string[];
}

export interface FamilySystemAnalysis {
  id: string;
  profileId: string;
  identifiedRole: FamilyRole;
  enmeshmentLevel: number;
  triangulationRisk: number;
  influenceStrategies: Array<{
    strategy: string;
    effectiveness: number;
    implementation: string;
  }>;
  loyaltyConflicts: Array<{
    conflict: string;
    severity: number;
    exploitationVector: string;
  }>;
  familyDynamics: {
    powerStructure: string;
    communicationPatterns: string[];
    unspokenRules: string[];
  };
  vulnerabilities: string[];
  createdAt: string | null;
}

export function useFamilySystems() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<Map<string, FamilySystemAnalysis>>(new Map());

  const analyzeSystem = async (
    profileId: string,
    additionalContext?: object
  ): Promise<FamilySystemAnalysis | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeFunction('family-systems-analyzer', { profileId, additionalContext });

      if (error) throw error;

      const analysis: FamilySystemAnalysis = {
        id: crypto.randomUUID(),
        profileId,
        identifiedRole: data.identifiedRole || {
          role: 'unknown',
          confidence: 0,
          description: '',
          characteristics: []
        },
        enmeshmentLevel: data.enmeshmentLevel || 0,
        triangulationRisk: data.triangulationRisk || 0,
        influenceStrategies: data.influenceStrategies || [],
        loyaltyConflicts: data.loyaltyConflicts || [],
        familyDynamics: data.familyDynamics || {
          powerStructure: '',
          communicationPatterns: [],
          unspokenRules: []
        },
        vulnerabilities: data.vulnerabilities || [],
        createdAt: new Date().toISOString()
      };

      // Save to database using actual column names
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const insertData = {
          user_id: user.id,
          profile_id: profileId,
          enmeshment_score: analysis.enmeshmentLevel,
          triangulation_patterns: { risk: analysis.triangulationRisk },
          family_structure: analysis.familyDynamics,
          scapegoat_indicators: { role: analysis.identifiedRole },
          golden_child_indicators: {},
          exploitation_opportunities: analysis.influenceStrategies,
          loyalty_conflicts: analysis.loyaltyConflicts,
          disengagement_score: 0,
          boundary_violations: analysis.vulnerabilities
        };
        await (supabase.from('family_system_analyses').insert as any)(insertData);
      }

      // Update local state
      setAnalyses(new Map(analyses.set(profileId, analysis)));

      toast.success('Family system analysis complete');
      return analysis;
    } catch (err) {
      console.error('Family systems analysis error:', err);
      toast.error('Failed to analyze family system');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadAnalysis = async (profileId: string): Promise<FamilySystemAnalysis | null> => {
    try {
      const { data, error } = await supabase
        .from('family_system_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const analysis: FamilySystemAnalysis = {
        id: data.id,
        profileId: data.profile_id || '',
        identifiedRole: (data.scapegoat_indicators as any)?.role || {
          role: 'unknown',
          confidence: 0,
          description: '',
          characteristics: []
        },
        enmeshmentLevel: data.enmeshment_score || 0,
        triangulationRisk: (data.triangulation_patterns as any)?.risk || 0,
        influenceStrategies: Array.isArray(data.exploitation_opportunities) 
          ? data.exploitation_opportunities as any[]
          : [],
        loyaltyConflicts: Array.isArray(data.loyalty_conflicts)
          ? data.loyalty_conflicts as any[]
          : [],
        familyDynamics: (data.family_structure as any) || {
          powerStructure: '',
          communicationPatterns: [],
          unspokenRules: []
        },
        vulnerabilities: Array.isArray(data.boundary_violations)
          ? data.boundary_violations as string[]
          : [],
        createdAt: data.created_at
      };

      setAnalyses(new Map(analyses.set(profileId, analysis)));
      return analysis;
    } catch (err) {
      console.error('Failed to load family analysis:', err);
      return null;
    }
  };

  return {
    isAnalyzing,
    analyses,
    analyzeSystem,
    loadAnalysis,
    getAnalysis: (profileId: string) => analyses.get(profileId)
  };
}
