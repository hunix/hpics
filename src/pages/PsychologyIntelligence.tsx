/**
 * Psychology Intelligence Page
 * 
 * Unified dashboard for psychological analysis including Dark Triad,
 * influence vulnerability, and manipulation detection.
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DarkPsychologyDashboard } from '@/components/intelligence/DarkPsychologyDashboard';
import { InfluencePlaybookPanel } from '@/components/intelligence/InfluencePlaybookPanel';
import { Brain, Target, Shield, Search, Users, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePsychologyAssessments, useLatestPsychologyAssessment } from '@/hooks/usePsychologyAssessment';

export default function PsychologyIntelligence() {
  const { user } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch profiles for selection
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-psychology', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, relationship_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getDisplayName = (profile: { first_name: string | null; last_name: string | null }) => {
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown';
  };

  const filteredProfiles = profiles.filter(p =>
    getDisplayName(p).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Psychology Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Dark psychology analysis, influence mapping, and manipulation detection
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Beta
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Selector */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {filteredProfiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant={selectedProfileId === profile.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedProfileId(profile.id)}
                  >
                    <span className="truncate">{getDisplayName(profile)}</span>
                  </Button>
                ))}
                {filteredProfiles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contacts found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedProfile ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                  <TabsTrigger value="dark-triad" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Dark Triad
                  </TabsTrigger>
                  <TabsTrigger value="influence" className="gap-2">
                    <Target className="h-4 w-4" />
                    Influence Playbook
                  </TabsTrigger>
                  <TabsTrigger value="resistance" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Resistance Profile
                  </TabsTrigger>
                  <TabsTrigger value="assessments" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Assessments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dark-triad">
                  <DarkPsychologyDashboard
                    profileId={selectedProfile.id}
                    profileName={getDisplayName(selectedProfile)}
                    behavioralData={{
                      messages: [],
                      observations: [],
                      interactions: []
                    }}
                  />
                </TabsContent>

                <TabsContent value="influence">
                  <InfluencePlaybookPanel
                    profileId={selectedProfile.id}
                    profileName={getDisplayName(selectedProfile)}
                  />
                </TabsContent>

                <TabsContent value="resistance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Influence Resistance Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Analyze how resistant this contact is to various influence techniques.
                        This helps tailor communication strategies.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assessments">
                  <PsychologyAssessmentsTab profileId={selectedProfile.id} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <h3 className="font-semibold">Select a Contact</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a contact to analyze their psychological profile
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
