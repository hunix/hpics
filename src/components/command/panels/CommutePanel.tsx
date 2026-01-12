import React from 'react';
import { Car, Phone, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CommutePanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 text-center">
        <div className="p-4 rounded-full bg-blue-500/10 inline-flex">
          <Car className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-sm font-medium">Commute Mode</p>
        <p className="text-xs text-muted-foreground">Voice notes and calls optimized for travel</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm"><Mic className="h-4 w-4 mr-1" />Voice Note</Button>
          <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" />Call Queue</Button>
        </div>
      </div>
    </ScrollArea>
  );
}
