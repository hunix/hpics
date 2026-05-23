import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Grid3x3, Scale } from 'lucide-react';
import { CrossModalIntelligenceHub } from '@/components/ai/CrossModalIntelligenceHub';
import { ModalityCorrelationMatrix } from '@/components/ai/ModalityCorrelationMatrix';
import { DeceptionAnalysisPanel } from '@/components/intelligence/DeceptionAnalysisPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfilePicker } from '@/hooks/profiles/useProfilePicker';

export default function CrossModalIntelligencePage() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { data: profiles } = useProfilePicker({ queryKeyHint: 'correlation' });

  return (
    <AppLayout title="Cross-Modal Intelligence">
      <Tabs defaultValue="synthesis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="synthesis" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Synthesis Hub
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Correlation Matrix
          </TabsTrigger>
          <TabsTrigger value="deception" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Deception Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="synthesis">
          <CrossModalIntelligenceHub />
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                Modality Correlation Matrix
              </CardTitle>
              <CardDescription>
                Select a profile to view correlations between vocal, facial, body language, and behavioral indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm">
                <Select value={selectedProfileId || ''} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {selectedProfileId && (
            <ModalityCorrelationMatrix profileId={selectedProfileId} />
          )}
        </TabsContent>

        <TabsContent value="deception">
          <DeceptionAnalysisPanel />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
