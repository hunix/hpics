import React from 'react';
import { Briefcase, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WorkPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 text-center">
        <div className="p-4 rounded-full bg-amber-500/10 inline-flex">
          <Briefcase className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-sm font-medium">Work Mode</p>
        <p className="text-xs text-muted-foreground">Focus on tasks and follow-ups</p>
        <Button variant="outline" className="gap-2"><CheckSquare className="h-4 w-4" />View Tasks</Button>
      </div>
    </ScrollArea>
  );
}
