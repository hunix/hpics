import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users, Heart, Briefcase, GraduationCap, Plane, Star } from 'lucide-react';
import { format } from 'date-fns';

interface SharedExperiencesPanelProps {
  profileId: string;
}

const experienceTypeIcons: Record<string, React.ReactNode> = {
  event: <Calendar className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  work: <Briefcase className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  personal: <Heart className="h-4 w-4" />,
  milestone: <Star className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
};

const experienceTypeColors: Record<string, string> = {
  event: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  travel: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  work: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  education: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  personal: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  milestone: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  social: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
};

export function SharedExperiencesPanel({ profileId }: SharedExperiencesPanelProps) {
  const { data: experiences, isLoading } = useQuery({
    queryKey: ['shared-experiences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_experiences')
        .select(`
          *,
          profiles:profile_id (first_name, last_name, avatar_url)
        `)
        .eq('profile_id', profileId)
        .order('experience_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

  // Also fetch experiences where this contact appears with other contacts
  const { data: crossContactExperiences } = useQuery({
    queryKey: ['cross-contact-experiences', profileId],
    queryFn: async () => {
      // This would require a more complex query or a database view
      // For now, we'll just show direct experiences
      return [];
    },
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!experiences || experiences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared Experiences
          </CardTitle>
          <CardDescription>No shared experiences recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Record shared events, trips, and memories to strengthen relationship context.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group experiences by year
  const groupedByYear: Record<string, typeof experiences> = {};
  experiences.forEach(exp => {
    const year = exp.experience_date 
      ? new Date(exp.experience_date).getFullYear().toString()
      : 'Unknown';
    if (!groupedByYear[year]) {
      groupedByYear[year] = [];
    }
    groupedByYear[year].push(exp);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Shared Experiences
        </CardTitle>
        <CardDescription>
          {experiences.length} shared memories and experiences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-6">
            {Object.entries(groupedByYear)
              .sort(([a], [b]) => (b === 'Unknown' ? -1 : a === 'Unknown' ? 1 : parseInt(b) - parseInt(a)))
              .map(([year, yearExperiences]) => (
                <div key={year}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">{year}</h4>
                  <div className="space-y-3">
                    {yearExperiences.map((experience) => (
                      <div 
                        key={experience.id} 
                        className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${experienceTypeColors[experience.experience_type] || 'bg-gray-100'}`}>
                          {experienceTypeIcons[experience.experience_type] || <Star className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-medium text-sm truncate">{experience.title}</h5>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {experience.experience_type}
                            </Badge>
                          </div>
                          
                          {experience.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {experience.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {experience.experience_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(experience.experience_date), 'MMM d, yyyy')}
                              </span>
                            )}
                            {experience.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {experience.location}
                              </span>
                            )}
                            {experience.sentiment && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {experience.sentiment}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
