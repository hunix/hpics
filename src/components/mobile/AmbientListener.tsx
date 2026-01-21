/**
 * AmbientListener - Continuous background speech capture UI
 * Wake-word detection, speaker ID, keyword spotting
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Users, Settings, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AmbientListenerProps {
  className?: string;
  onTranscript?: (text: string, speakerId?: string) => void;
}

export function AmbientListener({ className, onTranscript }: AmbientListenerProps) {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [speakerIdEnabled, setSpeakerIdEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  
  // Ref to track interval for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleListening = useCallback(() => {
    setIsListening(prev => {
      const newState = !prev;
      if (newState) {
        // Start simulating audio level changes
        intervalRef.current = setInterval(() => {
          setAudioLevel(Math.random() * 100);
        }, 100);
      } else {
        // Stop interval when listening stops
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setAudioLevel(0);
      }
      return newState;
    });
  }, []);

  // Cleanup interval on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            Ambient Listener
          </CardTitle>
          <Badge variant={isListening ? 'default' : 'secondary'}>
            {isListening ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isListening ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "p-3 rounded-full",
                isListening ? "bg-red-500/20" : "bg-muted"
              )}
            >
              {isListening ? (
                <Mic className="h-6 w-6 text-red-400" />
              ) : (
                <MicOff className="h-6 w-6 text-muted-foreground" />
              )}
            </motion.div>
            <div>
              <p className="font-medium">
                {isListening ? 'Listening...' : 'Tap to start'}
              </p>
              <p className="text-xs text-muted-foreground">
                {wakeWordEnabled ? 'Wake: "Hey Intel"' : 'Always on'}
              </p>
            </div>
          </div>
          <Button
            variant={isListening ? 'destructive' : 'default'}
            size="sm"
            onClick={toggleListening}
          >
            {isListening ? 'Stop' : 'Start'}
          </Button>
        </div>

        {/* Audio Level */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Audio Level</span>
              </div>
              <Progress value={audioLevel} className="h-1" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wake Word Detection</span>
            </div>
            <Switch
              checked={wakeWordEnabled}
              onCheckedChange={setWakeWordEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Speaker Identification</span>
            </div>
            <Switch
              checked={speakerIdEnabled}
              onCheckedChange={setSpeakerIdEnabled}
            />
          </div>
        </div>

        {/* Last Transcript */}
        {lastTranscript && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Last heard:</p>
            <p className="text-sm">{lastTranscript}</p>
          </div>
        )}

        {/* Detected Keywords */}
        {detectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {detectedKeywords.map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
