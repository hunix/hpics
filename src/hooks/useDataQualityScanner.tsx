import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DataQualityIssue {
  id: string;
  type: 'missing_field' | 'stale_data' | 'duplicate' | 'invalid_format' | 'orphaned' | 'incomplete';
  severity: 'critical' | 'warning' | 'info';
  entity: 'profile' | 'contact_method' | 'media' | 'document' | 'relationship';
  entityId: string;
  entityName?: string;
  description: string;
  suggestedFix: string;
  autoFixAvailable: boolean;
  fixAction?: () => Promise<void>;
}

export interface DataQualitySummary {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  autoFixableCount: number;
}

export function useDataQualityScanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['data-quality-issues', user?.id],
    queryFn: async (): Promise<{ issues: DataQualityIssue[]; summary: DataQualitySummary }> => {
      if (!user?.id) return { issues: [], summary: { totalIssues: 0, criticalCount: 0, warningCount: 0, infoCount: 0, autoFixableCount: 0 } };

      const issues: DataQualityIssue[] = [];

      // Fetch all necessary data in parallel
      const [
        { data: profiles },
        { data: contactMethods },
        { data: relationships },
        { data: communications },
        { data: media },
        { data: documents },
      ] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, organization, avatar_url, created_at').eq('user_id', user.id),
        supabase.from('contact_methods').select('id, profile_id, contact_type, value'),
        supabase.from('contact_relationships').select('id, from_profile_id, to_profile_id, relationship_type').eq('user_id', user.id),
        supabase.from('communications').select('profile_id, occurred_at').eq('user_id', user.id).order('occurred_at', { ascending: false }),
        supabase.from('media').select('id, profile_id, storage_path').eq('user_id', user.id),
        supabase.from('documents').select('id, profile_id, storage_path').eq('user_id', user.id),
      ]);

      const profileMethodsMap = new Map<string, typeof contactMethods>();
      contactMethods?.forEach(cm => {
        const existing = profileMethodsMap.get(cm.profile_id) || [];
        profileMethodsMap.set(cm.profile_id, [...existing, cm]);
      });

      const lastCommunicationMap = new Map<string, string>();
      communications?.forEach(c => {
        if (!lastCommunicationMap.has(c.profile_id)) {
          lastCommunicationMap.set(c.profile_id, c.occurred_at);
        }
      });

      const relationshipProfileIds = new Set<string>();
      relationships?.forEach(r => {
        relationshipProfileIds.add(r.from_profile_id);
        relationshipProfileIds.add(r.to_profile_id);
      });

      // Check for issues per profile
      profiles?.forEach(profile => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
        const methods = profileMethodsMap.get(profile.id) || [];

        // 1. No contact methods - Critical
        if (methods.length === 0) {
          issues.push({
            id: `no-contact-${profile.id}`,
            type: 'missing_field',
            severity: 'critical',
            entity: 'profile',
            entityId: profile.id,
            entityName: fullName,
            description: `${fullName} has no contact methods (phone, email, etc.)`,
            suggestedFix: 'Add at least one contact method',
            autoFixAvailable: false,
          });
        }

        // 2. No email specifically - Warning
        const hasEmail = methods.some(m => m.contact_type === 'email');
        if (!hasEmail && methods.length > 0) {
          issues.push({
            id: `no-email-${profile.id}`,
            type: 'missing_field',
            severity: 'warning',
            entity: 'profile',
            entityId: profile.id,
            entityName: fullName,
            description: `${fullName} has no email address`,
            suggestedFix: 'Add an email address for better communication tracking',
            autoFixAvailable: false,
          });
        }

        // 3. No relationship defined - Info
        if (!relationshipProfileIds.has(profile.id)) {
          issues.push({
            id: `no-relationship-${profile.id}`,
            type: 'incomplete',
            severity: 'info',
            entity: 'profile',
            entityId: profile.id,
            entityName: fullName,
            description: `${fullName} has no defined relationships`,
            suggestedFix: 'Link this contact to other contacts in your network',
            autoFixAvailable: false,
          });
        }

        // 4. Stale contact - no communication in 90+ days
        const lastComm = lastCommunicationMap.get(profile.id);
        if (lastComm) {
          const daysSinceContact = Math.floor((Date.now() - new Date(lastComm).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceContact > 90) {
            issues.push({
              id: `stale-${profile.id}`,
              type: 'stale_data',
              severity: 'warning',
              entity: 'profile',
              entityId: profile.id,
              entityName: fullName,
              description: `No communication with ${fullName} in ${daysSinceContact} days`,
              suggestedFix: 'Consider reaching out to maintain this relationship',
              autoFixAvailable: false,
            });
          }
        }

        // 5. No avatar - Info
        if (!profile.avatar_url) {
          issues.push({
            id: `no-avatar-${profile.id}`,
            type: 'incomplete',
            severity: 'info',
            entity: 'profile',
            entityId: profile.id,
            entityName: fullName,
            description: `${fullName} has no profile photo`,
            suggestedFix: 'Add a photo for easier recognition',
            autoFixAvailable: false,
          });
        }
      });

      // 6. Check for duplicate emails
      const emailMap = new Map<string, { profileId: string; name: string }[]>();
      contactMethods?.filter(cm => cm.contact_type === 'email').forEach(cm => {
        const normalizedEmail = cm.value.toLowerCase().trim();
        const profile = profiles?.find(p => p.id === cm.profile_id);
        const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
        const existing = emailMap.get(normalizedEmail) || [];
        emailMap.set(normalizedEmail, [...existing, { profileId: cm.profile_id, name }]);
      });

      emailMap.forEach((entries, email) => {
        if (entries.length > 1) {
          issues.push({
            id: `dup-email-${email}`,
            type: 'duplicate',
            severity: 'critical',
            entity: 'contact_method',
            entityId: entries[0].profileId,
            entityName: email,
            description: `Email "${email}" is used by ${entries.length} contacts: ${entries.map(e => e.name).join(', ')}`,
            suggestedFix: 'Merge duplicate contacts or remove duplicate emails',
            autoFixAvailable: false,
          });
        }
      });

      // 7. Check for orphaned media (no profile_id)
      media?.forEach(m => {
        if (!m.profile_id) {
          issues.push({
            id: `orphan-media-${m.id}`,
            type: 'orphaned',
            severity: 'warning',
            entity: 'media',
            entityId: m.id,
            entityName: m.id.slice(0, 8),
            description: `Media file is not linked to any contact`,
            suggestedFix: 'Link this media to a contact or delete it',
            autoFixAvailable: false,
          });
        }
      });

      // 8. Check for orphaned documents
      documents?.forEach(d => {
        if (!d.profile_id) {
          issues.push({
            id: `orphan-doc-${d.id}`,
            type: 'orphaned',
            severity: 'warning',
            entity: 'document',
            entityId: d.id,
            entityName: d.id.slice(0, 8),
            description: `Document is not linked to any contact`,
            suggestedFix: 'Link this document to a contact or delete it',
            autoFixAvailable: false,
          });
        }
      });

      // 9. Invalid email formats
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      contactMethods?.filter(cm => cm.contact_type === 'email').forEach(cm => {
        if (!emailRegex.test(cm.value)) {
          const profile = profiles?.find(p => p.id === cm.profile_id);
          const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
          issues.push({
            id: `invalid-email-${cm.id}`,
            type: 'invalid_format',
            severity: 'critical',
            entity: 'contact_method',
            entityId: cm.id,
            entityName: name,
            description: `Invalid email format: "${cm.value}" for ${name}`,
            suggestedFix: 'Correct the email address format',
            autoFixAvailable: false,
          });
        }
      });

      // Calculate summary
      const summary: DataQualitySummary = {
        totalIssues: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        warningCount: issues.filter(i => i.severity === 'warning').length,
        infoCount: issues.filter(i => i.severity === 'info').length,
        autoFixableCount: issues.filter(i => i.autoFixAvailable).length,
      };

      return { issues, summary };
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  const fixIssueMutation = useMutation({
    mutationFn: async (issue: DataQualityIssue) => {
      if (issue.fixAction) {
        await issue.fixAction();
      }
    },
    onSuccess: () => {
      toast.success('Issue fixed successfully');
      queryClient.invalidateQueries({ queryKey: ['data-quality-issues'] });
    },
    onError: (error) => {
      toast.error(`Failed to fix issue: ${error.message}`);
    },
  });

  return {
    issues: data?.issues || [],
    summary: data?.summary || { totalIssues: 0, criticalCount: 0, warningCount: 0, infoCount: 0, autoFixableCount: 0 },
    isLoading,
    refetch,
    fixIssue: fixIssueMutation.mutate,
    isFixing: fixIssueMutation.isPending,
  };
}
