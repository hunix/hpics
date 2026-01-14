import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, Eye, Mic, Brain, AlertTriangle, 
  TrendingUp, Clock, FileText, Activity, 
  CheckCircle2, XCircle
} from 'lucide-react';
import type { MicroExpressionEvent } from '@/lib/psychology/microExpressionAnalyzer';
import type { VoiceDeceptionAnalysis } from '@/lib/psychology/voiceStressAnalyzer';

interface DeceptionSignal {
  source: 'facial' | 'vocal' | 'linguistic' | 'behavioral';
  type: string;
  description: string;
  timestamp: number;
  severity: number;
  confidence: number;
}

interface StatementAnalysis {
  text: string;
  timestamp: number;
  signals: DeceptionSignal[];
  overallScore: number;
  isDeceptive: boolean;
}

interface DeceptionDetectionConsoleProps {
  profileId: string;
  profileName: string;
  facialEvents?: MicroExpressionEvent[];
  voiceAnalysis?: VoiceDeceptionAnalysis[];
  statements?: { text: string; timestamp: number }[];
  onStatementSelect?: (statement: StatementAnalysis) => void;
}

export function DeceptionDetectionConsole({
  profileId,
  profileName,
  facialEvents = [],
  voiceAnalysis = [],
  statements = [],
  onStatementSelect
}: DeceptionDetectionConsoleProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatement, setSelectedStatement] = useState<StatementAnalysis | null>(null);

  // Aggregate all deception signals
  const allSignals = useMemo(() => {
    const signals: DeceptionSignal[] = [];

    // Process facial events
    facialEvents.forEach(event => {
      if (event.deceptionIndicators) {
        event.deceptionIndicators.forEach(indicator => {
          signals.push({
            source: 'facial',
            type: indicator.type,
            description: indicator.description,
            timestamp: event.timestamp,
            severity: indicator.severity || 0.5,
            confidence: event.confidence
          });
        });
      }
    });

    // Process voice analysis
    voiceAnalysis.forEach(analysis => {
      if (analysis.indicators) {
        analysis.indicators.forEach(indicator => {
          signals.push({
            source: 'vocal',
            type: indicator.type,
            description: indicator.description,
            timestamp: analysis.timestamp || 0,
            severity: indicator.severity,
            confidence: analysis.confidence || 0.7
          });
        });
      }
    });

    return signals.sort((a, b) => b.severity - a.severity);
  }, [facialEvents, voiceAnalysis]);

  // Analyze statements with cross-modal signals
  const analyzedStatements = useMemo(() => {
    return statements.map(statement => {
      const windowMs = 5000; // 5 second window around statement
      const relevantSignals = allSignals.filter(
        signal => Math.abs(signal.timestamp - statement.timestamp) < windowMs
      );

      const overallScore = relevantSignals.length > 0
        ? relevantSignals.reduce((sum, s) => sum + s.severity * s.confidence, 0) / relevantSignals.length
        : 0;

      return {
        text: statement.text,
        timestamp: statement.timestamp,
        signals: relevantSignals,
        overallScore,
        isDeceptive: overallScore > 0.6
      };
    });
  }, [statements, allSignals]);

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const facialCount = allSignals.filter(s => s.source === 'facial').length;
    const vocalCount = allSignals.filter(s => s.source === 'vocal').length;
    const linguisticCount = allSignals.filter(s => s.source === 'linguistic').length;
    const behavioralCount = allSignals.filter(s => s.source === 'behavioral').length;

    const avgSeverity = allSignals.length > 0
      ? allSignals.reduce((sum, s) => sum + s.severity, 0) / allSignals.length
      : 0;

    const deceptiveStatements = analyzedStatements.filter(s => s.isDeceptive).length;
    const totalStatements = analyzedStatements.length;

    return {
      facialCount,
      vocalCount,
      linguisticCount,
      behavioralCount,
      totalSignals: allSignals.length,
      avgSeverity,
      deceptiveStatements,
      totalStatements,
      deceptionRate: totalStatements > 0 ? deceptiveStatements / totalStatements : 0
    };
  }, [allSignals, analyzedStatements]);

  const handleStatementClick = (statement: StatementAnalysis) => {
    setSelectedStatement(statement);
    onStatementSelect?.(statement);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facial': return <Eye className="h-4 w-4" />;
      case 'vocal': return <Mic className="h-4 w-4" />;
      case 'linguistic': return <FileText className="h-4 w-4" />;
      case 'behavioral': return <Activity className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Deception Detection Console
            </CardTitle>
            <CardDescription>
              Cross-modal deception analysis for {profileName}
            </CardDescription>
          </div>
          <Badge 
            variant={metrics.deceptionRate > 0.5 ? 'destructive' : metrics.deceptionRate > 0.2 ? 'secondary' : 'outline'}
          >
            {(metrics.deceptionRate * 100).toFixed(0)}% Deception Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="signals">Signals ({metrics.totalSignals})</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Signal Sources */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Facial</p>
                  <p className="text-2xl font-bold">{metrics.facialCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Mic className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-xs text-muted-foreground">Vocal</p>
                  <p className="text-2xl font-bold">{metrics.vocalCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-xs text-muted-foreground">Linguistic</p>
                  <p className="text-2xl font-bold">{metrics.linguisticCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Behavioral</p>
                  <p className="text-2xl font-bold">{metrics.behavioralCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Overall Assessment */}
            <Card className={metrics.avgSeverity > 0.6 ? 'border-red-500/50 bg-red-500/5' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overall Deception Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Progress value={metrics.avgSeverity * 100} className="flex-1" />
                  <span className="font-bold text-lg">{(metrics.avgSeverity * 100).toFixed(0)}%</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Signals</p>
                    <p className="font-bold">{metrics.totalSignals}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Flagged Statements</p>
                    <p className="font-bold">{metrics.deceptiveStatements}/{metrics.totalStatements}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Severity</p>
                    <p className="font-bold">{(metrics.avgSeverity * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Signals */}
            {allSignals.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Highest Severity Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allSignals.slice(0, 5).map((signal, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        {getSourceIcon(signal.source)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{signal.type}</p>
                          <p className="text-xs text-muted-foreground">{signal.description}</p>
                        </div>
                        <Badge variant={signal.severity > 0.7 ? 'destructive' : 'secondary'}>
                          {(signal.severity * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="signals" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {allSignals.map((signal, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          signal.source === 'facial' ? 'bg-blue-500/10' :
                          signal.source === 'vocal' ? 'bg-green-500/10' :
                          signal.source === 'linguistic' ? 'bg-purple-500/10' :
                          'bg-orange-500/10'
                        }`}>
                          {getSourceIcon(signal.source)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{signal.type}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {formatTime(signal.timestamp)}
                              </Badge>
                              <Badge variant={signal.severity > 0.7 ? 'destructive' : 'secondary'}>
                                {(signal.severity * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{signal.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <Progress value={signal.confidence * 100} className="w-20 h-1" />
                            <span className="text-xs">{(signal.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {allSignals.length === 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      No deception signals detected in the available data.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="statements" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {analyzedStatements.map((statement, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                      selectedStatement === statement ? 'border-primary bg-primary/5' : ''
                    } ${statement.isDeceptive ? 'border-red-500/50' : ''}`}
                    onClick={() => handleStatementClick(statement)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {statement.isDeceptive ? (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm">{statement.text}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(statement.timestamp)}
                            <span className="mx-1">•</span>
                            {statement.signals.length} signals
                          </p>
                        </div>
                      </div>
                      <Badge variant={statement.isDeceptive ? 'destructive' : 'outline'}>
                        {(statement.overallScore * 100).toFixed(0)}%
                      </Badge>
                    </div>

                    {statement.signals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {statement.signals.slice(0, 3).map((signal, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {signal.source}: {signal.type}
                          </Badge>
                        ))}
                        {statement.signals.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{statement.signals.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                ))}

                {analyzedStatements.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No statements available for analysis. Add transcript data to analyze.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  {/* Timeline visualization */}
                  <div className="h-24 bg-muted/30 rounded relative overflow-hidden">
                    {allSignals.map((signal, idx) => {
                      const maxTime = Math.max(...allSignals.map(s => s.timestamp), 1);
                      const position = (signal.timestamp / maxTime) * 100;
                      return (
                        <div
                          key={idx}
                          className={`absolute bottom-0 w-2 rounded-t transition-all hover:opacity-80 ${
                            signal.source === 'facial' ? 'bg-blue-500' :
                            signal.source === 'vocal' ? 'bg-green-500' :
                            signal.source === 'linguistic' ? 'bg-purple-500' :
                            'bg-orange-500'
                          }`}
                          style={{ 
                            left: `${position}%`,
                            height: `${signal.severity * 100}%`
                          }}
                          title={`${signal.type} - ${formatTime(signal.timestamp)}`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <span>Facial</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span>Vocal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-purple-500" />
                      <span>Linguistic</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-orange-500" />
                      <span>Behavioral</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
