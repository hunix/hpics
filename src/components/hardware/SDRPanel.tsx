import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Radio, 
  Waves, 
  Play, 
  Pause, 
  AlertTriangle,
  Activity,
  Search,
  Zap,
} from 'lucide-react';
import { useSDRIntelligence } from '@/hooks/useSDRIntelligence';

export function SDRPanel() {
  const { 
    startScan, 
    analyzeSignal, 
    detectAnomalies, 
    sweepFrequencies,
    isScanning,
    isAnalyzing,
  } = useSDRIntelligence();

  const [scanActive, setScanActive] = useState(false);
  const [frequencyRange, setFrequencyRange] = useState({ start: 400, end: 500 });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [sweepResults, setSweepResults] = useState<any>(null);

  const handleStartScan = async () => {
    setScanActive(true);
    await startScan({
      device_id: 'sdr-001',
      frequency_range: frequencyRange,
    });
  };

  const handleStopScan = () => {
    setScanActive(false);
  };

  const handleDetectAnomalies = async () => {
    const result = await detectAnomalies();
    if (result) {
      setAnomalies(result);
    }
  };

  const handleSweep = async () => {
    const result = await sweepFrequencies({
      start_freq: frequencyRange.start,
      end_freq: frequencyRange.end,
      step_size: 1,
      dwell_time_ms: 50,
    });
    if (result) {
      setSweepResults(result);
    }
  };

  const handleQuickAnalyze = async (freq: number) => {
    const result = await analyzeSignal({
      frequency: freq,
      power: -60 + Math.random() * 30,
      bandwidth: 20,
      modulation: 'unknown',
    });
    if (result) {
      setAnalysisResult(result);
    }
  };

  // Common frequency bands for quick access
  const frequencyBands = [
    { name: 'WiFi 2.4GHz', start: 2400, end: 2500 },
    { name: 'WiFi 5GHz', start: 5150, end: 5850 },
    { name: 'Cellular', start: 850, end: 960 },
    { name: 'ISM 433MHz', start: 430, end: 440 },
    { name: 'ISM 868MHz', start: 863, end: 870 },
    { name: 'GPS L1', start: 1574, end: 1577 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Software Defined Radio</h2>
          <p className="text-muted-foreground">Spectrum monitoring and signal analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={scanActive ? 'default' : 'secondary'}>
            {scanActive ? 'SCANNING' : 'IDLE'}
          </Badge>
          {scanActive ? (
            <Button onClick={handleStopScan} variant="destructive" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button onClick={handleStartScan} size="sm">
              <Play className="h-4 w-4 mr-2" />
              Start Scan
            </Button>
          )}
        </div>
      </div>

      {/* Frequency Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Frequency Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Frequency (MHz)</Label>
              <Input
                type="number"
                value={frequencyRange.start}
                onChange={(e) => setFrequencyRange(prev => ({ ...prev, start: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Frequency (MHz)</Label>
              <Input
                type="number"
                value={frequencyRange.end}
                onChange={(e) => setFrequencyRange(prev => ({ ...prev, end: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {frequencyBands.map((band) => (
              <Button
                key={band.name}
                variant="outline"
                size="sm"
                onClick={() => setFrequencyRange({ start: band.start, end: band.end })}
              >
                {band.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSweep} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Sweep Range
            </Button>
            <Button onClick={handleDetectAnomalies} variant="outline" className="flex-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Detect Anomalies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spectrum Visualization Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Spectrum Analyzer
          </CardTitle>
          <CardDescription>
            {frequencyRange.start} - {frequencyRange.end} MHz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed">
            {sweepResults ? (
              <div className="w-full h-full p-4">
                <div className="flex items-end h-full gap-0.5">
                  {sweepResults.results?.slice(0, 100).map((point: any, i: number) => (
                    <div
                      key={i}
                      className={`flex-1 ${point.peak_detected ? 'bg-red-500' : 'bg-primary/60'}`}
                      style={{ 
                        height: `${Math.max(5, (point.power + 110) * 1.5)}%`,
                      }}
                      title={`${point.frequency} MHz: ${point.power.toFixed(1)} dBm`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Waves className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Run a frequency sweep to visualize the spectrum</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Detected Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{anomaly.type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {anomaly.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Freq: {anomaly.frequency} MHz</span>
                        <span>Power: {anomaly.power} dBm</span>
                      </div>
                    </div>
                    <Badge variant="destructive">{anomaly.threat_level}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleQuickAnalyze(anomaly.frequency)}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signal Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium">{analysisResult.frequency} MHz</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classification</p>
                <p className="font-medium">{analysisResult.classification}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocol</p>
                <p className="font-medium">{analysisResult.protocol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Threat Level</p>
                <Badge variant={
                  analysisResult.threat_level === 'low' ? 'secondary' :
                  analysisResult.threat_level === 'medium' ? 'default' : 'destructive'
                }>
                  {analysisResult.threat_level}
                </Badge>
              </div>
            </div>

            {analysisResult.recommendations && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Recommendations</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analysisResult.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
