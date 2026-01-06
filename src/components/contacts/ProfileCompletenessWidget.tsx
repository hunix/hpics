import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Heart, 
  MapPin, 
  Calendar,
  MessageSquare,
  Camera,
  FileText,
  Users,
  Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileCompletenessWidgetProps {
  profileId: string;
}

interface CompletenessCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  weight: number;
  isComplete: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export function ProfileCompletenessWidget({ profileId }: ProfileCompletenessWidgetProps) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['profile-completeness', profileId],
    queryFn: async () => {
      const [
        { data: profile },
        { data: contactMethods },
        { data: relationships },
        { data: communications },
        { data: media },
        { data: documents },
        { data: interests },
        { data: milestones },
        { data: observations },
        { data: analyses },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('contact_methods').select('id, contact_type').eq('profile_id', profileId),
        supabase.from('contact_relationships').select('id').or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`),
        supabase.from('communications').select('id').eq('profile_id', profileId).limit(1),
        supabase.from('media').select('id').eq('profile_id', profileId).limit(1),
        supabase.from('documents').select('id').eq('profile_id', profileId).limit(1),
        supabase.from('contact_interests').select('id').eq('profile_id', profileId).limit(1),
        supabase.from('contact_life_milestones').select('id').eq('profile_id', profileId).limit(1),
        supabase.from('contact_observations').select('id').eq('profile_id', profileId).limit(1),
        supabase.from('ai_analyses').select('id').eq('profile_id', profileId).limit(1),
      ]);

      const hasEmail = contactMethods?.some(m => m.contact_type === 'email');
      const hasPhone = contactMethods?.some(m => m.contact_type === 'phone');

      const categories: CompletenessCategory[] = [
        {
          id: 'avatar',
          name: 'Profile Photo',
          icon: Camera,
          weight: 10,
          isComplete: !!profile?.avatar_url,
          priority: 'medium',
          action: 'Add a photo for easy recognition',
        },
        {
          id: 'email',
          name: 'Email Address',
          icon: Mail,
          weight: 15,
          isComplete: !!hasEmail,
          priority: 'high',
          action: 'Add email for communication tracking',
        },
        {
          id: 'phone',
          name: 'Phone Number',
          icon: Phone,
          weight: 10,
          isComplete: !!hasPhone,
          priority: 'medium',
          action: 'Add phone number',
        },
        {
          id: 'organization',
          name: 'Organization',
          icon: Briefcase,
          weight: 10,
          isComplete: !!profile?.organization,
          priority: 'medium',
          action: 'Add workplace or organization',
        },
        {
          id: 'relationships',
          name: 'Relationships',
          icon: Users,
          weight: 10,
          isComplete: (relationships?.length || 0) > 0,
          priority: 'medium',
          action: 'Link to other contacts in your network',
        },
        {
          id: 'communications',
          name: 'Communication History',
          icon: MessageSquare,
          weight: 10,
          isComplete: (communications?.length || 0) > 0,
          priority: 'high',
          action: 'Log a communication or import messages',
        },
        {
          id: 'interests',
          name: 'Interests & Hobbies',
          icon: Heart,
          weight: 5,
          isComplete: (interests?.length || 0) > 0,
          priority: 'low',
          action: 'Add interests for conversation starters',
        },
        {
          id: 'media',
          name: 'Photos/Videos',
          icon: Camera,
          weight: 5,
          isComplete: (media?.length || 0) > 0,
          priority: 'low',
          action: 'Upload photos or videos',
        },
        {
          id: 'milestones',
          name: 'Life Milestones',
          icon: Calendar,
          weight: 5,
          isComplete: (milestones?.length || 0) > 0,
          priority: 'low',
          action: 'Record important life events',
        },
        {
          id: 'observations',
          name: 'Personal Observations',
          icon: Brain,
          weight: 5,
          isComplete: (observations?.length || 0) > 0,
          priority: 'low',
          action: 'Add notes about personality or behavior',
        },
      ];

      const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
      const completedWeight = categories.filter(c => c.isComplete).reduce((sum, c) => sum + c.weight, 0);
      const completenessScore = Math.round((completedWeight / totalWeight) * 100);

      return {
        categories,
        completenessScore,
        hasAIAnalysis: (analyses?.length || 0) > 0,
        profileName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      };
    },
    enabled: !!profileId && !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { categories, completenessScore, hasAIAnalysis } = data;
  const incompleteCategories = categories.filter(c => !c.isComplete);
  const highPriority = incompleteCategories.filter(c => c.priority === 'high');
  const mediumPriority = incompleteCategories.filter(c => c.priority === 'medium');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Profile Completeness
          </span>
          <span className={`text-2xl font-bold ${getScoreColor(completenessScore)}`}>
            {completenessScore}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Progress value={completenessScore} className="h-2" />
          <div 
            className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(completenessScore)}`}
            style={{ width: `${completenessScore}%` }}
          />
        </div>

        {incompleteCategories.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Complete these to improve profile intelligence:
            </p>
            
            {highPriority.length > 0 && (
              <div className="space-y-1">
                <Badge variant="destructive" className="text-[10px]">High Priority</Badge>
                {highPriority.slice(0, 2).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 text-sm">
                    <Circle className="h-3 w-3 text-destructive" />
                    <cat.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{cat.action}</span>
                  </div>
                ))}
              </div>
            )}
            
            {mediumPriority.length > 0 && (
              <div className="space-y-1">
                <Badge variant="secondary" className="text-[10px]">Suggested</Badge>
                {mediumPriority.slice(0, 2).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 text-sm">
                    <Circle className="h-3 w-3 text-muted-foreground" />
                    <cat.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{cat.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-1" />
            <p className="text-sm font-medium">Profile Complete!</p>
            <p className="text-xs text-muted-foreground">All key information captured</p>
          </div>
        )}

        {!hasAIAnalysis && completenessScore >= 50 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>AI analysis available - run deep profile analysis</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
