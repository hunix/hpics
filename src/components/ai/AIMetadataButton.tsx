import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Loader2, Check, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface AIMetadataButtonProps {
  itemId: string;
  itemType: 'media' | 'document';
  profileId?: string;
  hasMetadata: boolean;
  generatedAt?: string | null;
  status?: string | null;
  size?: 'sm' | 'default' | 'icon';
  onSuccess?: () => void;
}

export function AIMetadataButton({
  itemId,
  itemType,
  profileId,
  hasMetadata,
  generatedAt,
  status,
  size = 'sm',
  onSuccess,
}: AIMetadataButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async ({ regenerate }: { regenerate: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-media-metadata`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mode: 'single',
            [itemType === 'media' ? 'mediaIds' : 'documentIds']: [itemId],
            regenerate,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate metadata');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const result = data.results?.[0];
      if (result?.success) {
        toast({
          title: 'Metadata generated',
          description: `Cost: $${(data.summary.totalCostCents / 100).toFixed(4)}`,
        });
        queryClient.invalidateQueries({ queryKey: ['contact-media', profileId] });
        queryClient.invalidateQueries({ queryKey: ['contact-documents', profileId] });
        onSuccess?.();
      } else {
        toast({
          title: 'Generation failed',
          description: result?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate metadata',
        variant: 'destructive',
      });
    },
  });

  const isProcessing = status === 'processing' || generateMutation.isPending;
  const isFailed = status === 'failed';

  if (size === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                generateMutation.mutate({ regenerate: hasMetadata });
              }}
              className="h-7 w-7"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasMetadata ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isProcessing
              ? 'Generating...'
              : hasMetadata
              ? `Regenerate AI metadata (generated ${formatDistanceToNow(new Date(generatedAt!), { addSuffix: true })})`
              : 'Generate AI metadata'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={hasMetadata ? 'outline' : 'default'}
      size={size}
      disabled={isProcessing}
      onClick={(e) => {
        e.stopPropagation();
        generateMutation.mutate({ regenerate: hasMetadata });
      }}
      className="gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : hasMetadata ? (
        <>
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </>
      ) : isFailed ? (
        <>
          <AlertCircle className="h-4 w-4" />
          Retry
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Generate AI Metadata
        </>
      )}
    </Button>
  );
}

// Status badge to show metadata state
export function AIMetadataStatus({
  status,
  generatedAt,
  error,
}: {
  status?: string | null;
  generatedAt?: string | null;
  error?: string | null;
}) {
  if (!status || status === 'pending') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No AI metadata
      </Badge>
    );
  }

  if (status === 'processing') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Failed
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{error || 'Generation failed'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'completed' && generatedAt) {
    return (
      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <Check className="h-3 w-3" />
        AI: {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
      </Badge>
    );
  }

  return null;
}
