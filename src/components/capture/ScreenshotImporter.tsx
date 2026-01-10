import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScreenshotImporterProps {
  profileId?: string;
  onComplete?: (captureId: string, data: any) => void;
}

type SourceType = 'auto' | 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'threads' | 'business_card' | 'whatsapp';

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'business_card', label: 'Business Card' },
];

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export function ScreenshotImporter({ profileId, onComplete }: ScreenshotImporterProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/')
    );
    
    const newFiles: UploadedFile[] = droppedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const file = prev[index];
      URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const uploadAndProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Upload files to storage first
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: true } : f
        ));

        const fileName = `screenshots/${userData.user.id}/${Date.now()}-${file.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file.file, {
            contentType: file.file.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: false, uploaded: true, url: urlData.publicUrl } : f
        ));

        uploadedUrls.push(urlData.publicUrl);
      }

      // Call the parse function
      const { data, error } = await supabase.functions.invoke('parse-screenshot-profile', {
        body: {
          imageUrls: uploadedUrls,
          sourceType,
          profileId,
          deviceSource: detectDevice(),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: 'Screenshot Processed',
        description: `Extracted data from ${data.platform || sourceType} profile`,
      });

      if (data.captureId) {
        onComplete?.(data.captureId, data.extractedData);
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process screenshots',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Source Type Selector */}
      <div className="space-y-2">
        <Label>Screenshot Source</Label>
        <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
          <SelectTrigger>
            <SelectValue placeholder="Select source type" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          files.length > 0 ? "border-primary/30" : "border-muted-foreground/25"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">
          Drag & drop screenshots here, or click to select
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Select Screenshots
        </Button>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <ScrollArea className="h-32">
          <div className="flex gap-2 pb-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative flex-shrink-0 group">
                <img
                  src={file.preview}
                  alt={`Screenshot ${idx + 1}`}
                  className="h-28 w-auto rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {file.uploading && (
                  <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                {file.uploaded && (
                  <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Process Button */}
      {files.length > 0 && (
        <Button 
          onClick={uploadAndProcess}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing {files.length} screenshot{files.length > 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Extract Profile Data
            </>
          )}
        </Button>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Extracted Data</h4>
            <Badge variant="outline">
              {Math.round((result.confidence || 0) * 100)}% confidence
            </Badge>
          </div>
          
          <div className="grid gap-2 text-sm">
            {result.extractedData?.name && (
              <div>
                <span className="text-muted-foreground">Name:</span>{' '}
                <span className="font-medium">
                  {result.extractedData.name.full || 
                   `${result.extractedData.name.first || ''} ${result.extractedData.name.last || ''}`.trim()}
                </span>
              </div>
            )}
            {result.extractedData?.headline && (
              <div>
                <span className="text-muted-foreground">Headline:</span>{' '}
                {result.extractedData.headline}
              </div>
            )}
            {result.extractedData?.organization && (
              <div>
                <span className="text-muted-foreground">Company:</span>{' '}
                {result.extractedData.organization}
              </div>
            )}
            {result.extractedData?.job_title && (
              <div>
                <span className="text-muted-foreground">Title:</span>{' '}
                {result.extractedData.job_title}
              </div>
            )}
            {result.extractedData?.location && (
              <div>
                <span className="text-muted-foreground">Location:</span>{' '}
                {result.extractedData.location}
              </div>
            )}
          </div>

          <Button size="sm" className="w-full" disabled>
            Apply to Contact
          </Button>
        </div>
      )}
    </div>
  );
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/samsung/i.test(ua)) return 's25_ultra';
  if (/iphone/i.test(ua)) return 'iphone';
  if (/ipad/i.test(ua)) return 'ipad_pro';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

export default ScreenshotImporter;
