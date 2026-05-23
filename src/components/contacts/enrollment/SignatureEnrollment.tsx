import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Hand, Upload, CheckCircle2, Loader2, FileText,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface SignatureEnrollmentProps {
  profileId: string;
  profileName: string;
  currentData: any;
  sampleCount: number;
}

export function SignatureEnrollment({ 
  profileId, 
  profileName,
  currentData,
  sampleCount
}: SignatureEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [model, setModel] = useState<'standard' | 'premium'>('standard');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['contact-documents-for-signature', profileId, user?.id],
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

  const extractMutation = useMutation({
    mutationFn: async (signatureUrls: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('extract-signature-biometrics', { 
          profileId, 
          signatureUrls,
          model: model === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash'
        });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      toast.success('Signature analysis complete');
      setSelectedDocs([]);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleAnalyze = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Select at least one document with signature');
      return;
    }

    setProcessing(true);
    try {
      const urls: string[] = [];
      for (const id of selectedDocs) {
        const doc = documents.find(d => d.id === id);
        if (doc?.storage_path) {
          const { data } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.storage_path, 3600);
          if (data?.signedUrl) urls.push(data.signedUrl);
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
      {/* Current Signature Profile */}
      {currentData && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Hand className="h-4 w-4" />
              Signature Profile
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentData.consistency_score && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{Math.round(currentData.consistency_score * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Consistency</p>
                </div>
              )}
              {currentData.variation_tolerance && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{Math.round(currentData.variation_tolerance * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Variation Tolerance</p>
                </div>
              )}
              {currentData.flourishes && currentData.flourishes.length > 0 && (
                <div className="col-span-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Distinctive Elements</p>
                  <div className="flex flex-wrap gap-1">
                    {currentData.flourishes.slice(0, 4).map((f: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {currentData.verification_ready && (
              <div className="mt-3 flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm">Ready for signature verification</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2">What to Upload</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Documents containing this contact's signature</li>
            <li>• Multiple signatures help establish variation patterns</li>
            <li>• Clear, high-resolution scans work best</li>
            <li>• Include signatures from different dates if possible</li>
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
        <h4 className="font-medium mb-3">Documents with Signatures ({documents.length})</h4>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents found</p>
            <p className="text-sm">Upload signed documents in the Documents tab first</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
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

      {/* URL Input */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label>Or add signature image URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/signature.png"
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
              Analyzing Signatures...
            </>
          ) : (
            <>
              <Hand className="h-4 w-4 mr-2" />
              Analyze {selectedDocs.length} Documents
            </>
          )}
        </Button>
      )}
    </div>
  );
}
