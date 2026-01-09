import { useState } from 'react';
import { EyeOff, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationItems, categoryConfig } from '@/lib/navigationConfig';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';

interface HiddenItemsManagerProps {
  hiddenItems: string[];
  onRestoreItem: (itemId: string) => void;
  onRestoreAll: () => void;
}

export function HiddenItemsManager({
  hiddenItems,
  onRestoreItem,
  onRestoreAll,
}: HiddenItemsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (hiddenItems.length === 0) return null;
  
  const items = hiddenItems
    .map(id => navigationItems.find(item => item.id === id))
    .filter(Boolean);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
            'bg-muted/30 hover:bg-muted/50 transition-colors',
            'text-xs text-muted-foreground hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <span className="flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5" />
            {hiddenItems.length} hidden item{hiddenItems.length > 1 ? 's' : ''}
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1"
          >
            {items.map((item) => {
              if (!item) return null;
              const config = categoryConfig[item.category];
              const Icon = item.icon;
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg',
                    'bg-muted/20 hover:bg-muted/40 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', config.textClass)} />
                    <span className="text-xs text-muted-foreground truncate">{item.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestoreItem(item.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Show
                  </Button>
                </motion.div>
              );
            })}
            
            {hiddenItems.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestoreAll}
                className="w-full h-7 text-xs mt-2"
              >
                <Eye className="h-3 w-3 mr-1" />
                Show all
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
