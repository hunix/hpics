import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PenTool, Upload, CheckCircle2, Loader2, FileText,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface HandwritingEnrollmentProps {
  profileId: string;
  profileName: string;
  currentData: any;
  sampleCount: number;
}

export function HandwritingEnrollment({ 
  profileId, 
  profileName,
  currentData,
  sampleCount
}: HandwritingEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [model, setModel] = useState<'standard' | 'premium'>('standard');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['contact-documents-for-handwriting', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, storage_path, document_type, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  // Also get images that might contain handwriting
  const { data: imageMedia = [] } = useQuery({
    queryKey: ['contact-images-for-handwriting', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, storage_path, caption, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .in('mime_type', ['image/jpeg', 'image/png', 'image/webp'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const extractMutation = useMutation({
    mutationFn: async (documentUrls: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('extract-handwriting-biometrics', { 
          profileId, 
          documentUrls,
          model: model === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash'
        });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      toast.success('Handwriting analysis complete');
      setSelectedDocs([]);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleAnalyze = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Select at least one document');
      return;
    }

    setProcessing(true);
    try {
      const urls: string[] = [];
      for (const id of selectedDocs) {
        // Check documents first
        const doc = documents.find(d => d.id === id);
        if (doc?.storage_path) {
          const { data } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.storage_path, 3600);
          if (data?.signedUrl) urls.push(data.signedUrl);
        } else {
          // Check images
          const media = imageMedia.find(m => m.id === id);
          if (media?.storage_path) {
            const { data } = await supabase.storage
              .from('media')
              .createSignedUrl(media.storage_path, 3600);
            if (data?.signedUrl) urls.push(data.signedUrl);
          }
        }
      }

      if (urls.length === 0) {
        toast.error('Could not get document URLs');
        return;
      }

      await extractMutation.mutateAsync(urls);
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDocs(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Handwriting Profile */}
      {currentData && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Handwriting Profile
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentData.slant_angle !== undefined && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{currentData.slant_angle}°</p>
                  <p className="text-xs text-muted-foreground">Slant Angle</p>
                </div>
              )}
              {currentData.baseline_consistency && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{Math.round(currentData.baseline_consistency * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Baseline Consistency</p>
                </div>
              )}
              {currentData.unique_quirks && currentData.unique_quirks.length > 0 && (
                <div className="col-span-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Unique Quirks</p>
                  <div className="flex flex-wrap gap-1">
                    {currentData.unique_quirks.slice(0, 5).map((quirk: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {quirk.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2">What to Upload</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Scanned handwritten documents, letters, or notes</li>
            <li>• Photos of handwritten text (clear and well-lit)</li>
            <li>• Multiple samples improve accuracy</li>
            <li>• Include different contexts (formal notes, quick scribbles)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <div className="flex gap-2">
        <Button 
          variant={model === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('standard')}
        >
          Standard
        </Button>
        <Button 
          variant={model === 'premium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('premium')}
          className="gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Premium
        </Button>
      </div>

      {/* Documents */}
      <div>
        <h4 className="font-medium mb-3">Documents ({documents.length})</h4>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents found</p>
        ) : (
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {documents.map(doc => (
                <Card 
                  key={doc.id}
                  className={`cursor-pointer transition-colors ${selectedDocs.includes(doc.id) ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                  onClick={() => toggleSelection(doc.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {selectedDocs.includes(doc.id) ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Images that might contain handwriting */}
      {imageMedia.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Photos (may contain handwriting)</h4>
          <ScrollArea className="h-[100px]">
            <div className="flex gap-2">
              {imageMedia.slice(0, 20).map(media => (
                <Card 
                  key={media.id}
                  className={`cursor-pointer transition-colors flex-shrink-0 w-16 h-16 ${selectedDocs.includes(media.id) ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary'}`}
                  onClick={() => toggleSelection(media.id)}
                >
                  <CardContent className="p-0 w-full h-full">
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      {selectedDocs.includes(media.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* URL Input */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label>Or add from URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/document.jpg"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
            />
            <Button 
              onClick={() => {
                if (uploadUrl) {
                  extractMutation.mutate([uploadUrl]);
                  setUploadUrl('');
                }
              }}
              disabled={!uploadUrl.trim() || processing}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analyze Button */}
      {selectedDocs.length > 0 && (
        <Button 
          onClick={handleAnalyze}
          disabled={processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Handwriting...
            </>
          ) : (
            <>
              <PenTool className="h-4 w-4 mr-2" />
              Analyze {selectedDocs.length} Documents
            </>
          )}
        </Button>
      )}
    </div>
  );
}
