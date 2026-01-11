import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Camera, 
  UserPlus, 
  Upload, 
  Sparkles,
  MessageSquare,
  Phone,
  X,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  onClick?: () => void;
}

interface FloatingQuickActionsProps {
  // Contact-specific actions
  onCapturePhoto?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onEnrich?: () => void;
  // List actions
  onAddContact?: () => void;
  onImport?: () => void;
  onSearch?: () => void;
  // Context
  contactName?: string;
  className?: string;
}

export function FloatingQuickActions({
  onCapturePhoto,
  onCall,
  onMessage,
  onEnrich,
  onAddContact,
  onImport,
  onSearch,
  contactName,
  className,
}: FloatingQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  
  // Determine context based on route
  const isContactDetail = location.pathname.includes('/contacts/') && location.pathname !== '/contacts';
  const isContactsList = location.pathname === '/contacts';
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  // Build actions based on context
  const actions: QuickAction[] = [];
  
  if (isContactDetail) {
    if (onCapturePhoto) {
      actions.push({ id: 'photo', icon: Camera, label: 'Capture', color: 'bg-blue-500', onClick: onCapturePhoto });
    }
    if (onEnrich) {
      actions.push({ id: 'enrich', icon: Sparkles, label: 'Enrich', color: 'bg-purple-500', onClick: onEnrich });
    }
    if (onCall) {
      actions.push({ id: 'call', icon: Phone, label: 'Call', color: 'bg-green-500', onClick: onCall });
    }
    if (onMessage) {
      actions.push({ id: 'message', icon: MessageSquare, label: 'Message', color: 'bg-orange-500', onClick: onMessage });
    }
  } else if (isContactsList || isDashboard) {
    if (onAddContact) {
      actions.push({ id: 'add', icon: UserPlus, label: 'Add Contact', color: 'bg-primary', onClick: onAddContact });
    }
    if (onImport) {
      actions.push({ id: 'import', icon: Upload, label: 'Import', color: 'bg-blue-500', onClick: onImport });
    }
    if (onSearch) {
      actions.push({ id: 'search', icon: Search, label: 'Search', color: 'bg-muted', onClick: onSearch });
    }
  }

  // Don't render if no actions
  if (actions.length === 0) return null;

  const handleToggle = async () => {
    await hapticFeedback('medium');
    setIsExpanded(!isExpanded);
  };

  const handleAction = async (action: QuickAction) => {
    await hapticFeedback('light');
    setIsExpanded(false);
    action.onClick?.();
  };

  // Auto-collapse when route changes
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  return (
    <div className={cn(
      "fixed bottom-24 right-4 z-50 md:hidden",
      className
    )}>
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: 20, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: 20, y: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-foreground bg-background/90 px-3 py-1.5 rounded-lg shadow-sm">
                      {action.label}
                    </span>
                    <Button
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg touch-target",
                        action.color,
                        "hover:opacity-90 active:scale-95"
                      )}
                      onClick={() => handleAction(action)}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg touch-target-xl relative",
            isExpanded 
              ? "bg-muted text-muted-foreground hover:bg-muted" 
              : "bg-primary hover:bg-primary/90",
            "transition-all duration-200"
          )}
          onClick={handleToggle}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <X className="h-6 w-6" />
            ) : (
              <Zap className="h-6 w-6" />
            )}
          </motion.div>
        </Button>
      </motion.div>

      {/* Context indicator */}
      {contactName && !isExpanded && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 right-0 text-xs text-muted-foreground bg-background/95 px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap max-w-[160px] truncate border"
        >
          <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" />
          {contactName}
        </motion.div>
      )}
    </div>
  );
}
