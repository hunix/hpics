/**
 * Ultimate Command Center - Phase 10
 * Unified Intelligence Command Interface
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PowerMatrix } from '@/components/command/PowerMatrix';
import { OpportunityQueue } from '@/components/command/OpportunityQueue';
import { RiskRadar } from '@/components/command/RiskRadar';
import { PredictionFeed } from '@/components/command/PredictionFeed';
import { ActionTracker } from '@/components/command/ActionTracker';
import { ConversationCopilot } from '@/components/command/ConversationCopilot';
import { NetworkPulse } from '@/components/command/NetworkPulse';
import { 
  Crown, 
  Target, 
  Shield, 
  Brain, 
  Zap, 
  MessageSquare,
  Activity,
  LayoutGrid
} from 'lucide-react';

export default function UltimateCommandCenter() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Ultimate Command Center</h1>
                <p className="text-sm text-muted-foreground">Strategic Intelligence & Control</p>
              </div>
            </div>
            <NetworkPulse />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Power</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Opportunities</span>
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Risks</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
            <TabsTrigger value="copilot" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Copilot</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerMatrix compact />
              <OpportunityQueue compact />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RiskRadar compact />
              <PredictionFeed compact />
              <ActionTracker compact />
            </div>
          </TabsContent>

          <TabsContent value="power">
            <PowerMatrix />
          </TabsContent>

          <TabsContent value="opportunities">
            <OpportunityQueue />
          </TabsContent>

          <TabsContent value="risks">
            <RiskRadar />
          </TabsContent>

          <TabsContent value="predictions">
            <PredictionFeed />
          </TabsContent>

          <TabsContent value="actions">
            <ActionTracker />
          </TabsContent>

          <TabsContent value="copilot">
            <ConversationCopilot />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
