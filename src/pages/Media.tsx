import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Image as ImageIcon, Images } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Media = Tables<'media'> & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export default function MediaPage() {
  const { user } = useAuth();

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
    enabled: !!user,
  });

  return (
    <AppLayout title="Media Gallery">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Photos and images related to your contacts
          </p>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : media && media.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square bg-muted relative">
                  {item.thumbnail_url || item.file_url ? (
                    <img 
                      src={item.thumbnail_url || item.file_url} 
                      alt={item.caption || ''} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  {item.caption && (
                    <p className="text-sm font-medium truncate">{item.caption}</p>
                  )}
                  {item.profiles && (
                    <p className="text-xs text-muted-foreground">
                      {item.profiles.first_name} {item.profiles.last_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'PP')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Images className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No media yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload photos and images to build a visual memory of your relationships.
              </p>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Image
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
