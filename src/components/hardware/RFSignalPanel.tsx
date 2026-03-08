import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRFSignalIntelligence } from '@/hooks/useRFSignalIntelligence';
import { Radio, AlertTriangle, Shield, RefreshCw } from 'lucide-react';

export function RFSignalPanel() {
  const {
    captures,
    isLoading,
    threatSummary,
    hostileCaptures,
    suspiciousCaptures,
    isCapturing,
    startCapture,
    stopCapture,
    refetch,
  } = useRFSignalIntelligence();

  return (
    <div className="space-y-4">
      {/* Threat Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{threatSummary?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total Captures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-destructive">{threatSummary?.hostile ?? 0}</div>
            <p className="text-xs text-muted-foreground">Hostile</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{threatSummary?.suspicious ?? 0}</div>
            <p className="text-xs text-muted-foreground">Suspicious</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-500">{threatSummary?.benign ?? 0}</div>
            <p className="text-xs text-muted-foreground">Benign</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              RF Signal Intelligence
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant={isCapturing ? 'destructive' : 'default'}
                onClick={isCapturing ? stopCapture : startCapture}
              >
                {isCapturing ? 'Stop Capture' : 'Start Capture'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading captures...</p>
          ) : captures.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No RF captures yet. Start a capture session to begin.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {captures.slice(0, 20).map((capture) => (
                <div key={capture.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {capture.threat_classification === 'hostile' ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : capture.threat_classification === 'suspicious' ? (
                      <Shield className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Radio className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{capture.signal_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {capture.frequency_hz ? `${(capture.frequency_hz / 1e6).toFixed(2)} MHz` : 'Unknown freq'}
                        {capture.protocol && ` • ${capture.protocol}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={capture.threat_classification === 'hostile' ? 'destructive' : capture.threat_classification === 'suspicious' ? 'outline' : 'secondary'}
                    className="text-xs"
                  >
                    {capture.threat_classification ?? 'unknown'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
