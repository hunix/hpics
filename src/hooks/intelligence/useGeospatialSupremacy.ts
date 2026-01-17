import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  createdAt: string;
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
  createdAt: string;
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
  createdAt: string;
}

export function useGeospatialSupremacy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dominions, isLoading: dominionsLoading } = useQuery({
    queryKey: ['geospatial-dominions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geospatial_dominions')
        .select('*')
        .eq('user_id', user!.id)
        .order('control_level', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        dominionName: row.dominion_name,
        dominionType: row.dominion_type,
        centerLatitude: row.center_latitude || 0,
        centerLongitude: row.center_longitude || 0,
        radiusKm: row.radius_km || 0,
        controlLevel: row.control_level || 0,
        strategicValue: row.strategic_value || 0,
        resourceDensity: row.resource_density as Record<string, unknown> || {},
        threatAssessment: row.threat_assessment as Record<string, unknown> || {},
        createdAt: row.created_at
      })) as GeospatialDominion[];
    },
    enabled: !!user,
  });

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['territorial-assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('territorial_assets')
        .select('*')
        .eq('user_id', user!.id)
        .order('asset_value', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        dominionId: row.dominion_id,
        assetType: row.asset_type,
        assetName: row.asset_name,
        latitude: row.latitude || 0,
        longitude: row.longitude || 0,
        assetValue: row.asset_value || 0,
        protectionLevel: row.protection_level || 0,
        vulnerabilities: row.vulnerabilities || [],
        createdAt: row.created_at
      })) as TerritorialAsset[];
    },
    enabled: !!user,
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['movement-patterns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movement_patterns')
        .select('*')
        .eq('user_id', user!.id)
        .order('predictability_score', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        patternType: row.pattern_type,
        routeData: row.route_data as Record<string, unknown>[] || [],
        frequencyAnalysis: row.frequency_analysis as Record<string, unknown> || {},
        predictabilityScore: row.predictability_score || 0,
        interceptPoints: row.intercept_points as Record<string, unknown>[] || [],
        createdAt: row.created_at
      })) as MovementPattern[];
    },
    enabled: !!user,
  });

  const analyzeGeospatial = useMutation({
    mutationFn: async (input: { action?: 'map_dominion' | 'analyze_movements' | 'identify_assets' | 'export_kml'; targetArea?: { lat: number; lng: number; radius: number } }) => {
      const { data, error } = await supabase.functions.invoke('geospatial-supremacy-engine', {
        body: {
          userId: user!.id,
          action: input.action || 'map_dominion',
          targetArea: input.targetArea
        }
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
      const { data, error } = await supabase.functions.invoke('geospatial-supremacy-engine', {
        body: {
          userId: user!.id,
          action: 'export_kml'
        }
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
