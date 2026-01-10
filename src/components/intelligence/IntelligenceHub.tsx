import React, { useState } from 'react';
import { Brain, Smartphone, Chrome, Tag, Watch, Sparkles, ArrowRight, Zap, Database, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DeviceIntelCapture } from '@/components/capture/DeviceIntelCapture';
import { ChromeExtensionBridge } from '@/components/capture/ChromeExtensionBridge';
import { ApplyToContactDialog } from '@/components/capture/ApplyToContactDialog';
import { RAGPoweredAgent } from '@/components/intelligence/RAGPoweredAgent';
import { IntelligenceStatsPanel } from '@/components/intelligence/IntelligenceStatsPanel';
import { EntityMentionsPanel } from '@/components/intelligence/EntityMentionsPanel';
import { NFCTagManager } from '@/components/devices/NFCTagManager';
import { WearableSyncSettings } from '@/components/devices/WearableSyncSettings';
import { cn } from '@/lib/utils';

interface IntelligenceHubProps {
  profileId?: string;
  contactName?: string;
  className?: string;
}

type HubSection = 'capture' | 'ai-agent' | 'devices' | 'apply';

const HUB_SECTIONS: { id: HubSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'capture', label: 'Capture Intel', icon: Smartphone, description: 'Import data from any source' },
  { id: 'ai-agent', label: 'AI Agent', icon: Brain, description: 'Ask questions about contacts' },
  { id: 'devices', label: 'Connected Devices', icon: Watch, description: 'NFC, wearables, extensions' },
  { id: 'apply', label: 'Apply Data', icon: Sparkles, description: 'Review and apply to contacts' },
];

export function IntelligenceHub({ profileId, contactName = 'Contact', className }: IntelligenceHubProps) {
  const [activeSection, setActiveSection] = useState<HubSection>('capture');
  const [pendingData, setPendingData] = useState<any>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const handleCaptureComplete = (captureId: string, data: any) => {
    setPendingData({ captureId, data });
    setApplyDialogOpen(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {HUB_SECTIONS.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setActiveSection(section.id)}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel - Primary Action */}
        <div className="space-y-4">
          {activeSection === 'capture' && (
            <DeviceIntelCapture
              profileId={profileId}
              onCaptureComplete={handleCaptureComplete}
            />
          )}

          {activeSection === 'ai-agent' && profileId && (
            <RAGPoweredAgent
              profileId={profileId}
              contactName={contactName}
              mode="contact"
            />
          )}

          {activeSection === 'ai-agent' && !profileId && (
            <RAGPoweredAgent mode="global" />
          )}

          {activeSection === 'devices' && (
            <Tabs defaultValue="extension" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="extension">
                  <Chrome className="h-4 w-4 mr-2" />
                  Extension
                </TabsTrigger>
                <TabsTrigger value="nfc">
                  <Tag className="h-4 w-4 mr-2" />
                  NFC Tags
                </TabsTrigger>
                <TabsTrigger value="wearables">
                  <Watch className="h-4 w-4 mr-2" />
                  Wearables
                </TabsTrigger>
              </TabsList>

              <TabsContent value="extension" className="mt-4">
                <ChromeExtensionBridge profileId={profileId} />
              </TabsContent>

              <TabsContent value="nfc" className="mt-4">
                <NFCTagManager />
              </TabsContent>

              <TabsContent value="wearables" className="mt-4">
                <WearableSyncSettings />
              </TabsContent>
            </Tabs>
          )}

          {activeSection === 'apply' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Apply Captured Data
                </CardTitle>
                <CardDescription>
                  Review captured intelligence and apply it to contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingData ? (
                  <div className="space-y-4">
                    <p className="text-sm">You have pending data to apply.</p>
                    <Button onClick={() => setApplyDialogOpen(true)}>
                      Review & Apply
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No pending captures. Use the Capture Intel tab to scrape profiles.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Secondary Info */}
        <div className="space-y-4">
          {/* RAG Stats Panel */}
          <IntelligenceStatsPanel />

          {/* Entity Mentions */}
          <EntityMentionsPanel profileId={profileId} />

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                <Badge variant="outline" className="shrink-0">1</Badge>
                <div className="text-sm">
                  <span className="font-medium">Scrape public profiles</span> using the Web Scrape tab for instant data extraction
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                <Badge variant="outline" className="shrink-0">2</Badge>
                <div className="text-sm">
                  <span className="font-medium">Install the Chrome Extension</span> to capture private Instagram/Threads profiles
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                <Badge variant="outline" className="shrink-0">3</Badge>
                <div className="text-sm">
                  <span className="font-medium">Ask the AI Agent</span> anything about your contacts based on all collected data
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Recent Activity
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Start by capturing some intel!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Dialog */}
      {pendingData && (
        <ApplyToContactDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          extractedData={pendingData.data || {}}
          sourceType="social"
          captureId={pendingData.captureId}
          preSelectedContactId={profileId}
          onApplied={() => setPendingData(null)}
        />
      )}
    </div>
  );
}

export default IntelligenceHub;
