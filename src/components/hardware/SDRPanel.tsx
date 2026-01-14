import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    recentCaptures,
    hostileCaptures,
    suspiciousCaptures,
    startScan,
    isStartingScan,
    stopScanning,
    isScanning,
    analyzeSignal,
    detectFrequencyHopping,
    knownFrequencies,
  } = useSDRIntelligence();

  const [frequencyRange, setFrequencyRange] = useState({ start: 400, end: 500 });
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleStartScan = () => {
    startScan({
      device_id: 'sdr-001',
      start_frequency_hz: frequencyRange.start * 1_000_000,
      end_frequency_hz: frequencyRange.end * 1_000_000,
      step_hz: 1_000_000,
      dwell_time_ms: 50,
    });
  };

  const handleStopScan = () => {
    stopScanning();
  };

  const handleDetectHopping = async () => {
    if (recentCaptures.length > 0) {
      const result = await detectFrequencyHopping(recentCaptures, 1000);
      if (result) {
        setAnalysisResult(result);
      }
    }
  };

  const handleQuickAnalyze = async (captureId: string, freq: number) => {
    const result = await analyzeSignal(captureId, {
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
          <Badge variant={isScanning ? 'default' : 'secondary'}>
            {isScanning ? 'SCANNING' : 'IDLE'}
          </Badge>
          {isScanning ? (
            <Button onClick={handleStopScan} variant="destructive" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button onClick={handleStartScan} size="sm" disabled={isStartingScan}>
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
            <Button onClick={handleStartScan} className="flex-1" disabled={isStartingScan}>
              <Search className="h-4 w-4 mr-2" />
              Sweep Range
            </Button>
            <Button onClick={handleDetectHopping} variant="outline" className="flex-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Detect Hopping
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
            {recentCaptures.length > 0 ? (
              <div className="w-full h-full p-4">
                <div className="flex items-end h-full gap-0.5">
                  {recentCaptures.slice(0, 100).map((capture, i) => (
                    <div
                      key={capture.id || i}
                      className={`flex-1 ${capture.threat_classification === 'hostile' ? 'bg-red-500' : capture.threat_classification === 'suspicious' ? 'bg-yellow-500' : 'bg-primary/60'}`}
                      style={{ 
                        height: `${Math.max(5, ((capture.signal_strength_dbm || -100) + 110) * 1.5)}%`,
                      }}
                      title={`${(capture.frequency_hz || 0) / 1_000_000} MHz: ${capture.signal_strength_dbm?.toFixed(1)} dBm`}
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

      {/* Hostile/Suspicious Captures */}
      {(hostileCaptures.length > 0 || suspiciousCaptures.length > 0) && (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Detected Threats ({hostileCaptures.length + suspiciousCaptures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...hostileCaptures, ...suspiciousCaptures].map((capture) => (
                <div
                  key={capture.id}
                  className={`p-4 rounded-lg border ${capture.threat_classification === 'hostile' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{capture.signal_type || 'Unknown Signal'}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {capture.modulation || 'Unknown modulation'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Freq: {((capture.frequency_hz || 0) / 1_000_000).toFixed(2)} MHz</span>
                        <span>Power: {capture.signal_strength_dbm} dBm</span>
                      </div>
                    </div>
                    <Badge variant={capture.threat_classification === 'hostile' ? 'destructive' : 'default'}>
                      {capture.threat_classification}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleQuickAnalyze(capture.id, (capture.frequency_hz || 0) / 1_000_000)}
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
                <p className="font-medium">{analysisResult.frequency || 'N/A'} MHz</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classification</p>
                <p className="font-medium">{analysisResult.classification || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocol</p>
                <p className="font-medium">{analysisResult.protocol || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Threat Level</p>
                <Badge variant={
                  analysisResult.threat_level === 'low' ? 'secondary' :
                  analysisResult.threat_level === 'medium' ? 'default' : 'destructive'
                }>
                  {analysisResult.threat_level || 'unknown'}
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
