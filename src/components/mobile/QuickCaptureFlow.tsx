/**
 * Quick Capture Flow - One-tap capture with automatic face detection and contact linking
 */

import { useState, useEffect } from 'react';
import { Camera, User, Check, Loader2, Scan, UserPlus, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { faceDetectionService } from '@/lib/faceDetection';

interface DetectedFace {
  id: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  matchedProfile?: { id: string; name: string; avatarUrl?: string; confidence: number };
}

interface QuickCaptureFlowProps {
  capturedBlob?: Blob;
  captureType: 'photo' | 'video' | 'voice';
  onComplete: (linkedProfileId?: string) => void;
  onCancel: () => void;
}

export function QuickCaptureFlow({ capturedBlob, captureType, onComplete, onCancel }: QuickCaptureFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'detecting' | 'matching' | 'linking' | 'done'>('detecting');
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: contacts } = useQuery({
    queryKey: ['quick-link-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, is_favorite, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: enrolledDescriptors } = useQuery({
    queryKey: ['enrolled-face-descriptors'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('contact_biometrics').select('profile_id, facial_features').eq('user_id', user.id).not('facial_features', 'is', null);
      return (data || []).map(d => {
        const features = d.facial_features as Record<string, unknown> | null;
        const descriptor = features?.descriptor;
        return {
          profileId: d.profile_id,
          descriptor: descriptor && typeof descriptor === 'object' ? faceDetectionService.deserializeDescriptor(JSON.stringify(descriptor)) : null,
        };
      }).filter(d => d.descriptor);
    },
    enabled: captureType === 'photo',
  });

  useEffect(() => {
    if (captureType !== 'photo' || !capturedBlob) {
      setStep('linking');
      return;
    }

    const detectFaces = async () => {
      try {
        await faceDetectionService.loadModels();
        const imageUrl = URL.createObjectURL(capturedBlob);
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

        const detected = await faceDetectionService.detectFaces(img, { withDescriptors: true });
        const facesWithMatches: DetectedFace[] = detected.map((face, i) => {
          const faceResult: DetectedFace = { id: `face-${i}`, confidence: 1, boundingBox: face.box };
          if (face.descriptor && enrolledDescriptors && enrolledDescriptors.length > 0) {
            const validDescriptors = enrolledDescriptors.filter(d => d.descriptor).map(d => ({ profileId: d.profileId, descriptor: d.descriptor! }));
            if (validDescriptors.length > 0) {
              const match = faceDetectionService.findBestMatch(face.descriptor, validDescriptors, 0.6);
              if (match) {
                const profile = contacts?.find(c => c.id === match.profileId);
                faceResult.matchedProfile = { id: match.profileId, name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown', avatarUrl: profile?.avatar_url ?? undefined, confidence: match.confidence };
              }
            }
          }
          return faceResult;
        });

        setDetectedFaces(facesWithMatches);
        const highConfidenceMatch = facesWithMatches.find(f => f.matchedProfile && f.matchedProfile.confidence >= 0.85);
        if (highConfidenceMatch?.matchedProfile) setSelectedProfile(highConfidenceMatch.matchedProfile.id);
        URL.revokeObjectURL(imageUrl);
        setStep('matching');
      } catch (error) {
        console.error('Face detection failed:', error);
        setStep('linking');
      }
    };

    detectFaces();
  }, [capturedBlob, captureType, enrolledDescriptors, contacts]);

  const filteredContacts = contacts?.filter(c => {
    if (!searchQuery) return true;
    const name = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      onComplete(selectedProfile ?? undefined);
      toast({ title: 'Capture Saved', description: selectedProfile ? 'Media linked successfully' : 'Saved for later linking' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getContactName = (id: string) => {
    const contact = contacts?.find(c => c.id === id);
    return contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : 'Unknown';
  };

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'detecting' && <><Scan className="h-5 w-5 animate-pulse text-primary" />Detecting Faces...</>}
            {step === 'matching' && detectedFaces.length > 0 && <><User className="h-5 w-5 text-primary" />{detectedFaces.length} Face{detectedFaces.length > 1 ? 's' : ''} Detected</>}
            {(step === 'linking' || (step === 'matching' && detectedFaces.length === 0)) && <><Link className="h-5 w-5 text-primary" />Link to Contact</>}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'detecting' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Analyzing image...</p>
            </motion.div>
          )}

          {step === 'matching' && detectedFaces.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Detected Faces</p>
                <div className="flex flex-wrap gap-2">
                  {detectedFaces.map(face => (
                    <div key={face.id} className={cn("p-3 rounded-lg border transition-all cursor-pointer", face.matchedProfile ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border")} onClick={() => face.matchedProfile ? setSelectedProfile(face.matchedProfile.id) : setStep('linking')}>
                      {face.matchedProfile ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarImage src={face.matchedProfile.avatarUrl} /><AvatarFallback>{face.matchedProfile.name[0]}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{face.matchedProfile.name}</p><Badge variant="secondary" className="text-xs">{Math.round(face.matchedProfile.confidence * 100)}% match</Badge></div>
                          {selectedProfile === face.matchedProfile.id && <Check className="h-4 w-4 text-green-500" />}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4" /></div><span className="text-sm">Unknown</span><UserPlus className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep('linking')}>Choose Different Contact</Button>
            </motion.div>
          )}

          {(step === 'linking' || (step === 'matching' && detectedFaces.length === 0)) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <Input placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-12" />
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredContacts?.slice(0, 10).map(contact => (
                    <button key={contact.id} className={cn("w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-accent active:scale-[0.98]", selectedProfile === contact.id && "bg-primary/10 ring-1 ring-primary")} onClick={() => setSelectedProfile(contact.id)}>
                      <Avatar className="h-10 w-10"><AvatarImage src={contact.avatar_url ?? undefined} /><AvatarFallback>{contact.first_name?.[0] || '?'}</AvatarFallback></Avatar>
                      <span className="flex-1 text-left font-medium">{contact.first_name} {contact.last_name || ''}</span>
                      {selectedProfile === contact.id && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => { setSelectedProfile(null); onComplete(); }}>Skip</Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedProfile ? <><Check className="h-4 w-4 mr-2" />Link to {getContactName(selectedProfile).split(' ')[0]}</> : 'Save Without Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
