import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, Activity, Footprints, MapPin, 
  Battery, Wifi, Bluetooth, CheckCircle2, 
  AlertTriangle, TrendingUp, Clock
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { Geolocation } from '@capacitor/geolocation';
import { gaitAnalyzer, type MotionSample, type GaitProfile } from '@/lib/biometrics/gaitAnalyzer';

interface MobileBiometricFusionProps {
  profileId?: string;
  onGaitCapture?: (profile: GaitProfile) => void;
  onLocationCapture?: (location: { lat: number; lng: number }) => void;
}

interface SensorData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { alpha: number; beta: number; gamma: number };
  timestamp: number;
}

interface FusionScore {
  gait: number;
  location: number;
  activity: number;
  overall: number;
}

export function MobileBiometricFusion({ 
  profileId,
  onGaitCapture,
  onLocationCapture
}: MobileBiometricFusionProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCapturing, setIsCapturing] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gaitProfile, setGaitProfile] = useState<GaitProfile | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [fusionScore, setFusionScore] = useState<FusionScore>({ gait: 0, location: 0, activity: 0, overall: 0 });
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    accelerometer: false,
    gyroscope: false,
    gps: false,
    bluetooth: false
  });

  const isNative = Capacitor.isNativePlatform();

  // Check device capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      if (!isNative) {
        // Check web APIs
        setDeviceCapabilities({
          accelerometer: 'DeviceMotionEvent' in window,
          gyroscope: 'DeviceOrientationEvent' in window,
          gps: 'geolocation' in navigator,
          bluetooth: 'bluetooth' in navigator
        });
        return;
      }

      // Native capabilities always available through Capacitor
      setDeviceCapabilities({
        accelerometer: true,
        gyroscope: true,
        gps: true,
        bluetooth: true
      });
    };

    checkCapabilities();
  }, [isNative]);

  // Capture sensor data
  const startCapture = useCallback(async () => {
    setIsCapturing(true);
    setSensorData([]);
    setStepCount(0);

    if (isNative) {
      // Use Capacitor Motion API
      try {
        await Motion.addListener('accel', (event) => {
          const sample: SensorData = {
            accelerometer: {
              x: event.acceleration.x,
              y: event.acceleration.y,
              z: event.acceleration.z
            },
            gyroscope: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: Date.now()
          };
          setSensorData(prev => [...prev, sample]);
          
          // Step detection
          const magnitude = Math.sqrt(
            event.acceleration.x ** 2 +
            event.acceleration.y ** 2 +
            event.acceleration.z ** 2
          );
          if (magnitude > 12) {
            setStepCount(prev => prev + 1);
          }
        });
      } catch (error) {
        console.error('Motion sensor error:', error);
      }

      // Get location
      try {
        const position = await Geolocation.getCurrentPosition();
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        onLocationCapture?.(location);
      } catch (error) {
        console.error('Geolocation error:', error);
      }
    } else {
      // Web fallback
      const handleMotion = (event: DeviceMotionEvent) => {
        if (!event.accelerationIncludingGravity) return;
        
        const sample: SensorData = {
          accelerometer: {
            x: event.accelerationIncludingGravity.x || 0,
            y: event.accelerationIncludingGravity.y || 0,
            z: event.accelerationIncludingGravity.z || 0
          },
          gyroscope: {
            alpha: event.rotationRate?.alpha || 0,
            beta: event.rotationRate?.beta || 0,
            gamma: event.rotationRate?.gamma || 0
          },
          timestamp: Date.now()
        };
        setSensorData(prev => [...prev, sample]);
      };

      window.addEventListener('devicemotion', handleMotion);

      // Cleanup function stored for later
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, [isNative, onLocationCapture]);

  const stopCapture = useCallback(async () => {
    setIsCapturing(false);

    if (isNative) {
      await Motion.removeAllListeners();
    }

    // Analyze gait from collected data
    if (sensorData.length > 50) {
      const motionSamples: MotionSample[] = sensorData.map(d => ({
        timestamp: d.timestamp,
        accelerometer: d.accelerometer,
        gyroscope: d.gyroscope
      }));

      const profile = gaitAnalyzer.analyzeGait(motionSamples);
      if (profile) {
        setGaitProfile(profile);
        onGaitCapture?.(profile);

        // Update fusion score
        setFusionScore({
          gait: profile.qualityScore,
          location: currentLocation ? 0.8 : 0,
          activity: stepCount > 20 ? 0.9 : stepCount / 20 * 0.9,
          overall: (profile.qualityScore + (currentLocation ? 0.8 : 0) + (stepCount > 20 ? 0.9 : stepCount / 20 * 0.9)) / 3
        });
      }
    }
  }, [sensorData, currentLocation, stepCount, isNative, onGaitCapture]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Biometric Fusion
            </CardTitle>
            <CardDescription>
              Multi-sensor biometric capture and analysis
            </CardDescription>
          </div>
          <Badge variant={isNative ? 'default' : 'secondary'}>
            {isNative ? 'Native App' : 'Web Mode'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Device Capabilities */}
            <div className="grid grid-cols-4 gap-3">
              <Card className={deviceCapabilities.accelerometer ? 'border-green-500/50' : ''}>
                <CardContent className="p-3 text-center">
                  <Activity className={`h-5 w-5 mx-auto mb-1 ${deviceCapabilities.accelerometer ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <p className="text-xs">Accelerometer</p>
                </CardContent>
              </Card>
              <Card className={deviceCapabilities.gyroscope ? 'border-green-500/50' : ''}>
                <CardContent className="p-3 text-center">
                  <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${deviceCapabilities.gyroscope ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <p className="text-xs">Gyroscope</p>
                </CardContent>
              </Card>
              <Card className={deviceCapabilities.gps ? 'border-green-500/50' : ''}>
                <CardContent className="p-3 text-center">
                  <MapPin className={`h-5 w-5 mx-auto mb-1 ${deviceCapabilities.gps ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <p className="text-xs">GPS</p>
                </CardContent>
              </Card>
              <Card className={deviceCapabilities.bluetooth ? 'border-green-500/50' : ''}>
                <CardContent className="p-3 text-center">
                  <Bluetooth className={`h-5 w-5 mx-auto mb-1 ${deviceCapabilities.bluetooth ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <p className="text-xs">Bluetooth</p>
                </CardContent>
              </Card>
            </div>

            {/* Fusion Score */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Biometric Fusion Score</span>
                  <span className="text-2xl font-bold">{(fusionScore.overall * 100).toFixed(0)}%</span>
                </div>
                <Progress value={fusionScore.overall * 100} className="h-2" />
                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Gait</p>
                    <p className="font-mono">{(fusionScore.gait * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-mono">{(fusionScore.location * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Activity</p>
                    <p className="font-mono">{(fusionScore.activity * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capture Controls */}
            <div className="flex gap-2">
              {!isCapturing ? (
                <Button onClick={startCapture} className="flex-1">
                  <Activity className="h-4 w-4 mr-2" />
                  Start Biometric Capture
                </Button>
              ) : (
                <Button onClick={stopCapture} variant="destructive" className="flex-1">
                  Stop Capture
                </Button>
              )}
            </div>

            {/* Live Stats */}
            {isCapturing && (
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Samples</p>
                    <p className="text-xl font-bold">{sensorData.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Steps</p>
                    <p className="text-xl font-bold">{stepCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-xl font-bold">
                      {sensorData.length > 0 
                        ? ((Date.now() - sensorData[0].timestamp) / 1000).toFixed(1) 
                        : 0}s
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sensors" className="space-y-4 mt-4">
            {/* Live Sensor Readings */}
            {sensorData.length > 0 && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Accelerometer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">X</p>
                        <p className="font-mono text-lg">
                          {sensorData[sensorData.length - 1].accelerometer.x.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Y</p>
                        <p className="font-mono text-lg">
                          {sensorData[sensorData.length - 1].accelerometer.y.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Z</p>
                        <p className="font-mono text-lg">
                          {sensorData[sensorData.length - 1].accelerometer.z.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Gyroscope</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Alpha</p>
                        <p className="font-mono text-lg">
                          {sensorData[sensorData.length - 1].gyroscope.alpha.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Beta</p>
                        <p className="font-mono text-lg">
                          {sensorData[sensorData.length - 1].gyroscope.beta.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gamma</p>
                        <p className="font-mono text-lg">
                          {sensorData[sensorData.length - 1].gyroscope.gamma.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Location */}
            {currentLocation && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Latitude</p>
                      <p className="font-mono">{currentLocation.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Longitude</p>
                      <p className="font-mono">{currentLocation.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {sensorData.length === 0 && !isCapturing && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Start capture to view live sensor data.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {gaitProfile ? (
              <>
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Gait Profile Generated</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Steps</p>
                        <p className="font-bold">{gaitProfile.totalSteps}</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Cadence</p>
                        <p className="font-bold">{gaitProfile.features.cadence.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">steps/min</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Symmetry</p>
                        <p className="font-bold">{(gaitProfile.features.symmetryScore * 100).toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Quality</p>
                        <p className="font-bold">{(gaitProfile.qualityScore * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Gait Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Step Length Variance</span>
                      <span className="font-mono">{gaitProfile.features.stepLengthVariance.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Step Duration Mean</span>
                      <span className="font-mono">{gaitProfile.features.stepDurationMean.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vertical Oscillation</span>
                      <span className="font-mono">{gaitProfile.features.verticalOscillation.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stride Regularity</span>
                      <span className="font-mono">{(gaitProfile.features.strideRegularity * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Anomalies */}
                {gaitProfile.anomalies.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Detected Anomalies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {gaitProfile.anomalies.map((anomaly, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-orange-500/10 rounded">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{anomaly.type}</p>
                              <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Alert>
                <Footprints className="h-4 w-4" />
                <AlertDescription>
                  Walk with the device for at least 10 seconds to generate a gait profile.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
