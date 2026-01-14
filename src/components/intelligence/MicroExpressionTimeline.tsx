import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Eye, AlertTriangle, Clock, TrendingUp, 
  Smile, Frown, Meh, Angry, Heart
} from 'lucide-react';
import {
  type MicroExpressionEvent,
  type EmotionBaseline,
  type DeceptionIndicator,
  buildEmotionBaseline,
  detectBaselineDeviations,
  generateMicroExpressionReport
} from '@/lib/psychology/microExpressionAnalyzer';

interface MicroExpressionTimelineProps {
  events: MicroExpressionEvent[];
  videoDuration?: number;
  onEventSelect?: (event: MicroExpressionEvent) => void;
  onSeek?: (timestamp: number) => void;
}

const emotionIcons: Record<string, React.ReactNode> = {
  happiness: <Smile className="h-4 w-4 text-green-500" />,
  sadness: <Frown className="h-4 w-4 text-blue-500" />,
  anger: <Angry className="h-4 w-4 text-red-500" />,
  fear: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  surprise: <Eye className="h-4 w-4 text-purple-500" />,
  disgust: <Meh className="h-4 w-4 text-orange-500" />,
  contempt: <Meh className="h-4 w-4 text-gray-500" />,
  neutral: <Meh className="h-4 w-4 text-muted-foreground" />
};

const emotionColors: Record<string, string> = {
  happiness: 'bg-green-500',
  sadness: 'bg-blue-500',
  anger: 'bg-red-500',
  fear: 'bg-yellow-500',
  surprise: 'bg-purple-500',
  disgust: 'bg-orange-500',
  contempt: 'bg-gray-500',
  neutral: 'bg-muted'
};

export function MicroExpressionTimeline({ 
  events, 
  videoDuration = 60000,
  onEventSelect,
  onSeek 
}: MicroExpressionTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<MicroExpressionEvent | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [filter, setFilter] = useState<'all' | 'deception' | 'high-confidence'>('all');

  const analysis = useMemo(() => {
    if (events.length === 0) return null;
    
    const baseline = buildEmotionBaseline(events);
    const deviations = detectBaselineDeviations(events, baseline);
    const report = generateMicroExpressionReport(events, baseline);
    
    return { baseline, deviations, report };
  }, [events]);

  const filteredEvents = useMemo(() => {
    switch (filter) {
      case 'deception':
        return events.filter(e => e.deceptionIndicators && e.deceptionIndicators.length > 0);
      case 'high-confidence':
        return events.filter(e => e.confidence >= 0.8);
      default:
        return events;
    }
  }, [events, filter]);

  const handleEventClick = (event: MicroExpressionEvent) => {
    setSelectedEvent(event);
    onEventSelect?.(event);
    onSeek?.(event.timestamp);
    setCurrentTime(event.timestamp);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Micro-Expression Timeline
            </CardTitle>
            <CardDescription>
              FACS-based facial expression analysis with deception detection
            </CardDescription>
          </div>
          <Badge variant="outline">
            {events.length} expressions detected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({events.length})
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'deception' ? 'default' : 'outline'}
            onClick={() => setFilter('deception')}
          >
            Deception Indicators
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'high-confidence' ? 'default' : 'outline'}
            onClick={() => setFilter('high-confidence')}
          >
            High Confidence
          </Button>
        </div>

        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            onValueChange={([v]) => {
              setCurrentTime(v);
              onSeek?.(v);
            }}
            max={videoDuration}
            step={100}
            className="w-full"
          />
          
          {/* Event Markers on Timeline */}
          <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
            {filteredEvents.map((event, idx) => {
              const position = (event.timestamp / videoDuration) * 100;
              const hasDeception = event.deceptionIndicators && event.deceptionIndicators.length > 0;
              return (
                <button
                  key={idx}
                  className={`absolute top-1 w-3 h-4 rounded-sm cursor-pointer transition-all hover:scale-125 ${
                    hasDeception ? 'bg-red-500' : emotionColors[event.emotion] || 'bg-primary'
                  } ${selectedEvent === event ? 'ring-2 ring-primary' : ''}`}
                  style={{ left: `calc(${position}% - 6px)` }}
                  onClick={() => handleEventClick(event)}
                  title={`${event.emotion} at ${formatTime(event.timestamp)}`}
                />
              );
            })}
          </div>
        </div>

        {/* Baseline Summary */}
        {analysis && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Baseline Analysis</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(analysis.baseline.dominantEmotions)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([emotion, percentage]) => (
                    <div key={emotion} className="text-center">
                      {emotionIcons[emotion]}
                      <p className="text-xs text-muted-foreground capitalize mt-1">{emotion}</p>
                      <p className="font-mono text-sm">{(percentage * 100).toFixed(0)}%</p>
                    </div>
                  ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span>Avg Expression Duration: <strong>{analysis.baseline.averageExpressionDuration.toFixed(0)}ms</strong></span>
                <span>Transition Frequency: <strong>{analysis.baseline.transitionFrequency.toFixed(2)}/s</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {filteredEvents.map((event, idx) => (
              <button
                key={idx}
                className={`w-full text-left p-3 border rounded-lg transition-colors hover:bg-muted/50 ${
                  selectedEvent === event ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {emotionIcons[event.emotion]}
                    <div>
                      <p className="font-medium capitalize">{event.emotion}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.timestamp)} • {event.duration}ms
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {(event.confidence * 100).toFixed(0)}%
                    </Badge>
                    {event.deceptionIndicators && event.deceptionIndicators.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {event.deceptionIndicators.length} flags
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Deception Indicators */}
                {event.deceptionIndicators && event.deceptionIndicators.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.deceptionIndicators.map((indicator, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {indicator.type}: {indicator.description}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Units */}
                {event.actionUnits && event.actionUnits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.actionUnits.slice(0, 5).map((au, i) => (
                      <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        AU{au.id} ({(au.intensity * 100).toFixed(0)}%)
                      </span>
                    ))}
                    {event.actionUnits.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{event.actionUnits.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Analysis Report Summary */}
        {analysis?.report && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Total Deception Indicators</p>
                  <p className="font-bold text-lg">{analysis.report.totalDeceptionIndicators}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Baseline Deviations</p>
                  <p className="font-bold text-lg">{analysis.report.baselineDeviations}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Overall Assessment</p>
                <p className="font-medium">{analysis.report.overallAssessment}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
