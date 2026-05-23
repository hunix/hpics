import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, CreditCard, Eye, EyeOff, Upload, Sparkles, Download, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface IdentityDocumentsManagerProps {
  profileId: string;
}

const DOCUMENT_TYPES = [
  'Passport',
  'National ID', 
  'Driver License',
  'Residence Permit',
  'Visa',
  'Health Insurance',
  'Vehicle Registration',
  'Professional License',
  'Other'
];

export function IdentityDocumentsManager({ profileId }: IdentityDocumentsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNumbers, setShowNumbers] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [newDoc, setNewDoc] = useState({
    document_type: '',
    document_number: '',
    issuing_country: '',
    expiry_date: '',
    issue_date: '',
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['contact-identity-documents', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_identity_documents')
        .select('*, events(id, title, event_date)')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic)$/i)) {
      toast.error('Invalid file type', { description: 'Please upload a PDF or image file' });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${profileId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setIsUploading(false);
      setIsParsing(true);

      // Parse the document with AI
      const { data, error } = await invokeFunction('parse-identity-document', {
          profileId,
          storagePath: fileName,
          fileUrl: urlData.publicUrl,
        },);

      if (error) throw error;

      if (data.success) {
        toast.success('Document processed!', {
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['contact-identity-documents', profileId] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      } else {
        toast.error('Processing failed', { description: data.error });
      }
    } catch (error) {
      console.error('Upload/parse error:', error);
      toast.error('Failed to process document', { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addMutation = useMutation({
    mutationFn: async (data: typeof newDoc) => {
      const { error } = await supabase.from('contact_identity_documents').insert({
        profile_id: profileId,
        user_id: user!.id,
        document_type: data.document_type,
        document_number: data.document_number || null,
        issuing_country: data.issuing_country || null,
        expiry_date: data.expiry_date || null,
        issue_date: data.issue_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-identity-documents', profileId] });
      setNewDoc({ document_type: '', document_number: '', issuing_country: '', expiry_date: '', issue_date: '' });
      toast.success('Document added');
    },
    onError: (error: any) => {
      toast.error('Error', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      // Delete the file from storage if it exists
      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path]);
      }
      // Delete the linked event if it exists
      if (doc.linked_event_id) {
        await supabase.from('events').delete().eq('id', doc.linked_event_id);
      }
      // Delete from embeddings
      await supabase.from('document_embeddings')
        .delete()
        .eq('source_type', 'identity_document')
        .eq('source_id', doc.id);
      // Delete the document record
      const { error } = await supabase.from('contact_identity_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-identity-documents', profileId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Document removed');
    },
  });

  const downloadDocument = async (doc: any) => {
    if (!doc.storage_path) {
      toast.error('No file attached');
      return;
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);

    if (error) {
      toast.error('Download failed');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type}_${doc.document_number || 'document'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maskNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '•'.repeat(num.length - 4) + num.slice(-4);
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (days < 30) return { label: `${days}d left`, variant: 'destructive' as const };
    if (days < 90) return { label: `${days}d left`, variant: 'secondary' as const };
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Identity Documents
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isParsing}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : isParsing ? (
                  <Sparkles className="h-4 w-4 animate-pulse mr-1" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                {isParsing ? 'Parsing...' : 'Smart Upload'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isParsing && (
            <Alert>
              <Sparkles className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                AI is analyzing the document to extract information and create reminders...
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {documents && documents.length > 0 && (
                <div className="grid gap-2">
                  {documents.map((doc) => {
                    const expiryStatus = getExpiryStatus(doc.expiry_date);
                    const hasFile = !!doc.storage_path;
                    const hasReminder = !!doc.linked_event_id;

                    return (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            {hasFile && (
                              <FileText className="h-3 w-3 absolute -bottom-1 -right-1 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{doc.document_type}</p>
                              {doc.issuing_country && (
                                <span className="text-xs text-muted-foreground">({doc.issuing_country})</span>
                              )}
                              {expiryStatus && (
                                <Badge variant={expiryStatus.variant} className="text-xs">
                                  {expiryStatus.label}
                                </Badge>
                              )}
                              {hasReminder && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Reminder
                                </Badge>
                              )}
                              {doc.ai_parsed_at && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {doc.document_number && (
                                <>
                                  <span>{showNumbers[doc.id] ? doc.document_number : maskNumber(doc.document_number)}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowNumbers(prev => ({ ...prev, [doc.id]: !prev[doc.id] }));
                                    }}
                                  >
                                    {showNumbers[doc.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </button>
                                </>
                              )}
                              {doc.expiry_date && (
                                <span>Exp: {format(new Date(doc.expiry_date), 'MMM yyyy')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasFile && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadDocument(doc);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(doc);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(!documents || documents.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No identity documents yet</p>
                  <p className="text-sm mt-1">
                    Use Smart Upload to scan a document or add manually below
                  </p>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-3">Or add manually:</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newDoc.document_type} onValueChange={(v) => setNewDoc({ ...newDoc, document_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number</Label>
                    <Input
                      value={newDoc.document_number}
                      onChange={(e) => setNewDoc({ ...newDoc, document_number: e.target.value })}
                      placeholder="Doc number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={newDoc.issuing_country}
                      onChange={(e) => setNewDoc({ ...newDoc, issuing_country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={newDoc.issue_date}
                      onChange={(e) => setNewDoc({ ...newDoc, issue_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={newDoc.expiry_date}
                      onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => addMutation.mutate(newDoc)}
                      disabled={!newDoc.document_type || addMutation.isPending}
                      className="w-full"
                    >
                      {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {selectedDoc?.document_type}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Document Number</p>
                  <p className="font-medium">{selectedDoc.document_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issuing Country</p>
                  <p className="font-medium">{selectedDoc.issuing_country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">
                    {selectedDoc.issue_date ? format(new Date(selectedDoc.issue_date), 'PP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {selectedDoc.expiry_date ? format(new Date(selectedDoc.expiry_date), 'PP') : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedDoc.parsed_data && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    AI Extracted Data
                  </p>
                  <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                    {selectedDoc.parsed_data.full_name && (
                      <p><span className="text-muted-foreground">Name:</span> {selectedDoc.parsed_data.full_name}</p>
                    )}
                    {selectedDoc.parsed_data.nationality && (
                      <p><span className="text-muted-foreground">Nationality:</span> {selectedDoc.parsed_data.nationality}</p>
                    )}
                    {selectedDoc.parsed_data.date_of_birth && (
                      <p><span className="text-muted-foreground">DOB:</span> {selectedDoc.parsed_data.date_of_birth}</p>
                    )}
                    {selectedDoc.parsed_data.confidence_score && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Confidence: {Math.round(selectedDoc.parsed_data.confidence_score * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedDoc.linked_event_id && (
                <Alert className="bg-primary/5 border-primary/20">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Reminder scheduled for {selectedDoc.reminder_days_before || 60} days before expiry
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-end">
                {selectedDoc.storage_path && (
                  <Button variant="outline" onClick={() => downloadDocument(selectedDoc)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                <Button variant="destructive" onClick={() => {
                  deleteMutation.mutate(selectedDoc);
                  setSelectedDoc(null);
                }}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
