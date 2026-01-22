/**
 * Bulk Email Analysis Hook (v3.9.33)
 * Processes email intelligence for multiple contacts at once
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ContactEmailStats {
  profileId: string;
  contactName: string;
  threadCount: number;
  messageCount: number;
  hasAnalysis: boolean;
  lastAnalyzedAt?: string;
}

export interface BulkAnalysisProgress {
  current: number;
  total: number;
  currentContact: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  results: Array<{
    profileId: string;
    success: boolean;
    insightsCount: number;
    error?: string;
  }>;
}

export function useBulkEmailAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<BulkAnalysisProgress>({
    current: 0,
    total: 0,
    currentContact: '',
    status: 'idle',
    results: [],
  });

  // Fetch all contacts with email threads
  const { data: contactsWithEmails, isLoading: loadingContacts, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts-with-email-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all profiles that have email threads
      const { data: threads, error: threadsError } = await supabase
        .from('email_threads')
        .select(`
          profile_id,
          message_count,
          profiles!inner (
            id,
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .not('profile_id', 'is', null);

      if (threadsError) throw threadsError;
      if (!threads || threads.length === 0) return [];

      // Aggregate by profile
      const profileMap = new Map<string, ContactEmailStats>();
      
      for (const thread of threads) {
        const profileId = thread.profile_id!;
        const profile = thread.profiles as any;
        const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown';
        
        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, {
            profileId,
            contactName: name,
            threadCount: 0,
            messageCount: 0,
            hasAnalysis: false,
          });
        }
        
        const stats = profileMap.get(profileId)!;
        stats.threadCount++;
        stats.messageCount += thread.message_count || 0;
      }

      // Check which profiles have existing email analysis
      const profileIds = Array.from(profileMap.keys());
      if (profileIds.length > 0) {
        const { data: analyses } = await supabase
          .from('ai_analyses')
          .select('profile_id, generated_at')
          .in('profile_id', profileIds)
          .eq('analysis_type', 'email_insight')
          .order('generated_at', { ascending: false });

        if (analyses) {
          const latestByProfile = new Map<string, string>();
          for (const a of analyses) {
            if (a.profile_id && !latestByProfile.has(a.profile_id)) {
              latestByProfile.set(a.profile_id, a.generated_at);
            }
          }
          
          for (const [profileId, stats] of profileMap) {
            stats.hasAnalysis = latestByProfile.has(profileId);
            stats.lastAnalyzedAt = latestByProfile.get(profileId);
          }
        }
      }

      return Array.from(profileMap.values()).sort((a, b) => b.threadCount - a.threadCount);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Analyze a single contact's emails
  const analyzeContact = useCallback(async (profileId: string): Promise<{ success: boolean; insightsCount: number; error?: string }> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        return { success: false, insightsCount: 0, error: 'Not authenticated' };
      }

      const response = await supabase.functions.invoke('analyze-email-insights', {
        body: { profileId, analyzeAll: true },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (response.error) {
        return { success: false, insightsCount: 0, error: response.error.message };
      }

      const insights = response.data?.insights || [];
      return { success: true, insightsCount: insights.length };
    } catch (err) {
      return { success: false, insightsCount: 0, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Bulk analyze all contacts
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async (profileIds?: string[]) => {
      const targetProfiles = profileIds || contactsWithEmails?.map(c => c.profileId) || [];
      
      if (targetProfiles.length === 0) {
        throw new Error('No contacts to analyze');
      }

      setProgress({
        current: 0,
        total: targetProfiles.length,
        currentContact: '',
        status: 'running',
        results: [],
      });

      const results: BulkAnalysisProgress['results'] = [];
      
      // Process sequentially to avoid rate limiting
      for (let i = 0; i < targetProfiles.length; i++) {
        const profileId = targetProfiles[i];
        const contact = contactsWithEmails?.find(c => c.profileId === profileId);
        const contactName = contact?.contactName || 'Unknown';

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentContact: contactName,
        }));

        const result = await analyzeContact(profileId);
        results.push({ profileId, ...result });

        // Small delay between requests
        if (i < targetProfiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const totalInsights = results.reduce((sum, r) => sum + r.insightsCount, 0);
      
      setProgress(prev => ({
        ...prev,
        status: 'completed',
        results,
      }));

      queryClient.invalidateQueries({ queryKey: ['contacts-with-email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['email-insights'] });
      queryClient.invalidateQueries({ queryKey: ['ai-analyses'] });
      
      toast.success(`Analyzed ${successful}/${results.length} contacts`, {
        description: `Extracted ${totalInsights} email insights`,
      });
    },
    onError: (error) => {
      setProgress(prev => ({ ...prev, status: 'error' }));
      toast.error('Bulk analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const resetProgress = useCallback(() => {
    setProgress({
      current: 0,
      total: 0,
      currentContact: '',
      status: 'idle',
      results: [],
    });
  }, []);

  return {
    contactsWithEmails: contactsWithEmails || [],
    loadingContacts,
    refetchContacts,
    progress,
    resetProgress,
    isAnalyzing: bulkAnalyzeMutation.isPending,
    analyzeAll: () => bulkAnalyzeMutation.mutate(undefined),
    analyzeSelected: (profileIds: string[]) => bulkAnalyzeMutation.mutate(profileIds),
    analyzeContact,
  };
}
