/**
 * PriorityFeed - Algorithmic timeline showing what matters NOW
 * Real-time updates, grouped by urgency tier, one-tap actions
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Brain, 
  Zap,
  Check,
  X,
  Bell,
  Lightbulb
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  useUnifiedIntelligence, 
  IntelligenceItem,
  PriorityTier,
  IntelligenceItemType
} from '@/hooks/useUnifiedIntelligence';
import { formatDistanceToNow } from 'date-fns';

interface PriorityFeedProps {
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
  onItemClick?: (item: IntelligenceItem) => void;
}

const CATEGORY_ICONS: Record<IntelligenceItemType, typeof AlertTriangle> = {
  decay_alert: AlertTriangle,
  anomaly: Brain,
  proximity: Users,
  action_item: Check,
  recommendation: Lightbulb,
  media_analysis: Brain,
  voice_insight: Brain,
};

const CATEGORY_COLORS: Record<IntelligenceItemType, string> = {
  decay_alert: 'text-orange-500',
  anomaly: 'text-violet-500',
  proximity: 'text-blue-500',
  action_item: 'text-green-500',
  recommendation: 'text-amber-500',
  media_analysis: 'text-purple-500',
  voice_insight: 'text-emerald-500',
};

const PRIORITY_STYLES: Record<PriorityTier, { bg: string; border: string; badge: string }> = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500 text-white',
  },
  important: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500 text-white',
  },
  informational: {
    bg: 'bg-muted/50',
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground',
  },
};

function FeedItem({ 
  item, 
  onAction,
  onDismiss 
}: { 
  item: IntelligenceItem; 
  onAction: () => void;
  onDismiss: () => void;
}) {
  const Icon = CATEGORY_ICONS[item.type];
  const colorClass = CATEGORY_COLORS[item.type];
  const priorityStyle = PRIORITY_STYLES[item.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'group relative p-3 rounded-lg border transition-all',
        priorityStyle.bg,
        priorityStyle.border,
        'hover:shadow-md cursor-pointer'
      )}
      onClick={onAction}
    >
      <div className="flex items-start gap-3">
        {/* Avatar or Icon */}
        {item.profileName ? (
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {item.profileName?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn('p-2 rounded-lg bg-background', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            {item.priority === 'critical' && (
              <Badge className={priorityStyle.badge} variant="secondary">
                Urgent
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Icon className={cn('h-3 w-3', colorClass)} />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.actions && item.actions.length > 0 && (
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
            >
              {item.actions[0].label}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PrioritySection({ 
  priority, 
  items,
  onItemAction,
  onItemDismiss
}: { 
  priority: PriorityTier; 
  items: IntelligenceItem[];
  onItemAction: (item: IntelligenceItem) => void;
  onItemDismiss: (item: IntelligenceItem) => void;
}) {
  if (items.length === 0) return null;

  const labels: Record<PriorityTier, string> = {
    critical: 'Requires Immediate Attention',
    important: 'Important',
    informational: 'Informational',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className={cn(
          'h-2 w-2 rounded-full',
          priority === 'critical' && 'bg-red-500 animate-pulse',
          priority === 'important' && 'bg-orange-500',
          priority === 'informational' && 'bg-muted-foreground'
        )} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {labels[priority]}
        </span>
        <Badge variant="secondary" className="text-xs h-5">
          {items.length}
        </Badge>
      </div>
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <FeedItem
            key={item.id}
            item={item}
            onAction={() => onItemAction(item)}
            onDismiss={() => onItemDismiss(item)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function PriorityFeed({ 
  className, 
  showHeader = true,
  maxHeight = '600px',
  onItemClick 
}: PriorityFeedProps) {
  const navigate = useNavigate();
  const { items, criticalCount, importantCount, dismissItem } = useUnifiedIntelligence();

  // Group items by priority
  const groupedByPriority = useMemo(() => {
    return {
      critical: items.filter(i => i.priority === 'critical'),
      important: items.filter(i => i.priority === 'important'),
      informational: items.filter(i => i.priority === 'informational'),
    };
  }, [items]);

  const totalCount = items.length;

  const handleItemAction = (item: IntelligenceItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (item.profileId) {
      navigate(`/contacts/${item.profileId}`);
    }
  };

  const handleItemDismiss = (item: IntelligenceItem) => {
    dismissItem(item.id);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-1 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Priority Feed</h3>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} urgent
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            Mark all read
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="space-y-4 pr-4 py-3">
          {totalCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up!</p>
              <p className="text-xs">No priority items at the moment</p>
            </div>
          ) : (
            <>
              <PrioritySection
                priority="critical"
                items={groupedByPriority.critical}
                onItemAction={handleItemAction}
                onItemDismiss={handleItemDismiss}
              />
              <PrioritySection
                priority="important"
                items={groupedByPriority.important}
                onItemAction={handleItemAction}
                onItemDismiss={handleItemDismiss}
              />
              <PrioritySection
                priority="informational"
                items={groupedByPriority.informational}
                onItemAction={handleItemAction}
                onItemDismiss={handleItemDismiss}
              />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
