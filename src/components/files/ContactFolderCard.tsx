import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, Image, Music, Video, FileText } from 'lucide-react';

interface ContactFolderCardProps {
  name: string;
  totalFiles: number;
  counts?: {
    images?: number;
    audio?: number;
    video?: number;
    typeCounts?: Record<string, number>;
  };
  onClick: () => void;
}

export function ContactFolderCard({ name, totalFiles, counts, onClick }: ContactFolderCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {counts?.images !== undefined && counts.images > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Image className="h-3 w-3" />
                  {counts.images}
                </Badge>
              )}
              {counts?.audio !== undefined && counts.audio > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Music className="h-3 w-3" />
                  {counts.audio}
                </Badge>
              )}
              {counts?.video !== undefined && counts.video > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Video className="h-3 w-3" />
                  {counts.video}
                </Badge>
              )}
              {counts?.typeCounts && Object.entries(counts.typeCounts).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs gap-1 capitalize">
                  <FileText className="h-3 w-3" />
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
