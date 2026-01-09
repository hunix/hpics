import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  type KeyboardShortcut, 
  getShortcutsByCategory, 
  formatShortcut 
} from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  navigation: { label: 'Navigation', color: 'bg-emerald-500/20 text-emerald-600' },
  actions: { label: 'Actions', color: 'bg-blue-500/20 text-blue-600' },
  dialogs: { label: 'Dialogs', color: 'bg-violet-500/20 text-violet-600' },
  editing: { label: 'Editing', color: 'bg-amber-500/20 text-amber-600' },
};

export function KeyboardShortcutsDialog({ 
  open, 
  onOpenChange, 
  shortcuts 
}: KeyboardShortcutsDialogProps) {
  const categorized = getShortcutsByCategory(shortcuts);
  
  // Add ? shortcut to open this dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onOpenChange(!open);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
              <Keyboard className="h-4 w-4 text-white" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(categorized).map(([category, items]) => {
              if (items.length === 0) return null;
              
              const config = categoryLabels[category];
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={cn('text-xs', config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {items.map((shortcut) => (
                      <div 
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border text-xs font-mono">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Built-in shortcuts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="text-xs bg-muted text-muted-foreground">
                  Global
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Open command palette</span>
                  <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border text-xs font-mono">
                    ⌘ + K
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Show keyboard shortcuts</span>
                  <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border text-xs font-mono">
                    ?
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Close dialog / Cancel</span>
                  <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border text-xs font-mono">
                    Escape
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">?</kbd> anywhere to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
