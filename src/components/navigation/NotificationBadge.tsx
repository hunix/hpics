import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) return null;
  
  const displayCount = count > 99 ? '99+' : count;
  
  return (
    <AnimatePresence>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={cn(
          'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
          'text-[10px] font-bold rounded-full',
          'bg-red-500 text-white',
          className
        )}
      >
        {displayCount}
      </motion.span>
    </AnimatePresence>
  );
}
