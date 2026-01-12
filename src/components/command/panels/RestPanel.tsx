import React from 'react';
import { Moon, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RestPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 text-center">
        <div className="p-4 rounded-full bg-violet-500/10 inline-flex">
          <Moon className="h-8 w-8 text-violet-500" />
        </div>
        <p className="text-sm font-medium">Rest Mode</p>
        <p className="text-xs text-muted-foreground">Relationship health summary</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 text-pink-500" />
          <span>All relationships healthy</span>
        </div>
      </div>
    </ScrollArea>
  );
}
