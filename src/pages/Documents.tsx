import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, File, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Document = Tables<'documents'> & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export default function Documents() {
  const { user } = useAuth();

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

  return (
    <AppLayout title="Documents">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Store and organize documents related to your contacts
          </p>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

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
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
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
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
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
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
