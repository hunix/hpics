import { HardDrive, Image, FileText, FileAudio, FileVideo } from "lucide-react";
import { useSingleContactStorage, formatBytes } from "@/hooks/useStorageAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ContactStorageBadgeProps {
  profileId: string;
  variant?: 'compact' | 'detailed';
}

export function ContactStorageBadge({ profileId, variant = 'compact' }: ContactStorageBadgeProps) {
  const { data: storage, isLoading } = useSingleContactStorage(profileId);

  if (isLoading) {
    return <Skeleton className="h-5 w-20" />;
  }

  if (!storage || storage.total_bytes === 0) {
    return null;
  }

  const totalFiles = storage.media_count + storage.document_count;

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 font-normal cursor-help">
              <HardDrive className="h-3 w-3" />
              {formatBytes(storage.total_bytes)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="w-64">
            <div className="space-y-2">
              <p className="font-medium">Storage Usage</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {storage.media_breakdown.image_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    <span>{formatBytes(storage.media_breakdown.images)}</span>
                    <span className="text-muted-foreground">({storage.media_breakdown.image_count})</span>
                  </div>
                )}
                {storage.media_breakdown.video_count > 0 && (
                  <div className="flex items-center gap-1">
                    <FileVideo className="h-3 w-3" />
                    <span>{formatBytes(storage.media_breakdown.videos)}</span>
                    <span className="text-muted-foreground">({storage.media_breakdown.video_count})</span>
                  </div>
                )}
                {storage.media_breakdown.audio_count > 0 && (
                  <div className="flex items-center gap-1">
                    <FileAudio className="h-3 w-3" />
                    <span>{formatBytes(storage.media_breakdown.audio)}</span>
                    <span className="text-muted-foreground">({storage.media_breakdown.audio_count})</span>
                  </div>
                )}
                {storage.document_count > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{formatBytes(storage.document_bytes)}</span>
                    <span className="text-muted-foreground">({storage.document_count})</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalFiles.toLocaleString()} files total • {storage.message_count.toLocaleString()} messages
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Storage Usage</span>
        <span className="text-lg font-bold ml-auto">{formatBytes(storage.total_bytes)}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        {storage.media_breakdown.image_count > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <Image className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium">{formatBytes(storage.media_breakdown.images)}</p>
              <p className="text-xs text-muted-foreground">{storage.media_breakdown.image_count} images</p>
            </div>
          </div>
        )}
        {storage.media_breakdown.video_count > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <FileVideo className="h-4 w-4 text-purple-500" />
            <div>
              <p className="font-medium">{formatBytes(storage.media_breakdown.videos)}</p>
              <p className="text-xs text-muted-foreground">{storage.media_breakdown.video_count} videos</p>
            </div>
          </div>
        )}
        {storage.media_breakdown.audio_count > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <FileAudio className="h-4 w-4 text-green-500" />
            <div>
              <p className="font-medium">{formatBytes(storage.media_breakdown.audio)}</p>
              <p className="text-xs text-muted-foreground">{storage.media_breakdown.audio_count} audio</p>
            </div>
          </div>
        )}
        {storage.document_count > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <FileText className="h-4 w-4 text-orange-500" />
            <div>
              <p className="font-medium">{formatBytes(storage.document_bytes)}</p>
              <p className="text-xs text-muted-foreground">{storage.document_count} documents</p>
            </div>
          </div>
        )}
      </div>
      
      {storage.message_count > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          + {storage.message_count.toLocaleString()} messages in conversations
        </p>
      )}
    </div>
  );
}
