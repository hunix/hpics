import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, ChevronRight, Clock, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { DossierGenerator } from './DossierGenerator';
import { DossierExporter } from './DossierExporter';

const classificationColors: Record<string, string> = {
  public: 'bg-green-500/10 text-green-600 border-green-500/50',
  internal: 'bg-blue-500/10 text-blue-600 border-blue-500/50',
  confidential: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50',
  restricted: 'bg-red-500/10 text-red-600 border-red-500/50',
};

export function DossierBrowser() {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; name: string } | null>(null);
  const [exportDossier, setExportDossier] = useState<any>(null);

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['all-dossiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, profiles(id, first_name, last_name)')
        .order('generated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (selectedProfile) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedProfile(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to all dossiers
        </button>
        <DossierGenerator profileId={selectedProfile.id} profileName={selectedProfile.name} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Intelligence Dossiers
        </CardTitle>
        <CardDescription>
          Comprehensive intelligence reports for your contacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dossiers && dossiers.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {dossiers.map((dossier: any) => {
                const profile = dossier.profiles;
                const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

                return (
                  <div
                    key={dossier.id}
                    className="p-4 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedProfile({ id: dossier.profile_id, name: profileName })}
                      >
                        <div className="font-medium">{dossier.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {profileName}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{dossier.dossier_type}</Badge>
                          <Badge 
                            variant="outline" 
                            className={classificationColors[dossier.classification]}
                          >
                            {dossier.classification}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExportDossier(dossier);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(dossier.generated_at), { addSuffix: true })}
                          </div>
                        </div>
                        <ChevronRight 
                          className="h-4 w-4 text-muted-foreground cursor-pointer" 
                          onClick={() => setSelectedProfile({ id: dossier.profile_id, name: profileName })}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No dossiers generated yet</p>
            <p className="text-sm">Generate dossiers from individual contact profiles</p>
          </div>
        )}

        {/* Export Dialog */}
        {exportDossier && (
          <DossierExporter 
            dossier={exportDossier}
            open={!!exportDossier}
            onOpenChange={(open) => !open && setExportDossier(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
