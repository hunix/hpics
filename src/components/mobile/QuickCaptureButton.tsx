import { useState } from 'react';
import { Camera, X, Upload, User, FileText, Image, Mic, Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { takePhoto, hapticFeedback, isNativePlatform } from '@/lib/nativeFeatures';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickCaptureButtonProps {
  profileId?: string;
  onCapture?: (imageUrl: string) => void;
  className?: string;
}

type CaptureType = 'profile_photo' | 'document' | 'media';
type CaptureMode = 'photo' | 'video' | 'voice';

export function QuickCaptureButton({ profileId, onCapture, className }: QuickCaptureButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isModeSelect, setIsModeSelect] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureType, setCaptureType] = useState<CaptureType>('media');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const handleModeSelect = async (mode: CaptureMode) => {
    setIsModeSelect(false);
    setCaptureMode(mode);
    
    if (mode === 'photo') {
      await handlePhotoCapture();
    } else if (mode === 'video') {
      toast.info('Video capture coming soon!');
    } else if (mode === 'voice') {
      toast.info('Voice memo coming soon!');
    }
  };

  const handleCapture = async () => {
    await hapticFeedback('medium');
    // Show mode selector on long press, direct capture on tap
    await handlePhotoCapture();
  };

  const handleLongPress = async () => {
    await hapticFeedback('heavy');
    setIsModeSelect(true);
    setIsOpen(true);
  };

  const handlePhotoCapture = async () => {
    setIsCapturing(true);
    
    try {
      const imageData = await takePhoto();
      if (imageData) {
        setCapturedImage(imageData);
        setIsOpen(true);
        setIsModeSelect(false);
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = async () => {
    if (!capturedImage || !user) return;
    
    await hapticFeedback('light');
    setIsSaving(true);
    
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const fileName = `quick-capture-${timestamp}.jpg`;
      let storagePath = '';
      
      switch (captureType) {
        case 'profile_photo':
          storagePath = `${user.id}/${profileId || 'general'}/profile/${fileName}`;
          break;
        case 'document':
          storagePath = `${user.id}/${profileId || 'general'}/documents/${fileName}`;
          break;
        default:
          storagePath = `${user.id}/${profileId || 'general'}/media/${fileName}`;
      }
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);
      
      // Create media record - this will auto-trigger enrichment via database trigger
      let mediaRecord = null;
      if (profileId) {
        const { data: insertedMedia, error: mediaError } = await supabase
          .from('media')
          .insert([{
            user_id: user.id,
            profile_id: profileId,
            file_url: publicUrl,
            mime_type: 'image/jpeg',
            storage_path: data.path,
            caption: `Quick capture - ${captureType}`
          }])
          .select()
          .single();
        
        if (mediaError) throw mediaError;
        mediaRecord = insertedMedia;
        
        // Invalidate queries to refresh UI immediately
        queryClient.invalidateQueries({ queryKey: ['contact-media', profileId] });
        queryClient.invalidateQueries({ queryKey: ['contact-media-count', profileId] });
        queryClient.invalidateQueries({ queryKey: ['contact', profileId] });
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        
        // If auto-analyze enabled and profile photo, queue high-priority facial analysis
        if (autoAnalyze && captureType === 'profile_photo' && mediaRecord) {
          await supabase.from('enrichment_queue').insert({
            user_id: user.id,
            profile_id: profileId,
            enrichment_type: 'facial_biometrics',
            source_type: 'media',
            source_id: mediaRecord.id,
            priority: 10, // High priority for explicit profile photos
            status: 'pending',
            scheduled_for: new Date().toISOString(),
          });
          toast.success('Photo saved - Facial analysis queued', {
            description: 'AI will analyze biometrics shortly'
          });
        } else if (autoAnalyze && captureType === 'document' && mediaRecord) {
          // Queue document OCR
          await supabase.from('enrichment_queue').insert({
            user_id: user.id,
            profile_id: profileId,
            enrichment_type: 'document_ocr',
            source_type: 'media',
            source_id: mediaRecord.id,
            priority: 8,
            status: 'pending',
            scheduled_for: new Date().toISOString(),
          });
          toast.success('Document saved - OCR queued', {
            description: 'Text extraction will begin shortly'
          });
        } else {
          toast.success('Image saved successfully');
        }
      } else {
        toast.success('Image saved successfully');
      }
      
      onCapture?.(publicUrl);
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCapturedImage(null);
    setCaptureType('media');
    setIsModeSelect(false);
  };

  return (
    <>
      <Button
        size="icon"
        variant="default"
        className={cn(
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden",
          "bg-primary hover:bg-primary/90",
          className
        )}
        onClick={handleCapture}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
        disabled={isCapturing}
      >
        <Camera className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isModeSelect ? 'Capture Mode' : 'Quick Capture'}
            </DialogTitle>
          </DialogHeader>
          
          {isModeSelect ? (
            <div className="grid grid-cols-3 gap-4 py-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('photo')}
              >
                <Camera className="h-8 w-8" />
                <span>Photo</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('video')}
                disabled
              >
                <Video className="h-8 w-8" />
                <span>Video</span>
                <Badge variant="secondary" className="text-xs">Soon</Badge>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('voice')}
                disabled
              >
                <Mic className="h-8 w-8" />
                <span>Voice</span>
                <Badge variant="secondary" className="text-xs">Soon</Badge>
              </Button>
            </div>
          ) : capturedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
                {autoAnalyze && (
                  <Badge className="absolute top-2 right-2 bg-primary/80">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-analyze
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Save as:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={captureType === 'profile_photo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCaptureType('profile_photo')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-xs">Profile</span>
                  </Button>
                  <Button
                    variant={captureType === 'document' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCaptureType('document')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Document</span>
                  </Button>
                  <Button
                    variant={captureType === 'media' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCaptureType('media')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <Image className="h-4 w-4" />
                    <span className="text-xs">Media</span>
                  </Button>
                </div>
              </div>
              
              {/* Auto-analyze toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">Auto-analyze with AI</span>
                </div>
                <Button
                  variant={autoAnalyze ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoAnalyze(!autoAnalyze)}
                >
                  {autoAnalyze ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
