/**
 * Bulk Email Analyzer (v3.9.34)
 * UI for analyzing email intelligence across all matched contacts
 * Now includes orphaned thread re-linking capability
 */

import { useState } from 'react';
import { useBulkEmailAnalysis, ContactEmailStats } from '@/hooks/useBulkEmailAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  MessageSquare,
  Clock,
  Play,
  RefreshCw,
  Link2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BulkEmailAnalyzerProps {
  onComplete?: () => void;
}

export function BulkEmailAnalyzer({ onComplete }: BulkEmailAnalyzerProps) {
  const {
    contactsWithEmails,
    loadingContacts,
    progress,
    resetProgress,
    isAnalyzing,
    analyzeAll,
    analyzeSelected,
    refetchContacts,
    orphanedThreadCount,
    isRelinking,
    relinkThreads,
  } = useBulkEmailAnalysis();

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const toggleContact = (profileId: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedContacts.size === contactsWithEmails.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contactsWithEmails.map(c => c.profileId)));
    }
  };

  const handleAnalyze = () => {
    if (selectedContacts.size > 0) {
      analyzeSelected(Array.from(selectedContacts));
    } else {
      analyzeAll();
    }
  };

  const unanalyzedCount = contactsWithEmails.filter(c => !c.hasAnalysis).length;
  const totalThreads = contactsWithEmails.reduce((sum, c) => sum + c.threadCount, 0);
  const totalMessages = contactsWithEmails.reduce((sum, c) => sum + c.messageCount, 0);

  if (loadingContacts) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (contactsWithEmails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Intelligence Analysis
          </CardTitle>
          <CardDescription>
            No matched contacts with email threads found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Import emails first to analyze contact communication patterns</p>
            
            {/* Show re-link option if there are orphaned threads */}
            {orphanedThreadCount > 0 && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-600 mb-3">
                  <strong>{orphanedThreadCount.toLocaleString()}</strong> email threads are not linked to any contacts.
                  Add email addresses to your contacts, then click re-link.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => relinkThreads()}
                  disabled={isRelinking}
                >
                  {isRelinking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Re-linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Re-link Threads to Contacts
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Email Intelligence Analysis
            </CardTitle>
            <CardDescription>
              Extract insights from email threads with AI
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {orphanedThreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => relinkThreads()}
                disabled={isRelinking || isAnalyzing}
                className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
              >
                {isRelinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-1" />
                    Re-link ({orphanedThreadCount.toLocaleString()})
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchContacts()}
              disabled={isAnalyzing || isRelinking}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="text-lg font-bold text-primary">{contactsWithEmails.length}</div>
            <div className="text-xs text-muted-foreground">Contacts</div>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <div className="text-lg font-bold">{totalThreads.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Threads</div>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <div className="text-lg font-bold">{totalMessages.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress.status === 'running' && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Analyzing: {progress.currentContact}
              </span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
          </div>
        )}

        {/* Results Summary */}
        {progress.status === 'completed' && progress.results.length > 0 && (
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600">Analysis Complete</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {progress.results.filter(r => r.success).length} contacts analyzed,{' '}
              {progress.results.reduce((sum, r) => sum + r.insightsCount, 0)} insights extracted
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                resetProgress();
                onComplete?.();
              }}
            >
              View Results
            </Button>
          </div>
        )}

        {/* Contact Selection */}
        {progress.status !== 'running' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedContacts.size === contactsWithEmails.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm">
                  {selectedContacts.size > 0 
                    ? `${selectedContacts.size} selected` 
                    : 'Select contacts to analyze'}
                </span>
              </div>
              {unanalyzedCount > 0 && (
                <Badge variant="outline" className="text-yellow-600">
                  {unanalyzedCount} pending analysis
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {contactsWithEmails.map((contact) => (
                  <ContactRow
                    key={contact.profileId}
                    contact={contact}
                    isSelected={selectedContacts.has(contact.profileId)}
                    onToggle={() => toggleContact(contact.profileId)}
                  />
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleAnalyze}
          disabled={isAnalyzing || contactsWithEmails.length === 0}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {selectedContacts.size > 0 
                ? `Analyze ${selectedContacts.size} Contacts` 
                : `Analyze All ${contactsWithEmails.length} Contacts`}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ContactRowProps {
  contact: ContactEmailStats;
  isSelected: boolean;
  onToggle: () => void;
}

function ContactRow({ contact, isSelected, onToggle }: ContactRowProps) {
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
        ${isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'}
      `}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{contact.contactName}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {contact.threadCount} threads
          </span>
          <span>•</span>
          <span>{contact.messageCount} messages</span>
        </div>
      </div>

      {contact.hasAnalysis ? (
        <Badge variant="outline" className="text-green-600 shrink-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Analyzed
        </Badge>
      ) : (
        <Badge variant="outline" className="text-yellow-600 shrink-0">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )}
    </div>
  );
}
