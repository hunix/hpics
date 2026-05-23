import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { uploadRecording } from '@/hooks/recordings/useUploadRecording';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, Mic, Loader2, CheckCircle2, FileAudio } from 'lucide-react';

interface RecordingUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  profileName?: string;
  onSuccess?: () => void;
}

export function RecordingUpload({ open, onOpenChange, profileId, profileName, onSuccess }: RecordingUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('meetings');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'complete'>('idle');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const handleUpload = async () => {
    if (!file || !user) return;

    try {
      setUploading(true);
      setStatus('uploading');
      setUploadProgress(10);

      const result = await uploadRecording({
        userId: user.id,
        profileId,
        file,
        title,
        description,
        folder,
        onProgress: (pct) => {
          setUploadProgress(pct);
          if (pct >= 80) {
            setStatus('transcribing');
            setTranscribing(true);
          }
        },
      });

      if (result.transcribeError) {
        console.error('Transcription error:', result.transcribeError);
        toast({
          title: 'Upload complete',
          description: 'Recording uploaded. Transcription will be processed in the background.',
        });
      } else {
        setStatus('complete');
        toast({
          title: 'Success!',
          description: 'Recording uploaded and transcribed successfully.',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['contact-recordings', profileId] });
      
      onSuccess?.();
      
      // Reset and close
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload recording',
        variant: 'destructive',
      });
      setStatus('idle');
    } finally {
      setUploading(false);
      setTranscribing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setFolder('meetings');
    setUploadProgress(0);
    setStatus('idle');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Upload Recording
          </DialogTitle>
          <DialogDescription>
            Upload an audio recording to transcribe and analyze.
            {profileName && <span className="block mt-1">Associated with: <strong>{profileName}</strong></span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="audio-file">Audio File</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                id="audio-file"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label htmlFor="audio-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileAudio className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-10 w-10" />
                    <p>Click to select audio file</p>
                    <p className="text-xs">MP3, WAV, M4A, etc.</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context about this recording..."
              rows={2}
              disabled={uploading}
            />
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label>Folder</Label>
            <Select value={folder} onValueChange={setFolder} disabled={uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meetings">Meetings</SelectItem>
                <SelectItem value="interviews">Interviews</SelectItem>
                <SelectItem value="screenings">Screenings</SelectItem>
                <SelectItem value="calls">Phone Calls</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          {status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === 'transcribing' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {status === 'uploading' && 'Uploading...'}
                  {status === 'transcribing' && 'Transcribing with ElevenLabs...'}
                  {status === 'complete' && 'Complete!'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Transcribe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
