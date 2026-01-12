import { useState } from 'react';
import { ScanLine, X, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useComprehensiveScan } from '@/hooks/useComprehensiveScan';
import { MobileIntelligenceReport } from '@/components/reports/MobileIntelligenceReport';

interface ComprehensiveScanButtonProps {
  profileId: string;
  profileName: string;
  className?: string;
}

const SCAN_STAGES = [
  { id: 'profile', label: 'Profile Enrichment' },
  { id: 'psychological', label: 'Psychological Analysis' },
  { id: 'behavioral', label: 'Behavioral Predictions' },
  { id: 'cross-modal', label: 'Cross-Modal Synthesis' },
  { id: 'network', label: 'Network Intelligence' },
  { id: 'preferences', label: 'Preference Extraction' },
  { id: 'trust', label: 'Trust Assessment' },
  { id: 'influence', label: 'Influence Mapping' },
  { id: 'risks', label: 'Risk Analysis' },
  { id: 'dossier', label: 'Report Generation' },
];

export function ComprehensiveScanButton({
  profileId,
  profileName,
  className,
}: ComprehensiveScanButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { 
    isScanning, 
    progress, 
    currentStage, 
    stagesCompleted,
    error,
    startScan, 
    cancelScan 
  } = useComprehensiveScan(profileId);
  
  const scanComplete = progress === 100 && !isScanning;

  const handleToggle = async () => {
    await hapticFeedback('medium');
    if (isScanning) {
      setIsExpanded(!isExpanded);
    } else {
      setIsExpanded(true);
    }
  };

  const handleStartScan = async () => {
    await hapticFeedback('heavy');
    startScan('mobile');
  };

  const handleCancel = async () => {
    await hapticFeedback('light');
    cancelScan();
    setIsExpanded(false);
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-6 w-6 text-destructive" />;
    if (progress === 100) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (isScanning) return <Loader2 className="h-6 w-6 animate-spin" />;
    return <ScanLine className="h-6 w-6" />;
  };

  return (
    <div className={cn("fixed bottom-40 right-4 z-50 md:hidden", className)}>
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
              onClick={() => !isScanning && setIsExpanded(false)}
            />
            
            {/* Scan Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 w-72 bg-card rounded-xl shadow-2xl border overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Complete Intelligence Scan</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {profileName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                {/* Current Stage */}
                {currentStage && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {SCAN_STAGES.find(s => s.id === currentStage)?.label || currentStage}
                  </div>
                )}

                {/* Stage List */}
                <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                  {SCAN_STAGES.map((stage) => {
                    const isComplete = stagesCompleted.includes(stage.id);
                    const isCurrent = currentStage === stage.id;
                    return (
                      <div
                        key={stage.id}
                        className={cn(
                          "flex items-center gap-2 text-xs py-1 px-2 rounded",
                          isComplete && "text-green-500 bg-green-500/10",
                          isCurrent && "text-primary bg-primary/10",
                          !isComplete && !isCurrent && "text-muted-foreground"
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-current" />
                        )}
                        {stage.label}
                      </div>
                    );
                  })}
                </div>

                {/* Error */}
                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t bg-muted/30 flex gap-2">
                {scanComplete ? (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowReport(true);
                      setIsExpanded(false);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                ) : !isScanning ? (
                  <Button
                    className="flex-1"
                    onClick={handleStartScan}
                    disabled={isScanning}
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Start Full Scan
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg touch-target-xl",
          "bg-gradient-to-br from-primary to-primary/80",
          "hover:from-primary/90 hover:to-primary/70",
          "active:scale-95 transition-all duration-200",
          isScanning && "animate-pulse"
        )}
        onClick={handleToggle}
      >
        {getStatusIcon()}
      </Button>

      {/* Progress Ring (when scanning) */}
      {isScanning && !isExpanded && (
        <svg className="absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted opacity-30"
          />
          <circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progress * 1.63} 163`}
            className="text-primary"
          />
        </svg>
      )}
      
      {/* Intelligence Report Sheet */}
      <Sheet open={showReport} onOpenChange={setShowReport}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Intelligence Report</SheetTitle>
          </SheetHeader>
          <MobileIntelligenceReport 
            profileId={profileId} 
            profileName={profileName}
            onClose={() => setShowReport(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
