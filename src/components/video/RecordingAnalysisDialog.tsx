/**
 * Recording Analysis Dialog
 * 
 * Modal dialog for analyzing video recordings and extracting faces.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VideoAnalysisPlayer } from './VideoAnalysisPlayer';
import { VideoAnalysisResult, FaceCluster } from '@/lib/videoFrameAnalyzer';

interface RecordingAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string | null;
  recordingId?: string;
  onAnalysisComplete?: (result: VideoAnalysisResult) => void;
  onClusterSelect?: (cluster: FaceCluster) => void;
}

export function RecordingAnalysisDialog({
  open,
  onOpenChange,
  videoUrl,
  recordingId,
  onAnalysisComplete,
  onClusterSelect,
}: RecordingAnalysisDialogProps) {
  if (!videoUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Video Analysis</DialogTitle>
          <DialogDescription>
            Analyze this recording to detect and identify faces. 
            Detected individuals can be matched to existing contacts or enrolled as new profiles.
          </DialogDescription>
        </DialogHeader>

        <VideoAnalysisPlayer
          videoUrl={videoUrl}
          onAnalysisComplete={onAnalysisComplete}
          onClusterSelect={onClusterSelect}
        />
      </DialogContent>
    </Dialog>
  );
}

export default RecordingAnalysisDialog;
