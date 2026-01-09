import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { type NavItem, categoryConfig } from '@/lib/navigationConfig';
import { Pin, EyeOff, MoreHorizontal } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface NavItemEnhancedProps {
  item: NavItem;
  isPinned: boolean;
  onTogglePin: () => void;
  onToggleHide: () => void;
  showDescription: boolean;
  layoutMode: 'compact' | 'comfortable' | 'spacious';
  showBadges: boolean;
}

export function NavItemEnhanced({
  item,
  isPinned,
  onTogglePin,
  onToggleHide,
  showDescription,
  layoutMode,
  showBadges,
}: NavItemEnhancedProps) {
  const location = useLocation();
  const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
  const config = categoryConfig[item.category];
  const Icon = item.icon;
  
  const paddingClass = {
    compact: 'py-1 px-2',
    comfortable: 'py-1.5 px-2.5',
    spacious: 'py-2 px-3',
  }[layoutMode];
  
  const content = (
    <Link
      to={item.url}
      className={cn(
        'flex items-center gap-2.5 rounded-lg transition-all duration-200 w-full group relative',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        paddingClass,
        isActive && [
          'bg-accent',
          config.borderClass,
          'border-l-2',
          'shadow-sm',
        ]
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200',
        isActive ? [
          `bg-gradient-to-br ${config.gradient}`,
          'shadow-md',
        ] : [
          'bg-muted/50 group-hover:bg-muted',
        ]
      )}>
        <Icon className={cn(
          'h-4 w-4 transition-colors duration-200',
          isActive ? 'text-white' : `${config.textClass} group-hover:scale-110`
        )} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium truncate transition-colors',
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
          )}>
            {item.title}
          </span>
          
          {/* Badges */}
          {showBadges && item.badge && (
            <Badge 
              variant={item.badge === 'new' ? 'default' : 'secondary'}
              className={cn(
                'text-[10px] px-1.5 py-0 h-4',
                item.badge === 'new' && 'bg-emerald-500 hover:bg-emerald-600',
                item.badge === 'beta' && 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              {typeof item.badge === 'number' ? item.badge : item.badge.toUpperCase()}
            </Badge>
          )}
          
          {/* Pin indicator */}
          {isPinned && (
            <Pin className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        
        {/* Description */}
        {showDescription && layoutMode !== 'compact' && item.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {item.description}
          </p>
        )}
      </div>
      
      {/* Active indicator glow */}
      {isActive && (
        <div className={cn(
          'absolute inset-0 rounded-lg opacity-10 pointer-events-none',
          `bg-gradient-to-r ${config.gradient}`
        )} />
      )}
    </Link>
  );
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {layoutMode === 'compact' && item.description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : content}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onTogglePin}>
          <Pin className="mr-2 h-4 w-4" />
          {isPinned ? 'Unpin from top' : 'Pin to top'}
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleHide}>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide from menu
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem asChild>
          <Link to={item.url} target="_blank">
            Open in new tab
          </Link>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
