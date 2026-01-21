import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Mic, 
  Video, 
  FileText, 
  Sparkles, 
  Plus, 
  X,
  ScanLine,
  Brain,
  Globe,
  Zap,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileIntelActionsProps {
  profileId?: string;
  profileName?: string;
  onCapturePhoto?: () => void;
  onCaptureVideo?: () => void;
  onCaptureVoice?: () => void;
  onScanDocument?: () => void;
  onEnrich?: () => void;
  onAnalyze?: () => void;
  onFullScan?: () => void;
  className?: string;
}

const actions = [
  { id: 'fullscan', icon: Zap, label: 'Full Scan', color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
  { id: 'dossier', icon: Eye, label: 'Dossier', color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { id: 'photo', icon: Camera, label: 'Photo', color: 'bg-blue-500' },
  { id: 'video', icon: Video, label: 'Video', color: 'bg-red-500' },
  { id: 'voice', icon: Mic, label: 'Voice', color: 'bg-orange-500' },
  { id: 'document', icon: ScanLine, label: 'Scan', color: 'bg-green-500' },
  { id: 'enrich', icon: Globe, label: 'Enrich', color: 'bg-purple-500' },
  { id: 'analyze', icon: Brain, label: 'Analyze', color: 'bg-indigo-500' },
] as const;

export function MobileIntelActions({
  profileId,
  profileName,
  onCapturePhoto,
  onCaptureVideo,
  onCaptureVoice,
  onScanDocument,
  onEnrich,
  onAnalyze,
  onFullScan,
  className,
}: MobileIntelActionsProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = async () => {
    await hapticFeedback('medium');
    setIsExpanded(!isExpanded);
  };

  const handleAction = async (actionId: string) => {
    await hapticFeedback('light');
    setIsExpanded(false);
    
    switch (actionId) {
      case 'fullscan':
        onFullScan?.();
        break;
      case 'dossier':
        if (profileId) {
          navigate(`/dossier-preview/${profileId}`);
        }
        break;
      case 'photo':
        onCapturePhoto?.();
        break;
      case 'video':
        onCaptureVideo?.();
        break;
      case 'voice':
        onCaptureVoice?.();
        break;
      case 'document':
        onScanDocument?.();
        break;
      case 'enrich':
        onEnrich?.();
        break;
      case 'analyze':
        onAnalyze?.();
        break;
    }
  };

  return (
    <div className={cn("fixed bottom-24 right-4 z-50 md:hidden", className)}>
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
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 20, y: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-foreground bg-background/90 px-2 py-1 rounded-lg shadow-sm">
                    {action.label}
                  </span>
                  <Button
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg touch-target",
                      action.color,
                      "hover:opacity-90 active:scale-95"
                    )}
                    onClick={() => handleAction(action.id)}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg touch-target-xl",
          "bg-primary hover:bg-primary/90 active:scale-95",
          "transition-all duration-200",
          isExpanded && "rotate-45 bg-muted text-muted-foreground hover:bg-muted"
        )}
        onClick={handleToggle}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Active contact indicator */}
      {profileName && !isExpanded && (
        <div className="absolute -top-8 right-0 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded-full shadow-sm whitespace-nowrap max-w-[150px] truncate">
          <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
          {profileName}
        </div>
      )}
    </div>
  );
}
