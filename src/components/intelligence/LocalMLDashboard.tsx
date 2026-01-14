import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cpu, Download, CheckCircle2, AlertTriangle, 
  Loader2, HardDrive, Wifi, WifiOff, RefreshCw, Trash2
} from 'lucide-react';
import { useModelCache, modelCacheManager } from '@/lib/modelCacheManager';
import { offlineMLService, type MLModelStatus } from '@/lib/offlineMLService';
import { toast } from 'sonner';

interface LocalMLDashboardProps {
  onModelReady?: (modelName: string) => void;
}

export function LocalMLDashboard({ onModelReady }: LocalMLDashboardProps) {
  const { cacheStatus, loadModel, clearCache } = useModelCache();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [modelStatuses, setModelStatuses] = useState<Record<string, MLModelStatus>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('models');

  const models = [
    { 
      id: 'face-detection', 
      name: 'Face Detection', 
      description: 'MediaPipe face detection and mesh',
      size: '~5MB',
      capabilities: ['Face detection', 'Landmark extraction', 'Head pose']
    },
    { 
      id: 'face-recognition', 
      name: 'Face Recognition', 
      description: 'face-api.js recognition models',
      size: '~30MB',
      capabilities: ['Face embeddings', 'Identity matching', 'Age/Gender']
    },
    { 
      id: 'sentiment', 
      name: 'Sentiment Analysis', 
      description: 'Text sentiment classification',
      size: '~10MB',
      capabilities: ['Positive/Negative', 'Emotion detection', 'Intensity scoring']
    },
    { 
      id: 'speaker-diarization', 
      name: 'Speaker Identification', 
      description: 'Voice embeddings and speaker separation',
      size: '~15MB',
      capabilities: ['Speaker embeddings', 'Voice matching', 'Diarization']
    }
  ];

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check model status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await offlineMLService.getStatus();
      setModelStatuses(status);
    };
    checkStatus();
  }, []);

  const handleLoadModel = async (modelId: string) => {
    setIsLoading(prev => ({ ...prev, [modelId]: true }));
    
    try {
      await loadModel(modelId);
      const status = await offlineMLService.getStatus();
      setModelStatuses(status);
      toast.success(`${modelId} model loaded successfully`);
      onModelReady?.(modelId);
    } catch (error) {
      toast.error(`Failed to load ${modelId} model`);
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, [modelId]: false }));
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      const status = await offlineMLService.getStatus();
      setModelStatuses(status);
      toast.success('Model cache cleared');
    } catch (error) {
      toast.error('Failed to clear cache');
      console.error(error);
    }
  };

  const getModelStatus = (modelId: string): 'loaded' | 'cached' | 'available' | 'error' => {
    const status = modelStatuses[modelId];
    if (!status) return 'available';
    if (status.error) return 'error';
    if (status.loaded) return 'loaded';
    if (status.cached) return 'cached';
    return 'available';
  };

  const getStatusBadge = (status: 'loaded' | 'cached' | 'available' | 'error') => {
    switch (status) {
      case 'loaded':
        return <Badge className="bg-green-500">Loaded</Badge>;
      case 'cached':
        return <Badge variant="secondary">Cached</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
  };

  const totalCacheSize = Object.values(cacheStatus).reduce(
    (sum, status) => sum + (status.size || 0), 0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Local ML Models
            </CardTitle>
            <CardDescription>
              On-device machine learning for offline processing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4 mt-4">
            {/* Quick Status */}
            <div className="grid grid-cols-4 gap-3">
              {models.map(model => {
                const status = getModelStatus(model.id);
                return (
                  <Card key={model.id} className={status === 'loaded' ? 'border-green-500/50' : ''}>
                    <CardContent className="p-3 text-center">
                      <div className="flex justify-center mb-2">
                        {status === 'loaded' ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : status === 'error' ? (
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        ) : (
                          <Cpu className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.size}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Model List */}
            <div className="space-y-3">
              {models.map(model => {
                const status = getModelStatus(model.id);
                const loading = isLoading[model.id];

                return (
                  <Card key={model.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{model.name}</p>
                            {getStatusBadge(status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {model.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.capabilities.map((cap, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{model.size}</span>
                          {status !== 'loaded' && (
                            <Button
                              size="sm"
                              variant={status === 'cached' ? 'secondary' : 'default'}
                              onClick={() => handleLoadModel(model.id)}
                              disabled={loading || (!isOnline && status !== 'cached')}
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : status === 'cached' ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Load
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!isOnline && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  You're offline. Only cached models can be loaded.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="cache" className="space-y-4 mt-4">
            {/* Cache Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Cache Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Cache Size</span>
                    <span className="font-mono">{(totalCacheSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <Progress value={Math.min(100, (totalCacheSize / (100 * 1024 * 1024)) * 100)} />
                  <p className="text-xs text-muted-foreground">
                    Models are cached in IndexedDB for offline use
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cache Status per Model */}
            <div className="space-y-2">
              {Object.entries(cacheStatus).map(([modelId, status]) => (
                <div key={modelId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{modelId}</p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {status.lastUpdated ? new Date(status.lastUpdated).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {status.size ? `${(status.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </span>
                    {status.cached && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cache Actions */}
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={handleClearCache}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Cache
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="capabilities" className="mt-4">
            <div className="space-y-4">
              <Alert>
                <Cpu className="h-4 w-4" />
                <AlertDescription>
                  Local ML models enable privacy-preserving analysis without sending data to external servers.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Face Detection & Recognition</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Real-time face detection using MediaPipe</li>
                    <li>• 68-point facial landmark extraction</li>
                    <li>• Head pose estimation (yaw, pitch, roll)</li>
                    <li>• Face embedding generation for identity matching</li>
                    <li>• Age and gender estimation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Text & Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Positive/Negative sentiment classification</li>
                    <li>• Emotion detection (joy, anger, sadness, etc.)</li>
                    <li>• Sentiment intensity scoring</li>
                    <li>• Multi-language support</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Speaker Identification</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Voice embedding extraction</li>
                    <li>• Speaker diarization (who spoke when)</li>
                    <li>• Voice matching across recordings</li>
                    <li>• Speaker count estimation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Behavioral Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Activity classification from sensor data</li>
                    <li>• Gait pattern analysis</li>
                    <li>• Keystroke dynamics profiling</li>
                    <li>• Anomaly detection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
