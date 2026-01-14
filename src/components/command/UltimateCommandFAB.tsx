/**
 * Ultimate Command FAB
 * Floating action button for quick access to command center
 */

/**
 * Ultimate Command FAB
 * Floating action button for quick access to command center
 */

import { useState, forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Crown, Target, Shield, Brain, X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Forward ref button for AnimatePresence compatibility
const MotionButton = forwardRef<HTMLButtonElement, ButtonProps & { className?: string }>(
  (props, ref) => <Button ref={ref} {...props} />
);
MotionButton.displayName = 'MotionButton';

const QUICK_ACTIONS = [
  { id: 'power', icon: Crown, label: 'Power Matrix', tab: 'power', color: 'text-amber-500' },
  { id: 'opportunities', icon: Target, label: 'Opportunities', tab: 'opportunities', color: 'text-emerald-500' },
  { id: 'risks', icon: Shield, label: 'Risk Radar', tab: 'risks', color: 'text-rose-500' },
  { id: 'predictions', icon: Brain, label: 'Predictions', tab: 'predictions', color: 'text-violet-500' },
];

export function UltimateCommandFAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on Ultimate Command Center page itself
  if (location.pathname === '/ultimate-command') return null;

  const handleQuickAction = (tab: string) => {
    navigate(`/ultimate-command?tab=${tab}`);
    setIsExpanded(false);
  };

  const handleMainClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      navigate('/ultimate-command');
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-24 right-4 z-50 flex flex-col-reverse items-center gap-2 md:bottom-6">
        <AnimatePresence>
          {isExpanded && QUICK_ACTIONS.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-full shadow-lg border bg-card hover:bg-muted"
                    onClick={() => handleQuickAction(action.tab)}
                  >
                    <action.icon className={cn('h-4 w-4', action.color)} />
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-medium">
                  {action.label}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full shadow-xl",
                  "bg-gradient-to-br from-amber-500 to-orange-600",
                  "hover:from-amber-600 hover:to-orange-700",
                  "transition-all duration-200"
                )}
                onClick={handleMainClick}
              >
                <AnimatePresence mode="wait">
                  {isExpanded ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-6 w-6 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="crown"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Crown className="h-6 w-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-medium">
              Ultimate Command
            </TooltipContent>
          </Tooltip>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
