import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  Camera, 
  Mic,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { usePendingMatches, useConfirmMatch } from '@/hooks/useBiometricMatching';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export function BiometricMatchReview() {
  const { user } = useAuth();
  const { data: pendingMatches = [], isLoading } = usePendingMatches();
  const confirmMatch = useConfirmMatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<string>('');

  // Fetch all contacts for correction dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-correction', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .order('first_name');
      return (data || []).map(c => ({ ...c, name: `${c.first_name || ''} ${c.last_name || ''}`.trim() }));
    },
    enabled: !!user && correctionMode
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (pendingMatches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending matches to review</p>
        </CardContent>
      </Card>
    );
  }

  const currentMatch = pendingMatches[currentIndex];
  const profile = currentMatch?.profiles;
  const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown Contact';

  const handleConfirm = async () => {
    await confirmMatch.mutateAsync({
      matchId: currentMatch.id,
      confirmed: true
    });
    
    if (currentIndex >= pendingMatches.length - 1) {
      setCurrentIndex(Math.max(0, pendingMatches.length - 2));
    }
  };

  const handleReject = async () => {
    await confirmMatch.mutateAsync({
      matchId: currentMatch.id,
      confirmed: false
    });
    
    if (currentIndex >= pendingMatches.length - 1) {
      setCurrentIndex(Math.max(0, pendingMatches.length - 2));
    }
  };

  const handleCorrect = async () => {
    if (!selectedCorrection) return;
    
    await confirmMatch.mutateAsync({
      matchId: currentMatch.id,
      confirmed: false,
      correctedProfileId: selectedCorrection
    });
    
    setCorrectionMode(false);
    setSelectedCorrection('');
    
    if (currentIndex >= pendingMatches.length - 1) {
      setCurrentIndex(Math.max(0, pendingMatches.length - 2));
    }
  };

  const goNext = () => {
    setCurrentIndex(Math.min(pendingMatches.length - 1, currentIndex + 1));
    setCorrectionMode(false);
    setSelectedCorrection('');
  };

  const goPrev = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
    setCorrectionMode(false);
    setSelectedCorrection('');
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'bg-muted';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Review Matches</CardTitle>
          <Badge variant="secondary">
            {currentIndex + 1} / {pendingMatches.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Info */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            {currentMatch.match_type === 'face' ? (
              <Camera className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span className="font-medium capitalize">
              {currentMatch.match_type} Match
            </span>
            <Badge 
              variant="secondary"
              className={getConfidenceColor(currentMatch.confidence_score)}
            >
              {currentMatch.confidence_score 
                ? `${Math.round(currentMatch.confidence_score * 100)}%`
                : 'Unknown'
              }
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profileName}</p>
              <p className="text-xs text-muted-foreground">
                Detected from {currentMatch.source_type}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {format(new Date(currentMatch.created_at), 'PPp')}
          </p>
        </div>

        {/* Correction Mode */}
        {correctionMode ? (
          <div className="space-y-3">
            <p className="text-sm">Select the correct contact:</p>
            <Select value={selectedCorrection} onValueChange={setSelectedCorrection}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={contact.avatar_url || undefined} />
                          <AvatarFallback>{contact.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {contact.name}
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setCorrectionMode(false);
                  setSelectedCorrection('');
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCorrect}
                disabled={!selectedCorrection || confirmMatch.isPending}
              >
                {confirmMatch.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply Correction'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReject}
                disabled={confirmMatch.isPending}
              >
                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                Wrong
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={confirmMatch.isPending}
              >
                {confirmMatch.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Correct
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setCorrectionMode(true)}
            >
              Different person? Select correct contact
            </Button>
          </>
        )}

        {/* Navigation */}
        {pendingMatches.length > 1 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {pendingMatches.length} pending reviews
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              disabled={currentIndex === pendingMatches.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
