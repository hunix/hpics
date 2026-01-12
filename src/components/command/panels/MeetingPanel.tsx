import React from 'react';
import { Mic, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MeetingPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 text-center">
        <div className="p-4 rounded-full bg-muted inline-flex">
          <Mic className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Meeting Intelligence</p>
        <p className="text-xs text-muted-foreground">Start recording to capture transcripts and insights</p>
        <Button className="gap-2"><Mic className="h-4 w-4" />Start Recording</Button>
      </div>
    </ScrollArea>
  );
}
