import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  FileDown,
  Download,
  Loader2,
  Brain,
  Target,
  Shield,
  Network,
  Zap,
  Eye,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Crosshair,
  Radio,
  Atom,
  Swords,
  Activity,
  BarChart3
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { PDFDossierGenerator } from '@/components/reports/PDFDossierGenerator';
import { DossierBrowser } from '@/components/intelligence/DossierBrowser';
import { DossierExporter } from '@/components/intelligence/DossierExporter';
import { ErrorBoundaryWithRecovery } from '@/components/ErrorBoundaryWithRecovery';
import { APP_VERSION, BUILD_TIMESTAMP } from '@/lib/appVersion';

// Build stamp for debugging
const BUILD_STAMP = `v${APP_VERSION} @ ${BUILD_TIMESTAMP.slice(0, 16)}`;

const classificationColors: Record<string, string> = {
  public: 'bg-green-500/10 text-green-600 border-green-500/50',
  internal: 'bg-blue-500/10 text-blue-600 border-blue-500/50',
  confidential: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50',
  restricted: 'bg-red-500/10 text-red-600 border-red-500/50',
  'top-secret': 'bg-red-700/20 text-red-700 border-red-700/50',
};

export default function DossierIntelligence() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('generate');
  const [exportDossier, setExportDossier] = useState<any>(null);

  // Log build stamp on mount
  useEffect(() => {
    console.log(`[DossierIntelligence] Build stamp: ${BUILD_STAMP}`);
  }, []);

  // Fetch all dossiers
  const { data: dossiers = [], isLoading: dossiersLoading, refetch: refetchDossiers } = useQuery({
    queryKey: ['all-dossiers-page'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('dossiers')
        .select('*, profiles(id, first_name, last_name, organization, job_title)')
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch intelligence stats
  const { data: stats } = useQuery({
    queryKey: ['dossier-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [dossierCount, profileCount, analysisCount, warfareCount] = await Promise.all([
        supabase.from('dossiers').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('ai_analyses').select('id', { count: 'exact', head: true }),
        supabase.from('cognitive_warfare_operations').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalDossiers: dossierCount.count || 0,
        activeProfiles: profileCount.count || 0,
        totalAnalyses: analysisCount.count || 0,
        warfareSimulations: warfareCount.count || 0,
      };
    },
  });

  const handleRefresh = async () => {
    await refetchDossiers();
    toast.success('Dossier library refreshed');
  };

  return (
    <AppLayout title="The Dossier Intelligence">
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">The Dossier Intelligence</h1>
                <p className="text-muted-foreground text-sm">
                  Comprehensive intelligence synthesis & warfare analysis center
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono opacity-60">
              {BUILD_STAMP}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dossiers</p>
                  <p className="text-2xl font-bold">{stats?.totalDossiers || 0}</p>
                </div>
                <FileDown className="h-8 w-8 text-red-500/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Profiles</p>
                  <p className="text-2xl font-bold">{stats?.activeProfiles || 0}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Analyses</p>
                  <p className="text-2xl font-bold">{stats?.totalAnalyses || 0}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-500/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warfare Sims</p>
                  <p className="text-2xl font-bold">{stats?.warfareSimulations || 0}</p>
                </div>
                <Swords className="h-8 w-8 text-orange-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="generate" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="warfare" className="gap-2">
              <Crosshair className="h-4 w-4" />
              <span className="hidden sm:inline">Warfare</span>
            </TabsTrigger>
            <TabsTrigger value="counter-intel" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Counter-Intel</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab - Full Dossier Generator */}
          <TabsContent value="generate" className="mt-6 min-h-[700px]">
            <ErrorBoundaryWithRecovery>
              <PDFDossierGenerator />
            </ErrorBoundaryWithRecovery>
          </TabsContent>

          {/* Library Tab - Browse Existing Dossiers */}
          <TabsContent value="library" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Intelligence Dossier Library
                    </CardTitle>
                    <CardDescription>
                      {dossiers.length} dossiers available for review and export
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dossiersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : dossiers.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {dossiers.map((dossier: any) => {
                        const profile = dossier.profiles;
                        const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
                        
                        return (
                          <div
                            key={dossier.id}
                            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{dossier.title}</span>
                                  <Badge variant="outline" className={classificationColors[dossier.classification] || ''}>
                                    {dossier.classification?.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium">{profileName}</span>
                                  {profile?.organization && (
                                    <span className="ml-2">• {profile.organization}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-[10px]">
                                      {dossier.dossier_type}
                                    </Badge>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(dossier.generated_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExportDossier(dossier)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No dossiers generated yet</p>
                    <p className="text-sm">Generate your first intelligence dossier from the Generate tab</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Warfare Tab */}
          <TabsContent value="warfare" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-red-500" />
                    Cognitive Warfare Operations
                  </CardTitle>
                  <CardDescription>
                    Three-level attack framework targeting biological, psychological, and social dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                      <Activity className="h-5 w-5 mx-auto mb-1 text-red-500" />
                      <p className="text-xs font-medium">Biological</p>
                      <p className="text-[10px] text-muted-foreground">Arousal states</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                      <Brain className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                      <p className="text-xs font-medium">Psychological</p>
                      <p className="text-[10px] text-muted-foreground">Cognitive load</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                      <Network className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs font-medium">Social</p>
                      <p className="text-[10px] text-muted-foreground">Identity narrative</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Launch Cognitive Warfare Engine
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-orange-500" />
                    Semantic Warfare
                  </CardTitle>
                  <CardDescription>
                    Definition warfare, Overton Window automation, and narrative control
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Definition Control</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>LLM Poisoning Detection</span>
                      <Badge variant="outline" className="bg-green-500/10">Monitoring</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Overton Window Tracking</span>
                      <Badge variant="outline">Calibrated</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Open Semantic Warfare Panel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Atom className="h-5 w-5 text-purple-500" />
                    Mosaic Intelligence Fusion
                  </CardTitle>
                  <CardDescription>
                    Disaggregated data recomposition with multi-source corroboration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Fuse intelligence from multiple modalities into cohesive threat assessments with 
                    confidence-weighted synthesis.
                  </div>
                  <Button variant="outline" className="w-full">
                    Invoke Mosaic Fuser
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-yellow-500" />
                    Proportional Response Engine
                  </CardTitle>
                  <CardDescription>
                    Calculate equivalent defensive counter-measures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Generate legally-bounded, ethically-proportional response options 
                    for detected threats and incidents.
                  </div>
                  <Button variant="outline" className="w-full">
                    Configure Response Matrix
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Counter-Intelligence Tab */}
          <TabsContent value="counter-intel" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Active Defense Operations (MITRE Engage)
                  </CardTitle>
                  <CardDescription>
                    Prepare, Expose, Affect, Elicit, Understand - Full spectrum defensive deception
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="p-4 rounded-lg bg-muted/50 border text-center">
                      <div className="font-medium text-sm mb-1">Prepare</div>
                      <p className="text-xs text-muted-foreground">Threat landscape mapping</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border text-center">
                      <div className="font-medium text-sm mb-1">Expose</div>
                      <p className="text-xs text-muted-foreground">Honeypot deployment</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border text-center">
                      <div className="font-medium text-sm mb-1">Affect</div>
                      <p className="text-xs text-muted-foreground">Adversary disruption</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border text-center">
                      <div className="font-medium text-sm mb-1">Elicit</div>
                      <p className="text-xs text-muted-foreground">Intel extraction</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border text-center">
                      <div className="font-medium text-sm mb-1">Understand</div>
                      <p className="text-xs text-muted-foreground">TTP cataloging</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    Defensive Deception Framework
                  </CardTitle>
                  <CardDescription>
                    Honey credentials, tokens, and synthetic personas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Honey Credentials</span>
                      <Badge variant="outline">12 Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Honeytokens</span>
                      <Badge variant="outline">8 Deployed</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Synthetic Personas</span>
                      <Badge variant="outline">3 Operating</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Deception Assets
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-red-500" />
                    Social Engineering Defense
                  </CardTitle>
                  <CardDescription>
                    Detect and counter manipulation attempts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>T1341 Detection</span>
                      <Badge variant="outline" className="bg-green-500/10">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Romantic False Flag</span>
                      <Badge variant="outline" className="bg-green-500/10">Monitoring</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cross-Modal Deception</span>
                      <Badge variant="outline" className="bg-green-500/10">Enabled</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Detection Console
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Dossier Generation Analytics
                  </CardTitle>
                  <CardDescription>
                    Intelligence production metrics and quality scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Analytics visualization</p>
                      <p className="text-sm">Charts will appear here as dossiers are generated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dossiers.slice(0, 5).map((dossier: any) => (
                      <div key={dossier.id} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{dossier.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(dossier.generated_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                    {dossiers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Dialog */}
        {exportDossier && (
          <DossierExporter 
            dossier={exportDossier}
            open={!!exportDossier}
            onOpenChange={(open) => !open && setExportDossier(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
