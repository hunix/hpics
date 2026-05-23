/**
 * AutoFaceEnroller - Batch process contact photos for face enrollment
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Camera, CheckCircle2, XCircle, Loader2, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface EnrollmentResult {
  profileId: string;
  profileName: string;
  avatar?: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

interface AutoFaceEnrollerProps {
  className?: string;
  onComplete?: (results: EnrollmentResult[]) => void;
}

export function AutoFaceEnroller({ className, onComplete }: AutoFaceEnrollerProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<EnrollmentResult[]>([]);

  // Fetch contacts with avatars
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts-for-enrollment', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .not('avatar_url', 'is', null)
        .limit(50);
      return data || [];
    },
    enabled: !!user
  });

  const startEnrollment = useCallback(async () => {
    if (!contacts || contacts.length === 0) return;
    
    setIsProcessing(true);
    setCurrentIndex(0);
    
    const initialResults: EnrollmentResult[] = contacts.map(c => ({
      profileId: c.id,
      profileName: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
      avatar: c.avatar_url,
      status: 'pending'
    }));
    setResults(initialResults);

    // Process each contact
    for (let i = 0; i < contacts.length; i++) {
      setCurrentIndex(i);
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'processing' } : r
      ));

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Simulate success/failure
      const success = Math.random() > 0.1;
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { 
          ...r, 
          status: success ? 'success' : 'failed',
          error: success ? undefined : 'Face not detected'
        } : r
      ));
    }

    setIsProcessing(false);
    onComplete?.(results);
  }, [contacts, results, onComplete]);

  const stopEnrollment = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const progress = contacts ? ((currentIndex + 1) / contacts.length) * 100 : 0;
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Auto Face Enroller
          </CardTitle>
          <Badge variant="secondary">
            {contacts?.length || 0} contacts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{contacts?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
            <div className="text-xs text-muted-foreground">Enrolled</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{failedCount}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Processing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Control Button */}
        <Button
          className="w-full"
          onClick={isProcessing ? stopEnrollment : startEnrollment}
          disabled={isLoading || !contacts || contacts.length === 0}
        >
          {isProcessing ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Enrollment
            </>
          )}
        </Button>

        {/* Results List */}
        {results.length > 0 && (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {results.map((result, idx) => (
                <motion.div
                  key={result.profileId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    result.status === 'processing' && "bg-primary/10",
                    result.status === 'success' && "bg-emerald-500/10",
                    result.status === 'failed' && "bg-red-500/10"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={result.avatar} />
                    <AvatarFallback>{result.profileName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.profileName}</p>
                    {result.error && (
                      <p className="text-xs text-red-400">{result.error}</p>
                    )}
                  </div>
                  {result.status === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {result.status === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                  {result.status === 'failed' && (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
