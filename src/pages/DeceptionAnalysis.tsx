/**
 * Deception Analysis Page
 * 
 * Multi-modal deception detection combining voice stress,
 * micro-expressions, and linguistic patterns.
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DeceptionDetectionConsole } from '@/components/intelligence/DeceptionDetectionConsole';
import { MicroExpressionTimeline } from '@/components/intelligence/MicroExpressionTimeline';
import { VoiceStressPanel } from '@/components/intelligence/VoiceStressPanel';
import { Eye, Mic, MessageSquare, Search, Users, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function DeceptionAnalysis() {
  const { user } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('console');

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-deception', user?.id],
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
              <Eye className="h-8 w-8 text-destructive" />
              Deception Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Multi-modal honesty assessment: voice stress, micro-expressions, linguistic patterns
            </p>
          </div>
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Sensitive
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
                  <TabsTrigger value="console" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Detection Console
                  </TabsTrigger>
                  <TabsTrigger value="micro-expressions" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Micro-Expressions
                  </TabsTrigger>
                  <TabsTrigger value="voice-stress" className="gap-2">
                    <Mic className="h-4 w-4" />
                    Voice Stress
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="console">
                  <DeceptionDetectionConsole
                    profileId={selectedProfile.id}
                    profileName={getDisplayName(selectedProfile)}
                  />
                </TabsContent>

                <TabsContent value="micro-expressions">
                  <MicroExpressionTimeline
                    events={[]}
                    videoDuration={0}
                  />
                </TabsContent>

                <TabsContent value="voice-stress">
                  <VoiceStressPanel
                    audioSegments={[]}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Eye className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <h3 className="font-semibold">Select a Contact</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a contact to analyze for deception indicators
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
