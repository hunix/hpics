import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, File, ExternalLink, Trash2, Search, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInDays } from 'date-fns';
import { DocumentUpload } from '@/components/uploads/DocumentUpload';
import { DocumentRAGSearch } from '@/components/documents/DocumentRAGSearch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import type { Tables } from '@/integrations/supabase/types';

type Document = Tables<'documents'> & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export default function Documents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const { data: identityDocs } = useQuery({
    queryKey: ['all-identity-documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_identity_documents')
        .select('*, profiles(first_name, last_name)')
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document deleted' });
    },
  });

  const handleOpenDocument = async (doc: Document) => {
    setOpeningDocId(doc.id);
    try {
      const path = doc.storage_path || doc.file_url;
      // If it's already a full URL (legacy), open directly
      if (path.startsWith('http')) {
        window.open(path, '_blank');
        return;
      }
      const url = await getSignedUrl('documents', path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({ title: 'Failed to access document', variant: 'destructive' });
      }
    } finally {
      setOpeningDocId(null);
    }
  };

  const docTypeColors: Record<string, string> = {
    resume: 'bg-blue-100 text-blue-800',
    contract: 'bg-green-100 text-green-800',
    presentation: 'bg-purple-100 text-purple-800',
    notes: 'bg-yellow-100 text-yellow-800',
    article: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: 'Expired', variant: 'destructive' as const, urgent: true };
    if (days < 30) return { label: `${days}d left`, variant: 'destructive' as const, urgent: true };
    if (days < 90) return { label: `${days}d left`, variant: 'secondary' as const, urgent: false };
    return null;
  };

  const expiringDocs = identityDocs?.filter(doc => {
    if (!doc.expiry_date) return false;
    const days = differenceInDays(new Date(doc.expiry_date), new Date());
    return days <= 90;
  }) || [];

  return (
    <AppLayout title="Documents">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <FileText className="h-4 w-4" />
                All Documents
              </TabsTrigger>
              <TabsTrigger value="identity" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Identity Docs
                {expiringDocs.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 p-1 justify-center">
                    {expiringDocs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                AI Search
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{doc.title}</h3>
                          {doc.profiles && (
                            <p className="text-sm text-muted-foreground">
                              {doc.profiles.first_name} {doc.profiles.last_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className={docTypeColors[doc.document_type]}>
                              {doc.document_type}
                            </Badge>
                            {doc.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(doc.created_at), 'PP')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={openingDocId === doc.id}
                            onClick={() => handleOpenDocument(doc)}
                          >
                            {openingDocId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              if (confirm('Delete this document?')) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <File className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Upload resumes, contracts, and other important documents.
                  </p>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Your First Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="identity" className="mt-6">
            {identityDocs && identityDocs.length > 0 ? (
              <div className="space-y-4">
                {expiringDocs.length > 0 && (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h3 className="font-semibold">Documents Expiring Soon</h3>
                      </div>
                      <div className="grid gap-2">
                        {expiringDocs.map((doc: any) => {
                          const status = getExpiryStatus(doc.expiry_date);
                          return (
                            <div 
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-background rounded cursor-pointer hover:bg-muted"
                              onClick={() => navigate(`/contacts/${doc.profile_id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{doc.document_type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.profiles?.first_name} {doc.profiles?.last_name}
                                  </p>
                                </div>
                              </div>
                              {status && (
                                <Badge variant={status.variant}>{status.label}</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {identityDocs.map((doc: any) => {
                    const status = getExpiryStatus(doc.expiry_date);
                    return (
                      <Card 
                        key={doc.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/contacts/${doc.profile_id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{doc.document_type}</h3>
                                {status && (
                                  <Badge variant={status.variant} className="text-xs">
                                    {status.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {doc.profiles?.first_name} {doc.profiles?.last_name}
                              </p>
                              {doc.document_number && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  #{doc.document_number}
                                </p>
                              )}
                              {doc.expiry_date && (
                                <p className="text-xs text-muted-foreground">
                                  Expires: {format(new Date(doc.expiry_date), 'PP')}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No identity documents yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add identity documents (passports, IDs, licenses) from individual contact profiles.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <DocumentRAGSearch />
          </TabsContent>
        </Tabs>
      </div>

      <DocumentUpload open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </AppLayout>
  );
}
