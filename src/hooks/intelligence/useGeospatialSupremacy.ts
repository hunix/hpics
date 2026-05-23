import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface GeospatialDominion {
  id: string;
  userId: string;
  dominionName: string;
  dominionType: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  controlLevel: number;
  strategicValue: number;
  resourceDensity: Record<string, unknown>;
  threatAssessment: Record<string, unknown>;
  createdAt: string | null;
}

export interface TerritorialAsset {
  id: string;
  userId: string;
  dominionId?: string;
  assetType: string;
  assetName: string;
  latitude: number;
  longitude: number;
  assetValue: number;
  protectionLevel: number;
  vulnerabilities: string[];
  createdAt: string | null;
}

export interface MovementPattern {
  id: string;
  userId: string;
  profileId?: string;
  patternType: string;
  routeData: Record<string, unknown>[];
  frequencyAnalysis: Record<string, unknown>;
  predictabilityScore: number;
  interceptPoints: Record<string, unknown>[];
  createdAt: string | null;
}

export function useGeospatialSupremacy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Return empty arrays - tables will be created via edge function
  const { data: dominions, isLoading: dominionsLoading } = useQuery({
    queryKey: ['geospatial-dominions', user?.id],
    queryFn: async (): Promise<GeospatialDominion[]> => {
      return [];
    },
    enabled: !!user,
  });

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['territorial-assets', user?.id],
    queryFn: async (): Promise<TerritorialAsset[]> => {
      return [];
    },
    enabled: !!user,
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['movement-patterns', user?.id],
    queryFn: async (): Promise<MovementPattern[]> => {
      return [];
    },
    enabled: !!user,
  });

  const analyzeGeospatial = useMutation({
    mutationFn: async (input: { action?: 'map_dominion' | 'analyze_movements' | 'identify_assets' | 'export_kml'; targetArea?: { lat: number; lng: number; radius: number } }) => {
      const { data, error } = await invokeFunction('geospatial-supremacy-engine', {
          userId: user!.id,
          action: input.action || 'map_dominion',
          targetArea: input.targetArea
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geospatial-dominions'] });
      queryClient.invalidateQueries({ queryKey: ['territorial-assets'] });
      queryClient.invalidateQueries({ queryKey: ['movement-patterns'] });
    }
  });

  const exportToKml = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('geospatial-supremacy-engine', {
          userId: user!.id,
          action: 'export_kml'
        });
      if (error) throw error;
      return data;
    }
  });

  return {
    dominions,
    assets,
    patterns,
    isLoading: dominionsLoading || assetsLoading || patternsLoading,
    analyzeGeospatial: analyzeGeospatial.mutateAsync,
    exportToKml: exportToKml.mutateAsync,
    isAnalyzing: analyzeGeospatial.isPending,
    isExporting: exportToKml.isPending,
    totalControlledArea: dominions?.reduce((sum, d) => sum + (Math.PI * d.radiusKm * d.radiusKm), 0) || 0,
    highValueAssets: assets?.filter(a => a.assetValue > 0.7) || [],
    predictableTargets: patterns?.filter(p => p.predictabilityScore > 0.7) || []
  };
}
