import { useState } from 'react';
import { 
  ScanLine, Play, Pause, CheckCircle, AlertCircle, Clock, 
  DollarSign, Brain, Shield, Target, Network, FileText,
  TrendingUp, User, Activity, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useComprehensiveScan } from '@/hooks/useComprehensiveScan';
import { DesktopIntelligenceReport } from '@/components/reports/DesktopIntelligenceReport';
import { formatDistanceToNow } from 'date-fns';

interface ComprehensiveIntelligenceScanProps {
  profileId: string;
  profileName: string;
  className?: string;
}

const SCAN_STAGES = [
  { id: 'profile', label: 'Profile Enrichment', icon: User, description: 'OSINT & social data collection' },
  { id: 'psychological', label: 'Psychological Analysis', icon: Brain, description: 'Deep personality profiling' },
  { id: 'behavioral', label: 'Behavioral Predictions', icon: Activity, description: 'Pattern recognition & forecasting' },
  { id: 'cross-modal', label: 'Cross-Modal Synthesis', icon: Sparkles, description: 'Voice, facial, behavioral fusion' },
  { id: 'network', label: 'Network Intelligence', icon: Network, description: 'Relationship graph analysis' },
  { id: 'preferences', label: 'Preference Extraction', icon: Target, description: 'Predict preferences across domains' },
  { id: 'trust', label: 'Trust Assessment', icon: Shield, description: 'Reliability & risk scoring' },
  { id: 'influence', label: 'Influence Mapping', icon: TrendingUp, description: 'Susceptibility & approach strategies' },
  { id: 'risks', label: 'Risk Analysis', icon: AlertCircle, description: 'Threat & churn prediction' },
  { id: 'dossier', label: 'Report Generation', icon: FileText, description: 'Comprehensive intelligence report' },
];

export function ComprehensiveIntelligenceScan({
  profileId,
  profileName,
  className,
}: ComprehensiveIntelligenceScanProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { 
    isScanning, 
    progress, 
    currentStage, 
    stagesCompleted,
    lastScan,
    estimatedCost,
    totalCost,
    error,
    startScan, 
    cancelScan 
  } = useComprehensiveScan(profileId);

  const completedCount = stagesCompleted.length;
  const totalStages = SCAN_STAGES.length;
  const coveragePercent = Math.round((completedCount / totalStages) * 100);
  const scanComplete = progress === 100 && !isScanning;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              Complete Intelligence Scan
            </CardTitle>
            <CardDescription>
              Run all analysis modules for {profileName}
            </CardDescription>
          </div>
          {lastScan && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(lastScan), { addSuffix: true })}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isScanning ? 'Scanning...' : `Coverage: ${coveragePercent}%`}
            </span>
            <span className="font-mono font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {currentStage && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              {SCAN_STAGES.find(s => s.id === currentStage)?.label}
            </div>
          )}
        </div>

        {/* Cost Estimate */}
        <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            {isScanning ? 'Current cost' : 'Estimated cost'}
          </div>
          <span className="font-mono font-medium">
            ${((isScanning ? totalCost : estimatedCost) / 100).toFixed(2)}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stage Details (Collapsible) */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-sm h-auto py-2">
              <span className="text-muted-foreground">
                {completedCount}/{totalStages} stages complete
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2">
            {SCAN_STAGES.map((stage) => {
              const isComplete = stagesCompleted.includes(stage.id);
              const isCurrent = currentStage === stage.id;
              const Icon = stage.icon;
              
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    isComplete && "bg-green-500/10",
                    isCurrent && "bg-primary/10 animate-pulse",
                    !isComplete && !isCurrent && "opacity-60"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    isComplete && "bg-green-500/20 text-green-500",
                    isCurrent && "bg-primary/20 text-primary",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}>
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{stage.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {stage.description}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {scanComplete ? (
            <Button 
              className="flex-1" 
              onClick={() => setShowReport(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Report
            </Button>
          ) : !isScanning ? (
            <Button 
              className="flex-1" 
              onClick={() => startScan('desktop')}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Full Scan
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={cancelScan}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button 
                variant="destructive"
                onClick={cancelScan}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
      
      {/* Intelligence Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Intelligence Report: {profileName}</DialogTitle>
          </DialogHeader>
          <DesktopIntelligenceReport 
            profileId={profileId} 
            profileName={profileName}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
