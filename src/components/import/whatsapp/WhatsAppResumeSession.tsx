import { formatDistanceToNow } from 'date-fns';
import { Clock, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ImportSession } from './types';

interface WhatsAppResumeSessionProps {
  session: ImportSession;
  contactName?: string;
  onResume: () => void;
  onDiscard: () => void;
}

export function WhatsAppResumeSession({
  session,
  contactName,
  onResume,
  onDiscard,
}: WhatsAppResumeSessionProps) {
  const mediaProgress = session.totalMediaFiles > 0
    ? (session.mediaUploaded / session.totalMediaFiles) * 100
    : 100;
  const messageProgress = session.totalMessages > 0
    ? (session.messagesImported / session.totalMessages) * 100
    : 0;

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Resume Previous Import</CardTitle>
        </div>
        <CardDescription>
          You have an incomplete WhatsApp import
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          {contactName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium">{contactName}</span>
            </div>
          )}
          {session.fileName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">File:</span>
              <span className="font-medium truncate max-w-[200px]">{session.fileName}</span>
            </div>
          )}
          {session.pausedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paused:</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(session.pausedAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {session.totalMediaFiles > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Media</span>
                <span>{session.mediaUploaded} / {session.totalMediaFiles}</span>
              </div>
              <Progress value={mediaProgress} className="h-1.5" />
            </div>
          )}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Messages</span>
              <span>{session.messagesImported} / {session.totalMessages}</span>
            </div>
            <Progress value={messageProgress} className="h-1.5" />
          </div>
        </div>

        {/* Stats */}
        {(session.skippedFiles.length > 0 || session.failedFiles.length > 0) && (
          <div className="flex gap-4 text-xs">
            {session.skippedFiles.length > 0 && (
              <span className="text-muted-foreground">
                {session.skippedFiles.length} skipped
              </span>
            )}
            {session.failedFiles.length > 0 && (
              <span className="text-destructive">
                {session.failedFiles.length} failed
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDiscard}>
          <Trash2 className="h-4 w-4 mr-1" />
          Discard
        </Button>
        <Button onClick={onResume}>
          <Play className="h-4 w-4 mr-1" />
          Resume
        </Button>
      </CardFooter>
    </Card>
  );
}
