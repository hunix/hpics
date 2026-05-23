/**
 * Elicitation Session Recorder
 * Real-time conversation tracking with technique suggestions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useElicitationSession } from '@/hooks/intelligence/useElicitationSession';
import { FBI_ELICITATION_TECHNIQUES } from '@/lib/warfare/elicitationTechniques';
import { Mic, Play, CheckCircle, Plus, User, Target, Lightbulb, ClipboardCheck, Brain } from 'lucide-react';

interface ElicitationSessionRecorderProps {
  profileId?: string;
}

export function ElicitationSessionRecorder({ profileId }: ElicitationSessionRecorderProps) {
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createSession,
    addTranscriptEntry,
    extractInfo,
    completeSession,
    isCreating,
  } = useElicitationSession(profileId);

  const [newObjective, setNewObjective] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'target'>('target');
  const [extractedContent, setExtractedContent] = useState('');
  const [extractedTechnique, setExtractedTechnique] = useState('');

  const handleStartSession = () => {
    if (!newObjective.trim()) return;
    createSession({ objective: newObjective, techniques: selectedTechniques });
    setNewObjective('');
    setSelectedTechniques([]);
  };

  const handleAddEntry = () => {
    if (!activeSessionId || !currentInput.trim()) return;
    addTranscriptEntry({
      sessionId: activeSessionId,
      entry: { speaker: currentSpeaker, content: currentInput },
    });
    setCurrentInput('');
  };

  const handleExtractInfo = () => {
    if (!activeSessionId || !extractedContent.trim()) return;
    extractInfo({
      sessionId: activeSessionId,
      info: { content: extractedContent, confidence: 0.8, technique: extractedTechnique },
    });
    setExtractedContent('');
    setExtractedTechnique('');
  };

  const transcript = (activeSession?.conversation_transcript as any[]) || [];
  const extracted = (activeSession?.extracted_intelligence as any[]) || [];
  const objective = activeSession?.conversation_notes || '';
  const suggestedTechniques = FBI_ELICITATION_TECHNIQUES.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Elicitation Session Recorder</CardTitle>
        </div>
        <CardDescription>Real-time conversation tracking with FBI technique suggestions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeSessionId ? 'active' : 'new'}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">New Session</TabsTrigger>
            <TabsTrigger value="active" disabled={!activeSessionId}>Active Session</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Objective</label>
                <Input placeholder="What information are you trying to obtain?" value={newObjective} onChange={(e) => setNewObjective(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Techniques to Use</label>
                <div className="flex flex-wrap gap-2">
                  {FBI_ELICITATION_TECHNIQUES.slice(0, 8).map((technique) => (
                    <Badge key={technique.id} variant={selectedTechniques.includes(technique.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSelectedTechniques((prev) => prev.includes(technique.id) ? prev.filter((t) => t !== technique.id) : [...prev, technique.id])}>{technique.name}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleStartSession} disabled={!newObjective.trim() || !profileId || isCreating} className="w-full"><Play className="h-4 w-4 mr-2" />Start Session</Button>
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-4">
            {activeSession && (
              <>
                <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{objective}</p>
                    <p className="text-xs text-muted-foreground">{transcript.length} entries recorded</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => completeSession(activeSessionId!)}><CheckCircle className="h-4 w-4 mr-2" />Complete</Button>
                </div>

                <ScrollArea className="h-40 border rounded-lg p-2">
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No entries yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {transcript.map((entry: any, idx: number) => (
                        <div key={entry.id || idx} className={`flex gap-2 p-2 rounded ${entry.speaker === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                          {entry.speaker === 'user' ? <User className="h-4 w-4 mt-0.5" /> : <Target className="h-4 w-4 mt-0.5" />}
                          <div className="flex-1">
                            <p className="text-sm">{entry.content}</p>
                            <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Select value={currentSpeaker} onValueChange={(v) => setCurrentSpeaker(v as 'user' | 'target')}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">You</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Enter what was said..." value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()} />
                  <Button onClick={handleAddEntry}><Plus className="h-4 w-4" /></Button>
                </div>

                <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                  <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-yellow-500" /><span className="text-sm font-medium">Suggested Techniques</span></div>
                  <div className="space-y-2">
                    {suggestedTechniques.map((technique) => (
                      <div key={technique.id} className="text-sm"><strong>{technique.name}:</strong> <span className="text-muted-foreground">{technique.example}</span></div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /><label className="text-sm font-medium">Extract Information</label></div>
                  <Textarea placeholder="Information obtained..." value={extractedContent} onChange={(e) => setExtractedContent(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Select value={extractedTechnique} onValueChange={setExtractedTechnique}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Technique used" /></SelectTrigger>
                      <SelectContent>
                        {FBI_ELICITATION_TECHNIQUES.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleExtractInfo} disabled={!extractedContent.trim()}><Brain className="h-4 w-4 mr-2" />Extract</Button>
                  </div>
                </div>

                {extracted.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Extracted Intelligence</label>
                    {extracted.map((info: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-green-500/10 border border-green-500/30">
                        <p className="text-sm">{info.content}</p>
                        <Badge variant="outline" className="text-xs mt-1">{info.technique}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-64">
              {sessions?.filter(s => s.session_type === 'completed').length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No completed sessions.</p>
              ) : (
                <div className="space-y-2">
                  {sessions?.filter(s => s.session_type === 'completed').map((session) => (
                    <div key={session.id} className="p-3 rounded-lg border hover:bg-muted/30 cursor-pointer" onClick={() => setActiveSessionId(session.id)}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{session.conversation_notes || 'Session'}</span>
                        <Badge variant="secondary">{((session.extracted_intelligence as any[])?.length || 0)} extracted</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(session.created_at ?? Date.now()).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
