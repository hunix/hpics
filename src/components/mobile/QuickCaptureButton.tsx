import { useState } from 'react';
import { Camera, X, Upload, User, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { takePhoto, hapticFeedback, isNativePlatform } from '@/lib/nativeFeatures';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickCaptureButtonProps {
  profileId?: string;
  onCapture?: (imageUrl: string) => void;
  className?: string;
}

type CaptureType = 'profile_photo' | 'document' | 'media';

export function QuickCaptureButton({ profileId, onCapture, className }: QuickCaptureButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureType, setCaptureType] = useState<CaptureType>('media');

  const handleCapture = async () => {
    await hapticFeedback('medium');
    setIsCapturing(true);
    
    try {
      const imageData = await takePhoto();
      if (imageData) {
        setCapturedImage(imageData);
        setIsOpen(true);
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
      
      // Create media record
      if (profileId) {
        await supabase.from('media').insert([{
          user_id: user.id,
          profile_id: profileId,
          file_url: publicUrl,
          mime_type: 'image/jpeg',
          storage_path: data.path,
          caption: `Quick capture - ${captureType}`
        }]);
      }
      
      onCapture?.(publicUrl);
      toast.success('Image saved successfully');
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save image');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCapturedImage(null);
    setCaptureType('media');
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
        disabled={isCapturing}
      >
        <Camera className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Capture</DialogTitle>
          </DialogHeader>
          
          {capturedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
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
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  <Upload className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
