/**
 * MeetingPanel - Context panel for meeting mode
 * Shows: recording controls, participants, transcription, action items
 */

import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  Users, 
  FileText, 
  CheckSquare,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMeetingIntelligence } from '@/hooks/useMeetingIntelligence';

export default function MeetingPanel() {
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    currentTranscript,
    detectedParticipants 
  } = useMeetingIntelligence();

  return (
    <div className="p-4 space-y-4">
      {/* Recording Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted'}`}>
                {isRecording ? (
                  <Mic className="h-5 w-5 text-white" />
                ) : (
                  <MicOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {isRecording ? 'Recording Active' : 'Ready to Record'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRecording ? 'Capturing audio and transcribing...' : 'Start to capture meeting'}
                </p>
              </div>
            </div>
            <Button
              variant={isRecording ? 'destructive' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? 'Stop' : 'Start Recording'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detected Participants */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Participants</span>
          <Badge variant="secondary">{detectedParticipants?.length || 0}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {detectedParticipants?.slice(0, 5).map((participant: any, idx: number) => (
            <div 
              key={idx}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={participant.avatar} />
                <AvatarFallback className="text-xs">
                  {participant.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{participant.name || 'Unknown'}</span>
            </div>
          ))}
          {!detectedParticipants?.length && (
            <p className="text-sm text-muted-foreground">No participants detected yet</p>
          )}
        </div>
      </div>

      {/* Live Transcription */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Live Transcription</span>
        </div>
        <ScrollArea className="h-32 rounded-lg border bg-muted/30 p-3">
          {currentTranscript ? (
            <p className="text-sm">{currentTranscript}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {isRecording ? 'Listening...' : 'Start recording to see transcription'}
            </p>
          )}
        </ScrollArea>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="justify-start">
          <CheckSquare className="h-4 w-4 mr-2" />
          Add Action Item
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <AlertCircle className="h-4 w-4 mr-2" />
          Flag Important
        </Button>
      </div>
    </div>
  );
}
