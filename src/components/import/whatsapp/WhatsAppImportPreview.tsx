import { format } from 'date-fns';
import { Image, Video, FileText, Mic, Sticker } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ImportStats } from './types';

interface ParsedMessage {
  date: Date;
  content: string;
  senderName: string;
  isFromContact: boolean;
  mediaFilename?: string;
  mediaType?: string;
}

interface WhatsAppImportPreviewProps {
  messages: ParsedMessage[];
  stats: ImportStats;
  contactName: string;
}

const mediaIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  document: FileText,
  audio: Mic,
  sticker: Sticker,
};

export function WhatsAppImportPreview({
  messages,
  stats,
  contactName,
}: WhatsAppImportPreviewProps) {
  const previewMessages = messages.slice(0, 20);

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Messages" value={stats.totalMessages} />
        <StatCard label="Images" value={stats.images} icon={Image} />
        <StatCard label="Videos" value={stats.videos} icon={Video} />
        <StatCard label="Audio" value={stats.audio} icon={Mic} />
      </div>

      {stats.dateRange.start && stats.dateRange.end && (
        <p className="text-xs text-muted-foreground text-center">
          {format(stats.dateRange.start, 'MMM d, yyyy')} — {format(stats.dateRange.end, 'MMM d, yyyy')}
        </p>
      )}

      {/* Message preview */}
      <div className="border rounded-lg">
        <div className="p-2 border-b bg-muted/50">
          <h4 className="text-sm font-medium">Preview (first 20 messages)</h4>
        </div>
        <ScrollArea className="h-[250px]">
          <div className="p-3 space-y-2">
            {previewMessages.map((msg, idx) => (
              <MessagePreviewItem
                key={idx}
                message={msg}
                contactName={contactName}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  icon?: React.ElementType;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-lg font-semibold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function MessagePreviewItem({
  message,
  contactName,
}: {
  message: ParsedMessage;
  contactName: string;
}) {
  const Icon = message.mediaType ? mediaIcons[message.mediaType] : null;
  const isContact = message.isFromContact;

  return (
    <div className={`flex flex-col ${isContact ? 'items-start' : 'items-end'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isContact
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs font-medium opacity-70">
            {isContact ? contactName : 'You'}
          </span>
          <span className="text-xs opacity-50">
            {format(message.date, 'HH:mm')}
          </span>
        </div>
        
        <div className="flex items-start gap-2">
          {Icon && (
            <Badge variant="outline" className="shrink-0">
              <Icon className="h-3 w-3 mr-1" />
              {message.mediaType}
            </Badge>
          )}
          <p className="text-sm break-words">
            {message.content || (message.mediaFilename ? `[${message.mediaType}]` : '[Empty message]')}
          </p>
        </div>
      </div>
    </div>
  );
}
