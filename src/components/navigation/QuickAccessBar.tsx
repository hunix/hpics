import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navigationItems, categoryConfig } from '@/lib/navigationConfig';
import { X, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAccessBarProps {
  pinnedItems: string[];
  onUnpin: (itemId: string) => void;
}

export function QuickAccessBar({ pinnedItems, onUnpin }: QuickAccessBarProps) {
  const location = useLocation();
  
  if (pinnedItems.length === 0) return null;
  
  const items = pinnedItems
    .map(id => navigationItems.find(item => item.id === id))
    .filter(Boolean);
  
  return (
    <div className="px-3 py-2 border-b border-border/50">
      <div className="flex items-center gap-1 mb-2">
        <Star className="h-3 w-3 text-amber-500" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Access
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            if (!item) return null;
            const isActive = location.pathname === item.url;
            const config = categoryConfig[item.category];
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.url}
                      className={cn(
                        'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                        'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'group',
                        isActive ? [
                          `bg-gradient-to-br ${config.gradient}`,
                          'shadow-md',
                        ] : [
                          'bg-muted/70 hover:bg-muted',
                        ]
                      )}
                    >
                      <Icon className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-white' : config.textClass
                      )} />
                      
                      {/* Unpin button on hover */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onUnpin(item.id);
                        }}
                        className={cn(
                          'absolute -top-1 -right-1 w-4 h-4 rounded-full',
                          'bg-destructive text-destructive-foreground',
                          'flex items-center justify-center',
                          'opacity-0 group-hover:opacity-100 transition-opacity',
                          'hover:scale-110'
                        )}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
