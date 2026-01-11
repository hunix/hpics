/**
 * DuplicateDetectionPanel - Shows duplicates before upload with skip/replace options
 */

import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Copy,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileIcon,
  ImageIcon,
  FileAudioIcon,
  FileVideoIcon
} from 'lucide-react';
import { formatFileSize } from '@/lib/bulkUpload';
import { cn } from '@/lib/utils';
import type { ProcessedFile } from '@/lib/bulkUpload/bulkFileProcessor';

interface DuplicateGroup {
  hash: string;
  files: ProcessedFile[];
  existingRecord?: {
    id: string;
    filename: string;
    uploadedAt: string;
    profileName?: string;
  };
}

interface DuplicateDecision {
  fileId: string;
  action: 'skip' | 'upload' | 'replace';
}

interface DuplicateDetectionPanelProps {
  files: ProcessedFile[];
  duplicateGroups: DuplicateGroup[];
  existingDuplicates: Map<string, { id: string; filename: string; uploadedAt: string; profileName?: string }>;
  onDecisionsChange: (decisions: DuplicateDecision[]) => void;
  onSkipAllDuplicates: () => void;
  onUploadAll: () => void;
}

export function DuplicateDetectionPanel({
  files,
  duplicateGroups,
  existingDuplicates,
  onDecisionsChange,
  onSkipAllDuplicates,
  onUploadAll
}: DuplicateDetectionPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<Map<string, 'skip' | 'upload' | 'replace'>>(new Map());

  // Statistics
  const stats = useMemo(() => {
    const exactDuplicatesInSelection = duplicateGroups.length;
    const duplicatesWithExisting = Array.from(existingDuplicates.keys()).length;
    const newFiles = files.filter(f => 
      !existingDuplicates.has(f.contentHash || '') && 
      !duplicateGroups.some(g => g.files.includes(f))
    ).length;

    return {
      exactDuplicatesInSelection,
      duplicatesWithExisting,
      newFiles,
      totalFiles: files.length
    };
  }, [files, duplicateGroups, existingDuplicates]);

  const toggleGroup = (hash: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(hash)) {
      newExpanded.delete(hash);
    } else {
      newExpanded.add(hash);
    }
    setExpandedGroups(newExpanded);
  };

  const setDecision = (fileId: string, action: 'skip' | 'upload' | 'replace') => {
    const newDecisions = new Map(decisions);
    newDecisions.set(fileId, action);
    setDecisions(newDecisions);

    // Notify parent
    const decisionList: DuplicateDecision[] = [];
    newDecisions.forEach((action, fileId) => {
      decisionList.push({ fileId, action });
    });
    onDecisionsChange(decisionList);
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return ImageIcon;
      case 'audio': return FileAudioIcon;
      case 'video': return FileVideoIcon;
      default: return FileIcon;
    }
  };

  const hasDuplicates = stats.exactDuplicatesInSelection > 0 || stats.duplicatesWithExisting > 0;

  if (!hasDuplicates) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertDescription>
          No duplicates detected. All {stats.totalFiles} files are unique.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          Found {stats.duplicatesWithExisting + stats.exactDuplicatesInSelection} potential duplicates. 
          Review and decide how to handle them.
        </AlertDescription>
      </Alert>

      {/* Stats Row */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {stats.newFiles} New
          </Badge>
        </div>
        {stats.duplicatesWithExisting > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              <Copy className="h-3 w-3 mr-1" />
              {stats.duplicatesWithExisting} Already Uploaded
            </Badge>
          </div>
        )}
        {stats.exactDuplicatesInSelection > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.exactDuplicatesInSelection} Duplicates in Selection
            </Badge>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSkipAllDuplicates}>
          Skip All Duplicates
        </Button>
        <Button variant="outline" size="sm" onClick={onUploadAll}>
          Upload All Anyway
        </Button>
      </div>

      <Separator />

      {/* Duplicates List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-4">
          {/* Existing Duplicates */}
          {Array.from(existingDuplicates.entries()).map(([hash, existing]) => {
            const matchingFiles = files.filter(f => f.contentHash === hash);
            if (matchingFiles.length === 0) return null;

            return (
              <div key={hash} className="border rounded-lg p-3 bg-orange-50/50 dark:bg-orange-900/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                      Already exists: {existing.filename}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Uploaded {new Date(existing.uploadedAt).toLocaleDateString()}
                    {existing.profileName && ` • ${existing.profileName}`}
                  </span>
                </div>

                {matchingFiles.map((file) => {
                  const Icon = getFileIcon(file.category);
                  const decision = decisions.get(file.id) || 'skip';

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between py-2 px-3 bg-background rounded border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={decision === 'skip' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setDecision(file.id, 'skip')}
                        >
                          Skip
                        </Button>
                        <Button
                          variant={decision === 'upload' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setDecision(file.id, 'upload')}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Duplicates Within Selection */}
          {duplicateGroups.map((group) => (
            <div key={group.hash} className="border rounded-lg p-3 bg-yellow-50/50 dark:bg-yellow-900/10">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleGroup(group.hash)}
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has(group.hash) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    {group.files.length} identical files in selection
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(group.files[0]?.fileSize || 0)}
                </span>
              </div>

              {expandedGroups.has(group.hash) && (
                <div className="mt-3 space-y-2">
                  {group.files.map((file, index) => {
                    const Icon = getFileIcon(file.category);
                    const decision = decisions.get(file.id) || (index === 0 ? 'upload' : 'skip');

                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-2 px-3 bg-background rounded border"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm truncate">{file.filename}</p>
                            {file.originalPath && (
                              <p className="text-xs text-muted-foreground truncate">
                                {file.originalPath}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={decision === 'skip' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDecision(file.id, 'skip')}
                          >
                            Skip
                          </Button>
                          <Button
                            variant={decision === 'upload' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDecision(file.id, 'upload')}
                          >
                            Upload
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
