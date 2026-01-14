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
  Play,
  FileText,
  MapPin,
} from 'lucide-react';
import { useTSCMIntelligence } from '@/hooks/useTSCMIntelligence';

export function TSCMPanel() {
  const { 
    sweeps,
    activeSweep,
    criticalSweeps,
    highSweeps,
    completedSweeps,
    startSweep,
    isStartingSweep,
    completeSweep,
    isCompletingSweep,
    generateReport,
    getProtocol,
  } = useTSCMIntelligence();

  const [detectionResults, setDetectionResults] = useState<any>(null);

  const handleStartSweep = () => {
    startSweep({
      location_name: 'Conference Room A',
      sweep_type: 'comprehensive',
      devices: ['rf-scanner-001', 'thermal-001'],
    });
  };

  const handleCompleteSweep = () => {
    if (activeSweep?.id) {
      completeSweep(activeSweep.id);
    }
  };

  const handleGenerateReport = async () => {
    if (activeSweep?.id) {
      const report = await generateReport(activeSweep.id);
      if (report) {
        console.log('Report generated:', report);
      }
    }
  };

  const threatStats = {
    critical: criticalSweeps.length,
    high: highSweeps.length,
    total: sweeps.length,
    completed: completedSweeps.length,
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
          <Button onClick={handleStartSweep} disabled={isStartingSweep || !!activeSweep}>
            <Play className="h-4 w-4 mr-2" />
            Start Sweep
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Sweeps</p>
            <p className="text-2xl font-bold">{threatStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-500">{threatStats.completed}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="text-2xl font-bold text-red-500">{threatStats.critical}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">High</p>
            <p className="text-2xl font-bold text-orange-500">{threatStats.high}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sweep Progress */}
      {activeSweep && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Sweep: {activeSweep.location_name}</CardTitle>
              <Badge variant="default">IN PROGRESS</Badge>
            </div>
            <CardDescription>
              Started: {new Date(activeSweep.started_at || activeSweep.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">RF Spectrum Analysis</p>
                  <Progress value={50} className="h-1 mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Thermal Scanning</p>
                  <Progress value={0} className="h-1 mt-1" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCompleteSweep} disabled={isCompletingSweep}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Sweep
              </Button>
              <Button variant="outline" onClick={handleGenerateReport}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Completed Sweeps */}
      {completedSweeps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sweeps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedSweeps.slice(0, 5).map((sweep) => (
                <div
                  key={sweep.id}
                  className={`p-4 rounded-lg border ${
                    sweep.threat_level === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    sweep.threat_level === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{sweep.location_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(sweep.completed_at || sweep.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      sweep.threat_level === 'critical' ? 'destructive' :
                      sweep.threat_level === 'high' ? 'default' : 'secondary'
                    }>
                      {sweep.threat_level || 'clear'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
