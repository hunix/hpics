import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThermalIntelligence } from '@/hooks/useThermalIntelligence';
import { Thermometer, RefreshCw } from 'lucide-react';

export function ThermalIntelPanel() {
  const {
    captures,
    isLoading,
    capturesWithAnomalies,
    isScanning,
    startScanning,
    stopScanning,
    refetch,
  } = useThermalIntelligence();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Thermal Intelligence
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant={isScanning ? 'destructive' : 'default'}
                onClick={isScanning ? stopScanning : startScanning}
              >
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading thermal data...</p>
          ) : captures.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No thermal captures yet. Start a capture session to begin.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {captures.slice(0, 20).map((capture: any) => (
                <div key={capture.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">
                      {capture.capture_type ?? 'Thermal Scan'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {capture.temperature_c != null ? `${capture.temperature_c}°C` : ''}
                      {capture.location_name && ` • ${capture.location_name}`}
                    </p>
                  </div>
                  {capture.anomaly_detected && (
                    <Badge variant="destructive" className="text-xs">Anomaly</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
