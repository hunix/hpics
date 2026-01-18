import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/design-system/utils';
import { HealthBadge } from './HealthBadge';
import { Image, Mic, FileText, Brain } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IntelligenceIndicators {
  hasMediaAnalysis?: boolean;
  hasVoiceInsights?: boolean;
  hasDocuments?: boolean;
  hasDossier?: boolean;
}

export function ContactCard({ 
  name, 
  avatarUrl, 
  subtitle, 
  healthScore, 
  onClick, 
  className,
  intelligence 
}: { 
  name: string; 
  avatarUrl?: string; 
  subtitle?: string; 
  healthScore?: number; 
  onClick?: () => void; 
  className?: string;
  intelligence?: IntelligenceIndicators;
}) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <Avatar className="h-10 w-10"><AvatarImage src={avatarUrl} /><AvatarFallback>{getInitials(name)}</AvatarFallback></Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{name}</p>
          {intelligence && (
            <div className="flex items-center gap-0.5">
              {intelligence.hasMediaAnalysis && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Image className="h-3 w-3 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>Media analyzed</TooltipContent>
                </Tooltip>
              )}
              {intelligence.hasVoiceInsights && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Mic className="h-3 w-3 text-green-500" />
                  </TooltipTrigger>
                  <TooltipContent>Voice insights</TooltipContent>
                </Tooltip>
              )}
              {intelligence.hasDocuments && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FileText className="h-3 w-3 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>Documents analyzed</TooltipContent>
                </Tooltip>
              )}
              {intelligence.hasDossier && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Brain className="h-3 w-3 text-purple-500" />
                  </TooltipTrigger>
                  <TooltipContent>Dossier generated</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {healthScore !== undefined && <HealthBadge score={healthScore} size="sm" />}
    </div>
  );
}

export function ContactCardCompact({ name, avatarUrl, onClick }: { name: string; avatarUrl?: string; onClick?: () => void }) {
  return (
    <div className={cn('flex items-center gap-2 p-2 rounded hover:bg-muted/50', onClick && 'cursor-pointer')} onClick={onClick}>
      <Avatar className="h-6 w-6"><AvatarImage src={avatarUrl} /><AvatarFallback className="text-xs">{getInitials(name, 1)}</AvatarFallback></Avatar>
      <span className="text-sm truncate">{name}</span>
    </div>
  );
}
