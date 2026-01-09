import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryConfig, type NavCategory } from '@/lib/navigationConfig';
import { motion, AnimatePresence } from 'framer-motion';

interface NavGroupHeaderProps {
  category: NavCategory;
  isCollapsed: boolean;
  onToggle: () => void;
  itemCount: number;
  layoutMode: 'compact' | 'comfortable' | 'spacious';
}

export function NavGroupHeader({
  category,
  isCollapsed,
  onToggle,
  itemCount,
  layoutMode,
}: NavGroupHeaderProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  const paddingClass = {
    compact: 'py-1 px-2',
    comfortable: 'py-1.5 px-3',
    spacious: 'py-2 px-4',
  }[layoutMode];
  
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between gap-2 rounded-lg transition-all duration-200',
        'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'group cursor-pointer select-none',
        paddingClass,
        config.bgClass
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex items-center justify-center w-6 h-6 rounded-md',
          `bg-gradient-to-br ${config.gradient}`,
          'shadow-sm'
        )}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className={cn(
          'text-xs font-semibold uppercase tracking-wider',
          config.textClass
        )}>
          {config.title}
        </span>
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full',
          'bg-muted text-muted-foreground font-medium'
        )}>
          {itemCount}
        </span>
      </div>
      
      <motion.div
        initial={false}
        animate={{ rotate: isCollapsed ? 0 : 90 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className={cn(
          'h-4 w-4 text-muted-foreground transition-colors',
          'group-hover:text-foreground'
        )} />
      </motion.div>
    </button>
  );
}
