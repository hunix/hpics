import { useState } from 'react';
import { Bell, Check, CheckCheck, X, MessageSquare, Calendar, Shield, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertTriangle,
  reminder: Calendar,
  mention: MessageSquare,
};

const notificationColors: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-600',
  success: 'bg-emerald-500/20 text-emerald-600',
  warning: 'bg-amber-500/20 text-amber-600',
  error: 'bg-red-500/20 text-red-600',
  reminder: 'bg-violet-500/20 text-violet-600',
  mention: 'bg-cyan-500/20 text-cyan-600',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    counts, 
    markAsRead, 
    markAllAsRead, 
    clearNotification 
  } = useNotifications();
  
  const hasUnread = counts.unread > 0;
  const totalBadgeCount = counts.byType.communications + counts.byType.events;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          
          {/* Badge indicator */}
          <AnimatePresence>
            {(hasUnread || totalBadgeCount > 0) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                  'min-w-[18px] h-[18px] rounded-full text-[10px] font-bold',
                  'bg-destructive text-destructive-foreground'
                )}
              >
                {counts.unread + totalBadgeCount > 99 
                  ? '99+' 
                  : counts.unread + totalBadgeCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {hasUnread && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {counts.unread} new
              </Badge>
            )}
          </div>
          
          {hasUnread && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 border-b">
          <div className="flex flex-col items-center p-2 rounded-lg bg-background">
            <MessageSquare className="h-4 w-4 text-blue-500 mb-1" />
            <span className="text-sm font-bold">{counts.byType.communications}</span>
            <span className="text-[10px] text-muted-foreground">Messages</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-background">
            <Calendar className="h-4 w-4 text-amber-500 mb-1" />
            <span className="text-sm font-bold">{counts.byType.events}</span>
            <span className="text-[10px] text-muted-foreground">Events</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-background">
            <Shield className="h-4 w-4 text-red-500 mb-1" />
            <span className="text-sm font-bold">{counts.byType.security}</span>
            <span className="text-[10px] text-muted-foreground">Alerts</span>
          </div>
        </div>
        
        {/* Notifications list */}
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                    onClear={() => clearNotification(notification.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onClear: () => void;
}

function NotificationItem({ notification, onRead, onClear }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Info;
  const colorClass = notificationColors[notification.type] || notificationColors.info;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer group',
        !notification.read && 'bg-primary/5'
      )}
      onClick={onRead}
    >
      <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm line-clamp-1',
            !notification.read && 'font-medium'
          )}>
            {notification.title}
          </p>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </motion.div>
  );
}
