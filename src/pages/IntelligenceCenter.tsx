import React, { useState } from 'react';
import { 
  Brain, Database, Network, Mic, Chrome, Zap, 
  Settings, RefreshCw, TrendingUp, Users, Globe, Inbox
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RAGPoweredAgent } from '@/components/intelligence/RAGPoweredAgent';
import { IntelligenceStatsPanel } from '@/components/intelligence/IntelligenceStatsPanel';
import { EntityMentionsPanel } from '@/components/intelligence/EntityMentionsPanel';
import { CrossContactAnalyzer } from '@/components/intelligence/CrossContactAnalyzer';
import { VoiceSignaturePanel } from '@/components/intelligence/VoiceSignaturePanel';
import { ChromeExtensionPanel } from '@/components/devices/ChromeExtensionPanel';
import { WearableSyncSettings } from '@/components/devices/WearableSyncSettings';
import { NFCTagManager } from '@/components/devices/NFCTagManager';
import { DeviceCapturesManager } from '@/components/capture/DeviceCapturesManager';
import { AppLayout } from '@/components/AppLayout';

export default function IntelligenceCenter() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AppLayout title="Intelligence Center">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Intelligence Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            RAG-powered cross-contact analysis, entity extraction, and deep insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            RAG 3.0
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Real-time
          </Badge>
        </div>
      </div>

      {/* Stats Bar */}
      <IntelligenceStatsPanel compact />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="gap-1.5 py-2">
            <Brain className="h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="captures" className="gap-1.5 py-2">
            <Inbox className="h-4 w-4" />
            <span className="hidden md:inline">Captures</span>
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5 py-2">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">AI Agent</span>
          </TabsTrigger>
          <TabsTrigger value="entities" className="gap-1.5 py-2">
            <Network className="h-4 w-4" />
            <span className="hidden md:inline">Entities</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5 py-2">
            <Mic className="h-4 w-4" />
            <span className="hidden md:inline">Voice</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-1.5 py-2">
            <Chrome className="h-4 w-4" />
            <span className="hidden md:inline">Devices</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <RAGPoweredAgent mode="global" />
            </div>
            <div className="space-y-4">
              <CrossContactAnalyzer />
              <EntityMentionsPanel />
            </div>
          </div>
        </TabsContent>

        {/* Captures Tab */}
        <TabsContent value="captures" className="space-y-4">
          <DeviceCapturesManager />
        </TabsContent>

        {/* AI Agent Tab */}
        <TabsContent value="agent" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RAGPoweredAgent mode="global" className="h-[600px]" />
            </div>
            <div className="space-y-4">
              <IntelligenceStatsPanel />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Agent Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span>Semantic search across all data</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Network className="h-4 w-4 text-green-500" />
                    <span>Cross-contact pattern detection</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Entity extraction & linking</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span>Tool-augmented reasoning</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <EntityMentionsPanel className="lg:col-span-1" />
            <CrossContactAnalyzer className="lg:col-span-1" />
          </div>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <VoiceSignaturePanel />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  Voice Intelligence Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Speaker Identification</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatically identify speakers in recordings by matching against enrolled voice signatures.
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Emotion Detection</h4>
                  <p className="text-xs text-muted-foreground">
                    Analyze vocal patterns to detect emotional states and stress indicators.
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Transcription & Analysis</h4>
                  <p className="text-xs text-muted-foreground">
                    Real-time transcription with entity extraction and sentiment analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ChromeExtensionPanel />
            <WearableSyncSettings />
            <NFCTagManager />
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
