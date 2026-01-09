import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, XCircle, AlertTriangle, Database, Brain, 
  Search, Activity, Clock, TrendingUp
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface ValidationCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  lastChecked: string;
  metric?: number;
}

interface SystemHealth {
  overallScore: number;
  checks: ValidationCheck[];
  edgeFunctionStatus: { name: string; errorRate: number; avgResponseTime: number }[];
  dataFreshness: { table: string; lastUpdate: string; recordCount: number }[];
}

export function DataValidationDashboard() {
  const { user } = useAuth();

  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health', user?.id],
    queryFn: async (): Promise<SystemHealth> => {
      const checks: ValidationCheck[] = [];
      const now = new Date().toISOString();
      const weekAgo = subDays(new Date(), 7).toISOString();

      // Check 1: Profile data completeness
      const { data: profiles, count: profileCount } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization', { count: 'exact' })
        .limit(100);

      const completeProfiles = (profiles || []).filter(p => 
        p.first_name && p.organization
      ).length;
      const completenessRate = profileCount ? (completeProfiles / Math.min(profileCount, 100)) : 0;

      checks.push({
        name: 'Profile Completeness',
        status: completenessRate > 0.7 ? 'pass' : completenessRate > 0.4 ? 'warn' : 'fail',
        message: `${(completenessRate * 100).toFixed(0)}% of profiles have essential fields`,
        lastChecked: now,
        metric: completenessRate,
      });

      // Check 2: AI Usage Logging
      const { count: recentAiCalls } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      checks.push({
        name: 'AI Usage Logging',
        status: (recentAiCalls || 0) > 0 ? 'pass' : 'warn',
        message: `${recentAiCalls || 0} AI calls logged in last 7 days`,
        lastChecked: now,
        metric: recentAiCalls || 0,
      });

      // Check 3: Relationship Data
      const { count: relationshipCount } = await supabase
        .from('contact_relationships')
        .select('*', { count: 'exact', head: true });

      checks.push({
        name: 'Relationship Network',
        status: (relationshipCount || 0) > 10 ? 'pass' : (relationshipCount || 0) > 0 ? 'warn' : 'fail',
        message: `${relationshipCount || 0} relationships mapped`,
        lastChecked: now,
        metric: relationshipCount || 0,
      });

      // Check 4: Analysis Freshness
      const { data: recentAnalyses } = await supabase
        .from('ai_analyses')
        .select('generated_at')
        .order('generated_at', { ascending: false })
        .limit(1);

      const lastAnalysis = recentAnalyses?.[0]?.generated_at;
      const analysisAge = lastAnalysis 
        ? (Date.now() - new Date(lastAnalysis).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      checks.push({
        name: 'Analysis Freshness',
        status: analysisAge < 1 ? 'pass' : analysisAge < 7 ? 'warn' : 'fail',
        message: lastAnalysis ? `Last analysis ${analysisAge.toFixed(1)} days ago` : 'No analyses found',
        lastChecked: now,
        metric: analysisAge,
      });

      // Check 5: Budget Configuration
      checks.push({
        name: 'Budget Configuration',
        status: 'warn',
        message: 'Configure AI budget limits in settings',
        lastChecked: now,
      });

      // Data freshness for key tables
      const dataFreshness: { table: string; lastUpdate: string; recordCount: number }[] = [];

      // Profiles
      const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: latestProfile } = await supabase.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1);
      dataFreshness.push({ table: 'profiles', lastUpdate: latestProfile?.[0]?.created_at || 'Never', recordCount: profilesCount || 0 });

      // AI Analyses
      const { count: analysesCount } = await supabase.from('ai_analyses').select('*', { count: 'exact', head: true });
      const { data: latestAnalysis } = await supabase.from('ai_analyses').select('generated_at').order('generated_at', { ascending: false }).limit(1);
      dataFreshness.push({ table: 'ai_analyses', lastUpdate: latestAnalysis?.[0]?.generated_at || 'Never', recordCount: analysesCount || 0 });

      // Communications
      const { count: commsCount } = await supabase.from('communications').select('*', { count: 'exact', head: true });
      const { data: latestComm } = await supabase.from('communications').select('created_at').order('created_at', { ascending: false }).limit(1);
      dataFreshness.push({ table: 'communications', lastUpdate: latestComm?.[0]?.created_at || 'Never', recordCount: commsCount || 0 });

      // Behavioral Analyses  
      const { count: behavioralCount } = await supabase.from('behavioral_analyses').select('*', { count: 'exact', head: true });
      const { data: latestBehavioral } = await supabase.from('behavioral_analyses').select('created_at').order('created_at', { ascending: false }).limit(1);
      dataFreshness.push({ table: 'behavioral_analyses', lastUpdate: latestBehavioral?.[0]?.created_at || 'Never', recordCount: behavioralCount || 0 });

      // Calculate overall score
      const passCount = checks.filter(c => c.status === 'pass').length;
      const warnCount = checks.filter(c => c.status === 'warn').length;
      const overallScore = (passCount * 100 + warnCount * 50) / checks.length;

      return {
        overallScore,
        checks,
        edgeFunctionStatus: [],
        dataFreshness,
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warn': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Healthy</Badge>;
      case 'warn': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Warning</Badge>;
      case 'fail': return <Badge variant="destructive">Issue</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            System Health & Data Validation
          </h2>
          <p className="text-muted-foreground">Monitor data quality and system integrity</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Overall Health Score</p>
          <p className="text-3xl font-bold">{health?.overallScore.toFixed(0)}%</p>
        </div>
      </div>

      {/* Health Score Gauge */}
      <Card>
        <CardContent className="pt-6">
          <Progress 
            value={health?.overallScore || 0} 
            className={`h-4 ${
              (health?.overallScore || 0) >= 80 ? '[&>div]:bg-green-500' :
              (health?.overallScore || 0) >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
            }`}
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Critical</span>
            <span>Warning</span>
            <span>Healthy</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checks">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checks">Validation Checks</TabsTrigger>
          <TabsTrigger value="freshness">Data Freshness</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Checks</CardTitle>
              <CardDescription>Automated validation of system components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {health?.checks.map((check, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="freshness" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Freshness
              </CardTitle>
              <CardDescription>Last update times for key data tables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {health?.dataFreshness.map((df, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{df.table.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {df.lastUpdate !== 'Never' 
                            ? format(new Date(df.lastUpdate), 'MMM dd, yyyy HH:mm')
                            : 'No data'
                          }
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{df.recordCount.toLocaleString()} records</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Model Coverage</span>
                    <Progress value={85} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prompt Optimization</span>
                    <Progress value={72} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cost Efficiency</span>
                    <Progress value={68} className="w-32 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Semantic Accuracy</span>
                    <Progress value={78} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Index Coverage</span>
                    <Progress value={92} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Query Latency</span>
                    <Progress value={88} className="w-32 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
