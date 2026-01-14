import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Radio, 
  Thermometer, 
  Search, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  MapPin,
} from 'lucide-react';
import { useTSCMIntelligence } from '@/hooks/useTSCMIntelligence';

export function TSCMPanel() {
  const { 
    startSweep, 
    analyzeRoom, 
    detectBugs, 
    getThreatAssessment,
    isStartingSweep,
    isDetecting,
  } = useTSCMIntelligence();

  const [activeSweep, setActiveSweep] = useState<any>(null);
  const [threatAssessment, setThreatAssessment] = useState<any>(null);
  const [detectionResults, setDetectionResults] = useState<any>(null);

  const handleStartSweep = async () => {
    const result = await startSweep({
      room_data: {
        name: 'Conference Room A',
        dimensions: { width: 10, height: 3, depth: 8 },
      },
    });
    if (result) {
      setActiveSweep(result);
    }
  };

  const handleDetectBugs = async () => {
    const result = await detectBugs(activeSweep?.id);
    if (result) {
      setDetectionResults(result);
    }
  };

  const handleGetAssessment = async () => {
    const result = await getThreatAssessment();
    if (result) {
      setThreatAssessment(result);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Technical Surveillance Counter-Measures</h2>
          <p className="text-muted-foreground">Bug detection and counter-surveillance operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGetAssessment} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Threat Assessment
          </Button>
          <Button onClick={handleStartSweep} disabled={isStartingSweep}>
            <Play className="h-4 w-4 mr-2" />
            Start Sweep
          </Button>
        </div>
      </div>

      {/* Threat Assessment Card */}
      {threatAssessment && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Threat Assessment
              </CardTitle>
              <Badge variant={
                threatAssessment.risk_level === 'low' ? 'secondary' :
                threatAssessment.risk_level === 'elevated' ? 'default' : 'destructive'
              }>
                {threatAssessment.risk_level.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold">{threatAssessment.overall_score}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Since Sweep</p>
                <p className="text-2xl font-bold">{threatAssessment.days_since_sweep}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold">{threatAssessment.active_threats}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Historical Incidents</p>
                <p className="text-2xl font-bold">{threatAssessment.historical_incidents}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(threatAssessment.vulnerability_breakdown || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground uppercase">{key}</p>
                  <Progress value={value.score} className="h-2 mt-2" />
                  <p className="text-xs mt-1">{value.score}/100</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sweep Progress */}
      {activeSweep && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Sweep: {activeSweep.room}</CardTitle>
              <Badge variant="default">IN PROGRESS</Badge>
            </div>
            <CardDescription>
              Estimated duration: {activeSweep.estimated_duration_minutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSweep.phases?.map((phase: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {phase.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : phase.status === 'in_progress' ? (
                    <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{phase.name}</p>
                  <Progress value={phase.progress} className="h-1 mt-1" />
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleDetectBugs} disabled={isDetecting}>
                <Search className="h-4 w-4 mr-2" />
                Run Detection
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detection Results */}
      {detectionResults && (
        <Card className={detectionResults.overall_threat_level === 'high' ? 'border-red-500/50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Detection Results
              </CardTitle>
              <Badge variant={
                detectionResults.overall_threat_level === 'low' ? 'secondary' :
                detectionResults.overall_threat_level === 'medium' ? 'default' : 'destructive'
              }>
                {detectionResults.overall_threat_level.toUpperCase()} THREAT
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {detectionResults.findings?.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-red-500">⚠️ Threats Detected</h4>
                {detectionResults.findings.map((finding: any) => (
                  <div
                    key={finding.id}
                    className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{finding.type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {finding.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Freq: {finding.frequency} MHz</span>
                          <span>Power: {finding.power} dBm</span>
                          <span>Confidence: {Math.round(finding.confidence * 100)}%</span>
                        </div>
                      </div>
                      <Badge variant="destructive">{finding.threat_level}</Badge>
                    </div>
                    <p className="text-sm text-orange-400 mt-2">
                      ⚡ {finding.recommended_action}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span>No threats detected in scanned areas</span>
              </div>
            )}

            {detectionResults.clean_areas?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-500">✓ Cleared Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {detectionResults.clean_areas.map((area: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-green-500 border-green-500/50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {area.zone.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {detectionResults.recommendations?.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {detectionResults.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Radio className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">RF Spectrum Scan</h3>
              <p className="text-sm text-muted-foreground">Analyze radio frequencies</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Thermometer className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium">Thermal Sweep</h3>
              <p className="text-sm text-muted-foreground">Detect hidden electronics</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium">Room Analysis</h3>
              <p className="text-sm text-muted-foreground">Vulnerability mapping</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
