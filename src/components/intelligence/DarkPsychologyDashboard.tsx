import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Eye, Shield, Target, AlertTriangle, Zap } from 'lucide-react';
import { assessDarkTriad, detectManipulation, type DarkTriadAssessment } from '@/lib/psychology/darkPsychologyEngine';

interface DarkPsychologyDashboardProps {
  profileId: string;
  profileName: string;
  behavioralData?: {
    messages: Array<{ content: string; direction: 'sent' | 'received' }>;
    observations: Array<{ type: string; content: string }>;
    interactions: Array<{ outcome: string; pattern: string }>;
  };
}

export function DarkPsychologyDashboard({ profileId, profileName, behavioralData }: DarkPsychologyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const analysis = useMemo(() => {
    if (!behavioralData) return null;
    const darkTriad = assessDarkTriad(behavioralData);
    const manipulation = detectManipulation(behavioralData.messages.map(m => m.content).join(' '));
    return { darkTriad, manipulation };
  }, [behavioralData]);

  const getTraitColor = (score: number) => score >= 70 ? 'text-red-500' : score >= 40 ? 'text-orange-500' : 'text-green-500';
  const getTraitBadge = (score: number): 'destructive' | 'secondary' | 'outline' => score >= 70 ? 'destructive' : score >= 40 ? 'secondary' : 'outline';

  if (!behavioralData || !analysis) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Dark Psychology Analysis</CardTitle></CardHeader>
        <CardContent><Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>No behavioral data for {profileName}. Collect messages and observations first.</AlertDescription></Alert></CardContent>
      </Card>
    );
  }

  const { darkTriad, manipulation } = analysis;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Dark Psychology Analysis</CardTitle><CardDescription>Profile: {profileName}</CardDescription></div>
          <Badge variant={getTraitBadge(darkTriad.overallDarkness)}>{darkTriad.riskLevel.toUpperCase()} RISK</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="darktriad">Dark Triad</TabsTrigger>
            <TabsTrigger value="manipulation">Manipulation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" /><p className="text-sm text-muted-foreground">Narcissism</p><p className={`text-2xl font-bold ${getTraitColor(darkTriad.narcissism.score)}`}>{darkTriad.narcissism.score.toFixed(0)}%</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Target className="h-6 w-6 mx-auto mb-2 text-blue-500" /><p className="text-sm text-muted-foreground">Machiavellianism</p><p className={`text-2xl font-bold ${getTraitColor(darkTriad.machiavellianism.score)}`}>{darkTriad.machiavellianism.score.toFixed(0)}%</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Zap className="h-6 w-6 mx-auto mb-2 text-red-500" /><p className="text-sm text-muted-foreground">Psychopathy</p><p className={`text-2xl font-bold ${getTraitColor(darkTriad.psychopathy.score)}`}>{darkTriad.psychopathy.score.toFixed(0)}%</p></CardContent></Card>
            </div>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Overall Darkness</CardTitle></CardHeader><CardContent><Progress value={darkTriad.overallDarkness} className="h-3" /><p className="text-right mt-1 font-bold">{darkTriad.overallDarkness.toFixed(0)}%</p></CardContent></Card>
          </TabsContent>

          <TabsContent value="darktriad" className="space-y-4 mt-4">
            {(['narcissism', 'machiavellianism', 'psychopathy'] as const).map(trait => {
              const data = darkTriad[trait];
              return (
                <Card key={trait}>
                  <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm capitalize">{trait}</CardTitle><Badge variant={getTraitBadge(data.score)}>{data.score.toFixed(0)}%</Badge></div></CardHeader>
                  <CardContent><Progress value={data.score} className="mb-3" />{data.indicators.length > 0 && <div className="flex flex-wrap gap-1">{data.indicators.map((ind, i) => <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>)}</div>}</CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="manipulation" className="space-y-4 mt-4">
            {manipulation.length > 0 ? manipulation.map((m, i) => (
              <Card key={i}><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="font-medium">{m.technique.name}</span><Badge variant={m.technique.ethicsLevel === 'harmful' ? 'destructive' : 'secondary'}>{m.confidence.toFixed(0)}%</Badge></div><p className="text-sm text-muted-foreground">{m.technique.description}</p></CardContent></Card>
            )) : <Alert><Shield className="h-4 w-4" /><AlertDescription>No manipulation detected.</AlertDescription></Alert>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
