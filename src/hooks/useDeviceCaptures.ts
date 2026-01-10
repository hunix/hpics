// Hook for device capture management
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DeviceType = 'chrome_extension' | 'mobile_app' | 'wearable' | 'voice_recorder' | 'other';
export type CaptureType = 'social_profile' | 'health_data' | 'voice_sample' | 'photo' | 'document' | 'other';

export interface DeviceCapture {
  id: string;
  device_source: string;
  capture_type: CaptureType;
  source_url?: string;
  extracted_data: Record<string, unknown>;
  profile_id?: string;
  confidence_score: number;
  status: string;
  captured_at: string;
  created_at: string;
}

export function useDeviceCaptures(profileId?: string) {
  const { user } = useAuth();
  const [captures, setCaptures] = useState<DeviceCapture[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCaptures = useCallback(async (limit = 100) => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from('device_captures')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at', { ascending: false })
        .limit(limit);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setCaptures(data as unknown as DeviceCapture[]);
      }
    } catch (err) {
      console.error('Failed to fetch captures:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profileId]);

  const processCapture = useCallback(async (captureId: string): Promise<boolean> => {
    if (!user?.id) return false;

    setIsProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('process-device-capture', {
        body: { captureId },
      });

      if (error) throw error;
      
      toast.success('Capture processed');
      fetchCaptures();
      return true;
    } catch {
      toast.error('Failed to process capture');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, fetchCaptures]);

  const linkToProfile = useCallback(async (captureId: string, targetProfileId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('device_captures')
        .update({ profile_id: targetProfileId })
        .eq('id', captureId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCaptures(prev => prev.map(c => c.id === captureId ? { ...c, profile_id: targetProfileId } : c));
      toast.success('Capture linked');
      return true;
    } catch {
      return false;
    }
  }, [user?.id]);

  const deleteCapture = useCallback(async (captureId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('device_captures')
        .delete()
        .eq('id', captureId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCaptures(prev => prev.filter(c => c.id !== captureId));
      toast.success('Capture deleted');
      return true;
    } catch {
      return false;
    }
  }, [user?.id]);

  const getStats = useCallback(() => ({
    total: captures.length,
    pending: captures.filter(c => c.status === 'pending').length,
    linked: captures.filter(c => c.profile_id).length,
  }), [captures]);

  useEffect(() => { fetchCaptures(); }, [fetchCaptures]);

  return {
    captures,
    isLoading,
    isProcessing,
    stats: getStats(),
    fetchCaptures,
    processCapture,
    linkToProfile,
    deleteCapture,
  };
}
