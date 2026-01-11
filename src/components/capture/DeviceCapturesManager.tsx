import React, { useState, useMemo } from 'react';
import { 
  Inbox, RefreshCw, Filter, Search, Trash2, Link2, 
  Brain, CheckCircle2, Clock, AlertCircle, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeviceCaptures } from '@/hooks/useDeviceCaptures';
import { CaptureCard } from './CaptureCard';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'pending' | 'linked' | 'analyzed';
type FilterPlatform = 'all' | 'instagram' | 'linkedin' | 'threads' | 'x';

export function DeviceCapturesManager() {
  const { captures, isLoading, stats, fetchCaptures, processCapture, linkToProfile, deleteCapture, isProcessing } = useDeviceCaptures();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter and search captures
  const filteredCaptures = useMemo(() => {
    return captures.filter(capture => {
      // Status filter
      if (statusFilter === 'pending' && capture.profile_id) return false;
      if (statusFilter === 'linked' && !capture.profile_id) return false;
      if (statusFilter === 'analyzed' && capture.status !== 'processed') return false;

      // Platform filter
      const platform = (capture.extracted_data as any)?.platform?.toLowerCase() || 
                      (capture.extracted_data as any)?.source_app?.toLowerCase() || '';
      if (platformFilter !== 'all' && !platform.includes(platformFilter)) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const username = (capture.extracted_data as any)?.username?.toLowerCase() || '';
        const displayName = (capture.extracted_data as any)?.displayName?.toLowerCase() || '';
        const bio = (capture.extracted_data as any)?.bio?.toLowerCase() || '';
        if (!username.includes(searchLower) && !displayName.includes(searchLower) && !bio.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [captures, statusFilter, platformFilter, searchQuery]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredCaptures.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCaptures.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteCapture(id);
    }
    setSelectedIds(new Set());
  };

  const handleBulkAnalyze = async () => {
    for (const id of selectedIds) {
      await processCapture(id);
    }
    setSelectedIds(new Set());
  };

  const unlinkedCount = captures.filter(c => !c.profile_id).length;
  const analyzedCount = captures.filter(c => c.status === 'processed').length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Captures
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {captures.length} total
            </Badge>
            {unlinkedCount > 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                {unlinkedCount} unlinked
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchCaptures()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {stats.pending} pending
          </span>
          <span className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            {stats.linked} linked
          </span>
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            {analyzedCount} analyzed
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, name, bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="linked">Linked</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as FilterPlatform)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="threads">Threads</SelectItem>
                <SelectItem value="x">X (Twitter)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkAnalyze}
              disabled={isProcessing}
            >
              <Brain className="h-3.5 w-3.5 mr-1" />
              Analyze
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {/* Select All */}
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={selectedIds.size === filteredCaptures.length && filteredCaptures.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedIds.size === filteredCaptures.length && filteredCaptures.length > 0 
              ? 'Deselect all' 
              : 'Select all'}
          </span>
        </div>

        {/* Captures List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />
                <p className="text-sm">Loading captures...</p>
              </div>
            ) : filteredCaptures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No captures found</p>
                <p className="text-xs mt-1">
                  {captures.length === 0 
                    ? 'Use the Chrome extension to capture social profiles'
                    : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              filteredCaptures.map((capture) => (
                <CaptureCard
                  key={capture.id}
                  capture={capture}
                  isSelected={selectedIds.has(capture.id)}
                  isExpanded={expandedId === capture.id}
                  onSelect={() => toggleSelection(capture.id)}
                  onExpand={() => setExpandedId(expandedId === capture.id ? null : capture.id)}
                  onAnalyze={() => processCapture(capture.id)}
                  onDelete={() => deleteCapture(capture.id)}
                  onLink={linkToProfile}
                  isProcessing={isProcessing}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default DeviceCapturesManager;
