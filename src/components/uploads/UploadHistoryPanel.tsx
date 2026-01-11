/**
 * UploadHistoryPanel - View past bulk upload sessions with resume capability
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  History,
  RefreshCw,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatFileSize } from '@/lib/bulkUpload';
import { cn } from '@/lib/utils';

interface UploadSession {
  id: string;
  status: string;
  source_type: string;
  total_files: number;
  completed_files: number;
  failed_files: number;
  skipped_files: number;
  total_bytes: number;
  uploaded_bytes: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  resumable_until: string | null;
  auto_analyze: boolean;
  profile_id: string | null;
  profiles?: { first_name: string; last_name: string | null } | null;
}

interface UploadHistoryPanelProps {
  onResumeSession?: (sessionId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function UploadHistoryPanel({
  onResumeSession,
  onClose,
  className
}: UploadHistoryPanelProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch upload sessions
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['bulk-upload-history', user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('bulk_upload_sessions')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UploadSession[];
    },
    enabled: !!user,
  });

  // Fetch items for expanded session
  const { data: sessionItems } = useQuery({
    queryKey: ['bulk-upload-session-items', expandedSession],
    queryFn: async () => {
      if (!expandedSession) return null;
      
      const { data, error } = await supabase
        .from('bulk_upload_items')
        .select('id, filename, file_size, status, error_message')
        .eq('session_id', expandedSession)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!expandedSession,
  });

  // Delete session
  const handleDelete = useCallback(async (sessionId: string) => {
    if (!confirm('Delete this upload session and all its records?')) return;
    
    setDeletingId(sessionId);
    try {
      // Delete items first
      await supabase
        .from('bulk_upload_items')
        .delete()
        .eq('session_id', sessionId);
      
      // Delete session
      await supabase
        .from('bulk_upload_sessions')
        .delete()
        .eq('id', sessionId);
      
      refetch();
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeletingId(null);
    }
  }, [refetch]);

  // Check if session is resumable
  const isResumable = (session: UploadSession) => {
    if (session.status !== 'paused' && session.status !== 'uploading') return false;
    if (!session.resumable_until) return true;
    return new Date(session.resumable_until) > new Date();
  };

  // Filter sessions by search
  const filteredSessions = sessions?.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const contactName = session.profiles 
      ? `${session.profiles.first_name} ${session.profiles.last_name || ''}`.toLowerCase()
      : '';
    return (
      session.id.toLowerCase().includes(query) ||
      contactName.includes(query) ||
      session.source_type.includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case 'uploading':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  const getProgress = (session: UploadSession) => {
    if (session.total_files === 0) return 0;
    return Math.round(((session.completed_files + session.skipped_files) / session.total_files) * 100);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Upload History</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="uploading">In Progress</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Sessions List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSessions && filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Session Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(session.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">
                          {session.total_files} files
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatFileSize(session.total_bytes)}
                        </span>
                        {session.profiles && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              {session.profiles.first_name} {session.profiles.last_name}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 space-y-1">
                        <Progress value={getProgress(session)} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            <span className="text-green-600 dark:text-green-400">{session.completed_files} completed</span>
                            {session.failed_files > 0 && (
                              <span className="text-destructive ml-2">{session.failed_files} failed</span>
                            )}
                            {session.skipped_files > 0 && (
                              <span className="ml-2">{session.skipped_files} skipped</span>
                            )}
                          </span>
                          <span>{getProgress(session)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isResumable(session) && onResumeSession && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onResumeSession(session.id)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedSession(
                          expandedSession === session.id ? null : session.id
                        )}
                      >
                        {expandedSession === session.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === session.id}
                        onClick={() => handleDelete(session.id)}
                      >
                        {deletingId === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {expandedSession === session.id && sessionItems && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Files in this session:</p>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {sessionItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50"
                          >
                            <span className="truncate flex-1">{item.filename}</span>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-muted-foreground">
                                {formatFileSize(item.file_size)}
                              </span>
                              {item.status === 'uploaded' && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              )}
                              {item.status === 'failed' && (
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              )}
                              {item.status === 'pending' && (
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-1">No upload history</h4>
              <p className="text-sm text-muted-foreground">
                Your bulk upload sessions will appear here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
