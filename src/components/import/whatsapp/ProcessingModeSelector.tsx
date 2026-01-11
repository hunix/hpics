import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Cloud, Zap, HardDrive, Wifi, Info } from 'lucide-react';
import { formatFileSize } from './whatsappZipProcessor';
import { 
  getDeviceCapabilities, 
  recommendProcessingMode, 
  type DeviceCapabilities,
  type ProcessingMode,
} from '@/lib/import/processingModeDetector';

export interface ProcessingModeSelectorProps {
  fileSize: number;
  mediaCount: number;
  fileName: string;
  onModeSelected: (mode: ProcessingMode) => void;
  onCancel: () => void;
}

export function ProcessingModeSelector({
  fileSize,
  mediaCount,
  fileName,
  onModeSelected,
  onCancel,
}: ProcessingModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>('client');
  const [rememberChoice, setRememberChoice] = useState(false);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [recommendedMode, setRecommendedMode] = useState<ProcessingMode>('client');

  useEffect(() => {
    const caps = getDeviceCapabilities();
    setCapabilities(caps);
    
    const recommendation = recommendProcessingMode(fileSize, mediaCount, caps);
    setRecommendedMode(recommendation);
    
    // Check for saved preference
    const savedMode = localStorage.getItem('whatsapp-import-processing-mode') as ProcessingMode | null;
    if (savedMode === 'client' || savedMode === 'server') {
      setSelectedMode(savedMode);
    } else {
      setSelectedMode(recommendation);
    }
  }, [fileSize, mediaCount]);

  const handleContinue = () => {
    if (rememberChoice) {
      localStorage.setItem('whatsapp-import-processing-mode', selectedMode);
    }
    onModeSelected(selectedMode);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Choose Processing Mode
        </CardTitle>
        <CardDescription>
          Select how you want to process this WhatsApp export
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File info */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatFileSize(fileSize)}
            </span>
            {mediaCount > 0 && (
              <span>~{mediaCount.toLocaleString()} media files</span>
            )}
          </div>
        </div>

        {/* Device capabilities (if available) */}
        {capabilities && (capabilities.memory || capabilities.connectionType) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {capabilities.memory && (
              <span className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {capabilities.memory}GB RAM
              </span>
            )}
            {capabilities.connectionType && (
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                {capabilities.connectionType.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Mode selection */}
        <RadioGroup 
          value={selectedMode} 
          onValueChange={(v) => setSelectedMode(v as ProcessingMode)}
          className="space-y-3"
        >
          {/* Client-side option */}
          <div className="relative">
            <div 
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedMode === 'client' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'}
              `}
              onClick={() => setSelectedMode('client')}
            >
              <RadioGroupItem value="client" id="mode-client" className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mode-client" className="font-medium cursor-pointer">
                    <Monitor className="h-4 w-4 inline mr-2" />
                    Client-Side Processing
                  </Label>
                  {recommendedMode === 'client' && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Process directly in your browser. Faster on devices with good hardware.
                  Uses your device's memory and processing power.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">
                    ✓ Faster for good devices
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ✓ No upload required
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ✓ Works offline
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Server-side option */}
          <div className="relative">
            <div 
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedMode === 'server' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'}
              `}
              onClick={() => setSelectedMode('server')}
            >
              <RadioGroupItem value="server" id="mode-server" className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mode-server" className="font-medium cursor-pointer">
                    <Cloud className="h-4 w-4 inline mr-2" />
                    Server-Side Processing
                  </Label>
                  {recommendedMode === 'server' && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload the ZIP file and let our servers process it. Better for low-memory 
                  devices or very large files.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">
                    ✓ Low memory usage
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ✓ Background processing
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ✓ Resume if interrupted
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Server-side note */}
        {selectedMode === 'server' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Server-side processing requires uploading the full ZIP file first 
              ({formatFileSize(fileSize)}). After upload, processing will continue in 
              the background even if you close this tab.
            </p>
          </div>
        )}

        {/* Remember choice */}
        <div className="flex items-center gap-2">
          <Checkbox 
            id="remember" 
            checked={rememberChoice}
            onCheckedChange={(checked) => setRememberChoice(checked === true)}
          />
          <Label htmlFor="remember" className="text-sm cursor-pointer">
            Remember my preference
          </Label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue with {selectedMode === 'client' ? 'Client' : 'Server'} Processing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
