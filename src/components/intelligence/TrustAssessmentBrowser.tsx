import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TrustAssessmentPanel } from './TrustAssessmentPanel';

const verificationIcons: Record<string, { icon: any; color: string; label: string }> = {
  verified: { icon: ShieldCheck, color: 'text-green-600', label: 'Verified' },
  partially_verified: { icon: Shield, color: 'text-blue-600', label: 'Partial' },
  unverified: { icon: ShieldQuestion, color: 'text-gray-500', label: 'Unverified' },
  suspicious: { icon: ShieldAlert, color: 'text-red-600', label: 'Suspicious' },
};

export function TrustAssessmentBrowser() {
  const { user } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['all-trust-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_assessments')
        .select('*, profiles(id, first_name, last_name)')
        .order('last_assessment_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (selectedProfileId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedProfileId(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to all assessments
        </button>
        <TrustAssessmentPanel profileId={selectedProfileId} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Trust Assessments
        </CardTitle>
        <CardDescription>
          Counter-intelligence analysis across your contacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assessments && assessments.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {assessments.map((assessment: any) => {
                const verificationInfo = verificationIcons[assessment.verification_status || 'unverified'];
                const VerificationIcon = verificationInfo.icon;
                const profile = assessment.profiles;

                return (
                  <div
                    key={assessment.id}
                    onClick={() => setSelectedProfileId(assessment.profile_id)}
                    className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <VerificationIcon className={`h-6 w-6 ${verificationInfo.color}`} />
                      <div>
                        <div className="font-medium">
                          {profile?.first_name} {profile?.last_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={verificationInfo.color}>
                            {verificationInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Trust: {assessment.overall_trust_score?.toFixed(0) || 'N/A'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(assessment.last_assessment_at), { addSuffix: true })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No trust assessments yet</p>
            <p className="text-sm">Run assessments from individual contact profiles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
