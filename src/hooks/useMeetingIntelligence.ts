/**
 * Meeting Intelligence Hook
 * Auto-record, transcribe, and analyze meetings with contact correlation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSpeechRecognition } from './useSpeechRecognition';
import { toast } from 'sonner';

interface MeetingParticipant {
  id: string;
  speakerLabel: string;
  profileId?: string;
  profileName?: string;
  speakingTime: number;
  wordCount: number;
  questionCount: number;
  sentimentAverage: number;
}

interface MeetingInsight {
  type: 'action_item' | 'decision' | 'question' | 'commitment' | 'concern';
  text: string;
  speaker?: string;
  profileId?: string;
  timestamp: number;
  importance: 'high' | 'medium' | 'low';
}

interface Meeting {
  id: string;
  title: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  participants: MeetingParticipant[];
  insights: MeetingInsight[];
  transcript: string;
  summary?: string;
  linkedCalendarEventId?: string;
  status: 'active' | 'completed' | 'processing' | 'analyzed';
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}

interface UseMeetingIntelligenceOptions {
  autoStartOnCalendar?: boolean;
  generateSummary?: boolean;
  extractInsights?: boolean;
  notifyOnActionItems?: boolean;
}

interface UseMeetingIntelligenceReturn {
  currentMeeting: Meeting | null;
  isRecording: boolean;
  isAnalyzing: boolean;
  upcomingEvents: CalendarEvent[];
  pastMeetings: Meeting[];
  startMeeting: (title?: string, calendarEventId?: string) => Promise<string | null>;
  endMeeting: () => Promise<Meeting | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  addManualNote: (note: string) => void;
  assignParticipant: (speakerLabel: string, profileId: string) => void;
  getMeetingInsights: (meetingId: string) => Promise<MeetingInsight[]>;
  generateFollowUp: (meetingId: string) => Promise<string | null>;
}

export function useMeetingIntelligence(
  options: UseMeetingIntelligenceOptions = {}
): UseMeetingIntelligenceReturn {
  const { user } = useAuth();
  const {
    autoStartOnCalendar = false,
    generateSummary = true,
    extractInsights = true,
    notifyOnActionItems = true
  } = options;

  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);

  const meetingIdRef = useRef<string>('');
  const participantsRef = useRef<Map<string, MeetingParticipant>>(new Map());
  const insightsRef = useRef<MeetingInsight[]>([]);
  const manualNotesRef = useRef<string[]>([]);

  // Use speech recognition hook
  const {
    isListening,
    transcript,
    segments,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    saveSession,
    identifySpeakers
  } = useSpeechRecognition({
    continuous: true,
    onResult: (segment) => {
      // Update participant stats
      const speakerLabel = segment.speakerLabel || 'unknown';
      const existing = participantsRef.current.get(speakerLabel) || {
        id: speakerLabel,
        speakerLabel,
        speakingTime: 0,
        wordCount: 0,
        questionCount: 0,
        sentimentAverage: 0.5
      };

      existing.wordCount += segment.text.split(/\s+/).length;
      existing.speakingTime += (segment.endTime || segment.startTime) - segment.startTime;
      if (segment.isQuestion) existing.questionCount++;
      
      // Rolling average for sentiment
      const sentimentScore = segment.sentiment === 'positive' ? 0.8 :
                            segment.sentiment === 'negative' ? 0.2 : 0.5;
      existing.sentimentAverage = (existing.sentimentAverage * 0.8) + (sentimentScore * 0.2);

      participantsRef.current.set(speakerLabel, existing);

      // Extract real-time insights
      if (extractInsights) {
        extractInsightFromSegment(segment);
      }
    }
  });

  // Extract insights from transcript segment
  const extractInsightFromSegment = useCallback((segment: any) => {
    const text = segment.text.toLowerCase();

    // Action item patterns
    if (text.includes('will do') || text.includes('i\'ll') || text.includes('action item') ||
        text.includes('todo') || text.includes('need to') || text.includes('have to')) {
      insightsRef.current.push({
        type: 'action_item',
        text: segment.text,
        speaker: segment.speakerLabel,
        profileId: segment.matchedProfileId,
        timestamp: segment.startTime,
        importance: text.includes('urgent') || text.includes('asap') ? 'high' : 'medium'
      });
    }

    // Decision patterns
    if (text.includes('we decided') || text.includes('let\'s go with') || 
        text.includes('we\'re going to') || text.includes('agreed')) {
      insightsRef.current.push({
        type: 'decision',
        text: segment.text,
        speaker: segment.speakerLabel,
        profileId: segment.matchedProfileId,
        timestamp: segment.startTime,
        importance: 'high'
      });
    }

    // Commitment patterns
    if (text.includes('i promise') || text.includes('i commit') || 
        text.includes('you have my word') || text.includes('guaranteed')) {
      insightsRef.current.push({
        type: 'commitment',
        text: segment.text,
        speaker: segment.speakerLabel,
        profileId: segment.matchedProfileId,
        timestamp: segment.startTime,
        importance: 'high'
      });
    }

    // Concern patterns
    if (text.includes('worried') || text.includes('concern') || 
        text.includes('problem') || text.includes('issue') || text.includes('risk')) {
      insightsRef.current.push({
        type: 'concern',
        text: segment.text,
        speaker: segment.speakerLabel,
        profileId: segment.matchedProfileId,
        timestamp: segment.startTime,
        importance: 'medium'
      });
    }
  }, []);

  // Start a new meeting
  const startMeeting = useCallback(async (
    title?: string,
    calendarEventId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    const meetingId = crypto.randomUUID();
    meetingIdRef.current = meetingId;
    participantsRef.current.clear();
    insightsRef.current = [];
    manualNotesRef.current = [];

    const meeting: Meeting = {
      id: meetingId,
      title: title || `Meeting ${new Date().toLocaleDateString()}`,
      startedAt: new Date(),
      participants: [],
      insights: [],
      transcript: '',
      linkedCalendarEventId: calendarEventId,
      status: 'active'
    };

    setCurrentMeeting(meeting);
    setIsRecording(true);

    // Start speech recognition
    const started = await startListening();
    if (!started) {
      toast.error('Failed to start recording');
      return null;
    }

    // Save meeting to database
    await supabase.from('meeting_recordings').insert({
      id: meetingId,
      user_id: user.id,
      title: meeting.title,
      status: 'recording',
      calendar_event_id: calendarEventId,
      started_at: meeting.startedAt.toISOString()
    });

    toast.success('Meeting recording started');
    return meetingId;
  }, [user, startListening]);

  // End the current meeting
  const endMeeting = useCallback(async (): Promise<Meeting | null> => {
    if (!currentMeeting || !user) return null;

    stopListening();
    setIsRecording(false);
    setIsAnalyzing(true);

    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - currentMeeting.startedAt.getTime()) / 1000);

    // Save transcription
    await saveSession();

    // Identify speakers
    await identifySpeakers();

    // Compile final meeting data
    const finalMeeting: Meeting = {
      ...currentMeeting,
      endedAt,
      duration,
      participants: Array.from(participantsRef.current.values()),
      insights: insightsRef.current,
      transcript: transcript,
      status: 'processing'
    };

    setCurrentMeeting(finalMeeting);

    try {
      // Generate AI summary if enabled
      let summary: string | undefined;
      if (generateSummary && transcript.length > 100) {
        const { data } = await supabase.functions.invoke('analyze-meeting', {
          body: {
            meetingId: currentMeeting.id,
            transcript,
            participants: finalMeeting.participants,
            insights: finalMeeting.insights,
            generateSummary: true
          }
        });

        if (data?.summary) {
          summary = data.summary;
          finalMeeting.summary = summary;
        }

        // Add AI-detected insights
        if (data?.additionalInsights) {
          finalMeeting.insights = [...finalMeeting.insights, ...data.additionalInsights];
        }
      }

      // Update database
      await supabase.from('meeting_recordings').update({
        status: 'completed',
        ended_at: endedAt.toISOString(),
        duration_seconds: duration,
        transcript,
        summary,
        participants: finalMeeting.participants,
        insights: finalMeeting.insights
      }).eq('id', currentMeeting.id);

      finalMeeting.status = 'analyzed';
      setCurrentMeeting(finalMeeting);

      // Notify on action items
      if (notifyOnActionItems) {
        const actionItems = finalMeeting.insights.filter(i => i.type === 'action_item');
        if (actionItems.length > 0) {
          toast.info(`${actionItems.length} action items detected`, {
            description: 'Review in meeting summary'
          });
        }
      }

      toast.success('Meeting analysis complete');
      return finalMeeting;
    } catch (error) {
      console.error('Error analyzing meeting:', error);
      finalMeeting.status = 'completed';
      setCurrentMeeting(finalMeeting);
      return finalMeeting;
    } finally {
      setIsAnalyzing(false);
      setPastMeetings(prev => [finalMeeting, ...prev]);
    }
  }, [
    currentMeeting, user, transcript, stopListening, saveSession, 
    identifySpeakers, generateSummary, notifyOnActionItems
  ]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    pauseListening();
    setIsRecording(false);
  }, [pauseListening]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    resumeListening();
    setIsRecording(true);
  }, [resumeListening]);

  // Add manual note
  const addManualNote = useCallback((note: string) => {
    manualNotesRef.current.push(note);
    
    // Also add as insight
    insightsRef.current.push({
      type: 'action_item',
      text: note,
      timestamp: Date.now() - (currentMeeting?.startedAt.getTime() || 0),
      importance: 'medium'
    });
  }, [currentMeeting]);

  // Assign speaker to profile
  const assignParticipant = useCallback((speakerLabel: string, profileId: string) => {
    const participant = participantsRef.current.get(speakerLabel);
    if (participant) {
      participant.profileId = profileId;
      participantsRef.current.set(speakerLabel, participant);
    }
  }, []);

  // Get meeting insights
  const getMeetingInsights = useCallback(async (meetingId: string): Promise<MeetingInsight[]> => {
    const { data } = await supabase
      .from('meeting_recordings')
      .select('insights')
      .eq('id', meetingId)
      .single();

    return (data?.insights as MeetingInsight[]) || [];
  }, []);

  // Generate follow-up message
  const generateFollowUp = useCallback(async (meetingId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('generate-meeting-followup', {
        body: { meetingId, userId: user.id }
      });

      if (error) throw error;
      return data?.followUpMessage || null;
    } catch (error) {
      console.error('Error generating follow-up:', error);
      return null;
    }
  }, [user]);

  // Load past meetings
  useEffect(() => {
    if (!user) return;

    const loadMeetings = async () => {
      const { data } = await supabase
        .from('meeting_recordings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(20);

      if (data) {
        setPastMeetings(data.map((m: any) => ({
          id: m.id,
          title: m.title,
          startedAt: new Date(m.started_at),
          endedAt: m.ended_at ? new Date(m.ended_at) : undefined,
          duration: m.duration_seconds,
          participants: m.participants || [],
          insights: m.insights || [],
          transcript: m.transcript || '',
          summary: m.summary,
          status: 'analyzed'
        })));
      }
    };

    loadMeetings();
  }, [user]);

  return {
    currentMeeting,
    isRecording,
    isAnalyzing,
    upcomingEvents,
    pastMeetings,
    startMeeting,
    endMeeting,
    pauseRecording,
    resumeRecording,
    addManualNote,
    assignParticipant,
    getMeetingInsights,
    generateFollowUp
  };
}
