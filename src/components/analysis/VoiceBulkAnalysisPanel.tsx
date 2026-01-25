import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Mic, 
  Play, 
  Pause, 
  Check, 
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
  Zap,
  Smartphone,
  AudioLines
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceBulkAnalysis, VoiceRecording, VoiceBulkAnalysisOptions, ProcessingMode } from '@/hooks/useVoiceBulkAnalysis';
import { formatDistanceToNow } from 'date-fns';

// Helper to get source badge info
function getSourceBadge(recording: VoiceRecording): { label: string; icon: React.ReactNode; className: string } {
  if (recording.source === 'voice_recording_sessions') {
    return { label: 'Recording', icon: <Mic className="h-3 w-3" />, className: 'bg-green-500/20 text-green-600 border-green-500/30' };
  }
  // Media source - detect type by recording_type or mime hint
  if (recording.recording_type === 'voice_note') {
    return { label: 'WhatsApp', icon: <Smartphone className="h-3 w-3" />, className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' };
  }
  return { label: 'Audio', icon: <AudioLines className="h-3 w-3" />, className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' };
}

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
  
  // Virtual list container ref
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Memoize recordings for stable virtualizer
  const sortedRecordings = useMemo(() => recordings, [recordings]);
  
  // Virtual list for performance with 800+ items
  const virtualizer = useVirtualizer({
    count: sortedRecordings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Approximate row height
    overscan: 10,
  });

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
            {/* Model Loading Phase */}
            {session.phase === 'model_loading' && session.modelStatus === 'loading' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    Loading Whisper Model... {Math.round(session.modelProgress || 0)}%
                  </span>
                </div>
                <Progress value={session.modelProgress || 0} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  First run downloads ~800MB model (cached after)
                </p>
              </div>
            )}
            
            {/* Processing Phase */}
            {session.phase === 'processing' && session.status === 'running' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="font-medium">
                      Processing: <span className="text-blue-600 dark:text-blue-400">{session.currentFileName || 'Audio file'}</span>
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {session.processedItems} / {session.totalItems}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {/* Completed Phase */}
            {session.status === 'completed' && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  Completed - {session.processedItems} files processed
                </span>
              </div>
            )}
            
            {/* Paused State */}
            {session.status === 'paused' && (
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  Paused at {session.processedItems} / {session.totalItems}
                </span>
              </div>
            )}
            
            {/* Failed items indicator and controls */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {session.failedItems > 0 && (
                  <span className="text-destructive">{session.failedItems} failed</span>
                )}
              </span>
              <div className="flex gap-2">
                {isRunning && session.phase === 'processing' && (
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
            <div 
              ref={parentRef}
              className="h-[400px] border rounded-lg overflow-auto"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map(virtualRow => {
                  const recording = sortedRecordings[virtualRow.index];
                  const isSelected = selectedRecordings.has(recording.id);
                  const isCurrentlyProcessing = session?.currentItemId === recording.id;
                  const sourceBadge = getSourceBadge(recording);
                  
                  return (
                    <div
                      key={recording.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="px-2 py-1"
                    >
                      <div
                        onClick={() => !isRunning && toggleRecording(recording.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors h-full",
                          isSelected && "bg-primary/10 border border-primary",
                          isCurrentlyProcessing && "bg-yellow-500/10 border border-yellow-500",
                          !isSelected && !isCurrentlyProcessing && "hover:bg-muted/50 border border-transparent",
                          isRunning && "cursor-default"
                        )}
                      >
                        <Checkbox 
                          checked={isSelected} 
                          disabled={isRunning}
                          className="shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate max-w-[200px]">
                              {recording.title || 'Untitled Recording'}
                            </span>
                            
                            {/* Source badge */}
                            <Badge variant="outline" className={cn("shrink-0 text-[10px] gap-1", sourceBadge.className)}>
                              {sourceBadge.icon}
                              {sourceBadge.label}
                            </Badge>
                            
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
                                ? `${Math.floor(recording.duration_seconds / 60)}:${String(Math.round(recording.duration_seconds) % 60).padStart(2, '0')}`
                                : '—'
                              }
                            </span>
                            <span>{formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
