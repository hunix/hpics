/**
 * Local AI Settings
 * 
 * Configure endpoints for local GPU-powered AI services:
 * - Ollama/vLLM for LLM inference
 * - Faster-Whisper for transcription
 * - Faiss for vector search
 * - Video analytics server
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Server, 
  Cpu, 
  Activity, 
  Database,
  Video,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { localAI, type LocalAIStatus, type LocalAIConfig } from '@/lib/localAI';
import { toast } from 'sonner';

export function LocalAISettings() {
  const [config, setConfig] = useState<LocalAIConfig>(localAI.getConfig());
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [autoConnect, setAutoConnect] = useState(true);

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = localAI.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus.llm.available && newStatus.llm.models.length > 0) {
        setAvailableModels(newStatus.llm.models);
      }
    });

    // Initial check
    testConnections();

    return unsubscribe;
  }, []);

  const testConnections = async () => {
    setIsTesting(true);
    try {
      await localAI.checkAllServices();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localAI.updateConfig(config);
      await localAI.checkAllServices();
      toast.success('Local AI settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<LocalAIConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Local AI Infrastructure</h2>
          <p className="text-muted-foreground">
            Connect to your GPU cluster for private, unlimited AI inference
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={testConnections}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connections
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Auto-connect toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-connect">Enable Local AI</Label>
              <p className="text-sm text-muted-foreground">
                Automatically connect to local GPU services when available
              </p>
            </div>
            <Switch
              id="auto-connect"
              checked={autoConnect}
              onCheckedChange={setAutoConnect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* LLM Service */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                LLM Inference
              </CardTitle>
              <StatusBadge available={status?.llm.available || false} />
            </div>
            <CardDescription>
              Self-hosted LLM via Ollama or vLLM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="llm-endpoint">Endpoint</Label>
              <Input
                id="llm-endpoint"
                placeholder="http://localhost:11434"
                value={config.llm.endpoint || ''}
                onChange={(e) => updateConfig({ 
                  llm: { ...config.llm, endpoint: e.target.value } 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="llm-model">Model</Label>
              <Select
                value={config.llm.model || ''}
                onValueChange={(v) => updateConfig({ 
                  llm: { ...config.llm, model: v } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.length > 0 ? (
                    availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="llama3.1:70b">Llama 3.1 70B</SelectItem>
                      <SelectItem value="deepseek-coder-v3">DeepSeek Coder V3</SelectItem>
                      <SelectItem value="mixtral:8x7b">Mixtral 8x7B</SelectItem>
                      <SelectItem value="qwen2.5:72b">Qwen2.5 72B</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {status?.llm.available && status.llm.models.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {status.llm.models.length} models available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Whisper Service */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                GPU Whisper
              </CardTitle>
              <StatusBadge available={status?.whisper.available || false} />
            </div>
            <CardDescription>
              Faster-Whisper or WhisperX for transcription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="whisper-endpoint">Endpoint</Label>
              <Input
                id="whisper-endpoint"
                placeholder="http://localhost:8000"
                value={config.whisper.endpoint || ''}
                onChange={(e) => updateConfig({ 
                  whisper: { ...config.whisper, endpoint: e.target.value } 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whisper-model">Model</Label>
              <Select
                value={config.whisper.model || 'large-v3'}
                onValueChange={(v) => updateConfig({ 
                  whisper: { ...config.whisper, model: v as any } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiny">Tiny (Fast)</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large-v3">Large V3 (Best)</SelectItem>
                  <SelectItem value="turbo">Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status?.whisper.available && (
              <p className="text-xs text-muted-foreground">
                {status.whisper.activeJobs} active jobs, {status.whisper.queuedFiles} queued
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vector Store */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                GPU Vector Store
              </CardTitle>
              <StatusBadge available={status?.vectorStore.available || false} />
            </div>
            <CardDescription>
              Faiss with cuVS for GPU-accelerated search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="vector-endpoint">Endpoint</Label>
              <Input
                id="vector-endpoint"
                placeholder="http://localhost:8001"
                value={config.vectorStoreEndpoint}
                onChange={(e) => updateConfig({ 
                  vectorStoreEndpoint: e.target.value 
                })}
              />
            </div>
            {status?.vectorStore.available && (
              <p className="text-xs text-muted-foreground">
                {status.vectorStore.indexes.length} indexes, {status.vectorStore.totalVectors.toLocaleString()} vectors
              </p>
            )}
          </CardContent>
        </Card>

        {/* Video Analytics */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Analytics
              </CardTitle>
              <StatusBadge available={status?.videoAnalytics.available || false} />
            </div>
            <CardDescription>
              YOLO + DeepFace for real-time analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="video-endpoint">Endpoint</Label>
              <Input
                id="video-endpoint"
                placeholder="http://localhost:8002"
                value={config.videoAnalytics.endpoint || ''}
                onChange={(e) => updateConfig({ 
                  videoAnalytics: { ...config.videoAnalytics, endpoint: e.target.value } 
                })}
              />
            </div>
            {status?.videoAnalytics.available && (
              <p className="text-xs text-muted-foreground">
                {status.videoAnalytics.activeStreams} active streams, {status.videoAnalytics.modelsLoaded.length} models loaded
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>To use local GPU inference, you need to run the following services on your machine:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>LLM:</strong> Install Ollama (<code>brew install ollama</code>) and pull a model (<code>ollama pull llama3.1:70b</code>)</li>
            <li><strong>Whisper:</strong> Run Faster-Whisper server (<code>docker run -p 8000:8000 fedirz/faster-whisper-server</code>)</li>
            <li><strong>Vectors:</strong> Deploy Faiss server with GPU support</li>
            <li><strong>Video:</strong> Run YOLO + DeepFace server for real-time analysis</li>
          </ul>
          <p>With your RTX Pro 6000 Blackwell (96GB VRAM), you can run DeepSeek-V3 (671B) with FP4 quantization!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ available }: { available: boolean }) {
  return available ? (
    <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Connected
    </Badge>
  ) : (
    <Badge variant="secondary">
      <XCircle className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  );
}
