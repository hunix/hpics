import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Mic, 
  Play, 
  Pause, 
  Check, 
  X, 
  Loader2, 
  Brain, 
  Users, 
  MessageSquare,
  Fingerprint,
  FileAudio,
  Clock,
  RefreshCw,
  Cpu,
  Cloud,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceBulkAnalysis, VoiceRecording, VoiceBulkAnalysisOptions, ProcessingMode } from '@/hooks/useVoiceBulkAnalysis';
import { formatDistanceToNow } from 'date-fns';

interface VoiceBulkAnalysisPanelProps {
  profileId?: string;
  profileName?: string;
  onComplete?: () => void;
}

const ANALYSIS_OPTIONS = [
  { key: 'transcription', label: 'Transcription', icon: MessageSquare, description: 'Speech-to-text conversion' },
  { key: 'speakerDiarization', label: 'Speaker Diarization', icon: Users, description: 'Identify different speakers' },
  { key: 'vocalPsychology', label: 'Vocal Psychology', icon: Brain, description: 'Analyze emotional patterns' },
  { key: 'contentIntelligence', label: 'Content Intelligence', icon: FileAudio, description: 'Extract key insights' },
  { key: 'voiceBiometrics', label: 'Voice Biometrics', icon: Fingerprint, description: 'Voice signature analysis' },
] as const;

export function VoiceBulkAnalysisPanel({ profileId, profileName, onComplete }: VoiceBulkAnalysisPanelProps) {
  const {
    session,
    options,
    setOptions,
    recordings,
    isLoading,
    fetchRecordings,
    startBulkAnalysis,
    pauseAnalysis,
    resetSession,
    unanalyzedCount,
    processingMode,
    setProcessingMode,
    localModelStatus,
  } = useVoiceBulkAnalysis(profileId);

  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    if (session?.status === 'completed' && onComplete) {
      onComplete();
    }
  }, [session?.status, onComplete]);

  const toggleRecording = (id: string) => {
    setSelectedRecordings(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllUnanalyzed = () => {
    const unanalyzedIds = recordings.filter(r => !r.hasVoiceInsights).map(r => r.id);
    setSelectedRecordings(new Set(unanalyzedIds));
  };

  const clearSelection = () => {
    setSelectedRecordings(new Set());
  };

  const toggleOption = (key: keyof VoiceBulkAnalysisOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = () => {
    const selected = recordings.filter(r => selectedRecordings.has(r.id));
    startBulkAnalysis(selected, options);
  };

  const progress = session ? (session.processedItems / session.totalItems) * 100 : 0;
  const isRunning = session?.status === 'running';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-green-500" />
              Voice Recording Analysis
            </CardTitle>
            <CardDescription>
              {profileName ? `Analyze voice recordings for ${profileName}` : 'Bulk analyze voice recordings'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchRecordings()}
            disabled={isLoading || isRunning}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        {session && session.status !== 'idle' && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {session.status === 'running' ? 'Analyzing...' : 
                 session.status === 'completed' ? 'Completed' : 
                 session.status === 'paused' ? 'Paused' : 'Failed'}
              </span>
              <span className="text-sm text-muted-foreground">
                {session.processedItems} / {session.totalItems}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {session.failedItems > 0 && (
                  <span className="text-destructive">{session.failedItems} failed</span>
                )}
              </span>
              <div className="flex gap-2">
                {isRunning && (
                  <Button size="sm" variant="outline" onClick={pauseAnalysis}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {session.status === 'completed' && (
                  <Button size="sm" variant="outline" onClick={resetSession}>
                    Start New
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Processing Mode Selection */}
        {!isRunning && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Processing Mode</Label>
            <RadioGroup 
              value={processingMode} 
              onValueChange={(v) => setProcessingMode(v as ProcessingMode)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <div className={cn(
                "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                processingMode === 'local' ? "bg-green-500/10 border-green-500" : "hover:bg-muted/50"
              )}>
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Cpu className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">Local (Fast)</div>
                    <div className="text-xs text-muted-foreground">
                      WebGPU Whisper Turbo
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className={cn(
                "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                processingMode === 'cloud' ? "bg-blue-500/10 border-blue-500" : "hover:bg-muted/50"
              )}>
                <RadioGroupItem value="cloud" id="cloud" />
                <Label htmlFor="cloud" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Cloud (Full)</div>
                    <div className="text-xs text-muted-foreground">
                      ElevenLabs + Gemini AI
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className={cn(
                "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                processingMode === 'hybrid' ? "bg-yellow-500/10 border-yellow-500" : "hover:bg-muted/50"
              )}>
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="font-medium">Hybrid</div>
                    <div className="text-xs text-muted-foreground">
                      Local transcription + Cloud AI
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
            {processingMode === 'local' && (
              <div className="text-xs text-muted-foreground bg-green-500/10 p-2 rounded border border-green-500/20">
                <strong>First run:</strong> Downloads ~800MB Whisper model (cached after). Requires Chrome/Edge 113+ with WebGPU.
                {localModelStatus?.isReady && (
                  <span className="ml-2 text-green-600">✓ Model loaded</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analysis Options */}
        {!isRunning && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analysis Options</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ANALYSIS_OPTIONS.map(({ key, label, icon: Icon, description }) => (
                <div
                  key={key}
                  onClick={() => toggleOption(key)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    options[key] ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox checked={options[key]} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recordings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Voice Recordings ({recordings.length})
            </Label>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={selectAllUnanalyzed}
                disabled={isRunning || unanalyzedCount === 0}
              >
                Select Unanalyzed ({unanalyzedCount})
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearSelection}
                disabled={isRunning || selectedRecordings.size === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No voice recordings found</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {recordings.map(recording => {
                  const isSelected = selectedRecordings.has(recording.id);
                  const isCurrentlyProcessing = session?.currentItemId === recording.id;
                  
                  return (
                    <div
                      key={recording.id}
                      onClick={() => !isRunning && toggleRecording(recording.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isSelected && "bg-primary/10 border border-primary",
                        isCurrentlyProcessing && "bg-yellow-500/10 border border-yellow-500",
                        !isSelected && !isCurrentlyProcessing && "hover:bg-muted/50",
                        isRunning && "cursor-default"
                      )}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        disabled={isRunning}
                        className="shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {recording.title || 'Untitled Recording'}
                          </span>
                          {recording.hasVoiceInsights && (
                            <Badge variant="secondary" className="shrink-0">
                              <Check className="h-3 w-3 mr-1" />
                              Analyzed
                            </Badge>
                          )}
                          {isCurrentlyProcessing && (
                            <Badge className="shrink-0 bg-yellow-500">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Processing
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recording.duration_seconds 
                              ? `${Math.floor(recording.duration_seconds / 60)}:${String(recording.duration_seconds % 60).padStart(2, '0')}`
                              : 'Unknown duration'
                            }
                          </span>
                          <span>{formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {recording.recording_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Start Button */}
        {!isRunning && session?.status !== 'completed' && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={selectedRecordings.size === 0 || isLoading}
          >
            <Play className="h-4 w-4 mr-2" />
            Analyze {selectedRecordings.size} Recording{selectedRecordings.size !== 1 ? 's' : ''}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
