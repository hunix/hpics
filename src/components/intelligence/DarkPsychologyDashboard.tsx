import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Eye, Shield, Target, AlertTriangle, Zap, Skull } from 'lucide-react';
import { assessDarkTriad, detectManipulation, type DarkTetradAssessment } from '@/lib/psychology/darkPsychologyEngine';

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
    const darkTetrad = assessDarkTriad(behavioralData);
    const manipulation = detectManipulation(behavioralData.messages.map(m => m.content).join(' '));
    return { darkTetrad, manipulation };
  }, [behavioralData]);

  const getTraitColor = (score: number) => score >= 70 ? 'text-red-500' : score >= 40 ? 'text-orange-500' : 'text-green-500';
  const getTraitBadge = (score: number): 'destructive' | 'secondary' | 'outline' => score >= 70 ? 'destructive' : score >= 40 ? 'secondary' : 'outline';

  if (!behavioralData || !analysis) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Dark Tetrad Analysis</CardTitle></CardHeader>
        <CardContent><Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>No behavioral data for {profileName}. Collect messages and observations first.</AlertDescription></Alert></CardContent>
      </Card>
    );
  }

  const { darkTetrad, manipulation } = analysis;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Dark Tetrad Analysis</CardTitle>
            <CardDescription>Profile: {profileName} • Dominant: {darkTetrad.dominantTrait?.toUpperCase() || 'BALANCED'}</CardDescription>
          </div>
          <Badge variant={getTraitBadge(darkTetrad.overallDarkness)}>{darkTetrad.riskLevel.toUpperCase()} RISK</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="darktetrad">Dark Tetrad</TabsTrigger>
            <TabsTrigger value="sadism">Sadism</TabsTrigger>
            <TabsTrigger value="manipulation">Manipulation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 gap-3">
              <Card><CardContent className="p-3 text-center"><Eye className="h-5 w-5 mx-auto mb-1 text-purple-500" /><p className="text-xs text-muted-foreground">Narcissism</p><p className={`text-xl font-bold ${getTraitColor(darkTetrad.narcissism.score)}`}>{darkTetrad.narcissism.score.toFixed(0)}%</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><Target className="h-5 w-5 mx-auto mb-1 text-blue-500" /><p className="text-xs text-muted-foreground">Machiavellian</p><p className={`text-xl font-bold ${getTraitColor(darkTetrad.machiavellianism.score)}`}>{darkTetrad.machiavellianism.score.toFixed(0)}%</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><Zap className="h-5 w-5 mx-auto mb-1 text-red-500" /><p className="text-xs text-muted-foreground">Psychopathy</p><p className={`text-xl font-bold ${getTraitColor(darkTetrad.psychopathy.score)}`}>{darkTetrad.psychopathy.score.toFixed(0)}%</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><Skull className="h-5 w-5 mx-auto mb-1 text-rose-600" /><p className="text-xs text-muted-foreground">Sadism</p><p className={`text-xl font-bold ${getTraitColor(darkTetrad.sadism.score)}`}>{darkTetrad.sadism.score.toFixed(0)}%</p></CardContent></Card>
            </div>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Dark Tetrad Composite</CardTitle></CardHeader><CardContent><Progress value={darkTetrad.darkTetradScore} className="h-3" /><p className="text-right mt-1 font-bold">{darkTetrad.darkTetradScore.toFixed(0)}%</p></CardContent></Card>
          </TabsContent>

          <TabsContent value="darktetrad" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Narcissism</CardTitle><Badge variant={getTraitBadge(darkTetrad.narcissism.score)}>{darkTetrad.narcissism.score.toFixed(0)}%</Badge></div></CardHeader>
              <CardContent>
                <Progress value={darkTetrad.narcissism.score} className="mb-3" />
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                  <span>Grandiose: {darkTetrad.narcissism.grandiose.toFixed(0)}%</span>
                  <span>Vulnerable: {darkTetrad.narcissism.vulnerable.toFixed(0)}%</span>
                  <span>Communal: {darkTetrad.narcissism.communal.toFixed(0)}%</span>
                </div>
                {darkTetrad.narcissism.indicators.length > 0 && <div className="flex flex-wrap gap-1">{darkTetrad.narcissism.indicators.map((ind, i) => <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>)}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Machiavellianism</CardTitle><Badge variant={getTraitBadge(darkTetrad.machiavellianism.score)}>{darkTetrad.machiavellianism.score.toFixed(0)}%</Badge></div></CardHeader>
              <CardContent>
                <Progress value={darkTetrad.machiavellianism.score} className="mb-3" />
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                  <span>Strategic: {darkTetrad.machiavellianism.strategic.toFixed(0)}%</span>
                  <span>Cynical: {darkTetrad.machiavellianism.cynical.toFixed(0)}%</span>
                  <span>Coalition: {darkTetrad.machiavellianism.coalition.toFixed(0)}%</span>
                </div>
                {darkTetrad.machiavellianism.indicators.length > 0 && <div className="flex flex-wrap gap-1">{darkTetrad.machiavellianism.indicators.map((ind, i) => <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>)}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Psychopathy</CardTitle><Badge variant={getTraitBadge(darkTetrad.psychopathy.score)}>{darkTetrad.psychopathy.score.toFixed(0)}%</Badge></div></CardHeader>
              <CardContent>
                <Progress value={darkTetrad.psychopathy.score} className="mb-3" />
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                  <span>Primary: {darkTetrad.psychopathy.primary.toFixed(0)}%</span>
                  <span>Secondary: {darkTetrad.psychopathy.secondary.toFixed(0)}%</span>
                  <span>Fearless: {darkTetrad.psychopathy.fearless.toFixed(0)}%</span>
                </div>
                {darkTetrad.psychopathy.indicators.length > 0 && <div className="flex flex-wrap gap-1">{darkTetrad.psychopathy.indicators.map((ind, i) => <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>)}</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sadism" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Skull className="h-4 w-4 text-rose-600" />Sadism Profile</CardTitle>
                  <Badge variant={getTraitBadge(darkTetrad.sadism.score)}>{darkTetrad.sadism.score.toFixed(0)}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={darkTetrad.sadism.score} className="h-3" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Vicarious</p>
                    <p className="text-lg font-bold">{darkTetrad.sadism.vicarious.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Enjoys watching suffering</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Direct</p>
                    <p className="text-lg font-bold">{darkTetrad.sadism.direct.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Enjoys causing suffering</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Verbal</p>
                    <p className="text-lg font-bold">{darkTetrad.sadism.verbal.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Verbal cruelty patterns</p>
                  </div>
                </div>
                {darkTetrad.sadism.indicators.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Detected Indicators:</p>
                    <div className="flex flex-wrap gap-1">{darkTetrad.sadism.indicators.map((ind, i) => <Badge key={i} variant="destructive" className="text-xs">{ind}</Badge>)}</div>
                  </div>
                )}
                {darkTetrad.sadism.score >= 50 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>High sadism score detected. Exercise caution in interactions.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
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
