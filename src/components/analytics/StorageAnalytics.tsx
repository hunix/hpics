import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  HardDrive, 
  Image, 
  FileVideo, 
  FileAudio, 
  FileText, 
  MessageSquare,
  Search,
  ArrowUpDown,
  RefreshCw,
  Download
} from "lucide-react";
import { 
  useStorageSummary, 
  useContactStorageStats, 
  formatBytes,
  ContactStorageStats 
} from "@/hooks/useStorageAnalytics";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

type SortField = 'name' | 'total_bytes' | 'media_bytes' | 'document_bytes' | 'message_count';
type SortDirection = 'asc' | 'desc';

export function StorageAnalytics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: summary, isLoading: summaryLoading } = useStorageSummary();
  const { data: contacts, isLoading: contactsLoading } = useContactStorageStats();
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_bytes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['storage-summary', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['contact-storage-stats', user?.id] });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredContacts = (contacts || [])
    .filter(c => {
      const name = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
      return name.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      if (sortField === 'name') {
        aVal = `${a.first_name} ${a.last_name || ''}`;
        bVal = `${b.first_name} ${b.last_name || ''}`;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  const exportToCSV = () => {
    if (!contacts) return;
    
    const headers = ['Contact', 'Media Size', 'Media Files', 'Document Size', 'Document Files', 'Messages', 'Total Size'];
    const rows = contacts.map(c => [
      `${c.first_name} ${c.last_name || ''}`,
      formatBytes(c.media_bytes),
      c.media_count,
      formatBytes(c.document_bytes),
      c.document_count,
      c.message_count,
      formatBytes(c.total_bytes)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storage-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate usage percentage (assuming 1GB baseline)
  const usagePercentage = summary ? Math.min((summary.total_bytes / (1024 * 1024 * 1024)) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">{formatBytes(summary.total_bytes)}</span>
                  <span className="text-muted-foreground">total storage</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {usagePercentage.toFixed(1)}% of estimated typical usage
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Image className="h-4 w-4" />
                    <span className="text-sm">Media</span>
                  </div>
                  <p className="text-lg font-semibold">{formatBytes(summary.total_media_bytes)}</p>
                  <p className="text-xs text-muted-foreground">{summary.total_media_files.toLocaleString()} files</p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Documents</span>
                  </div>
                  <p className="text-lg font-semibold">{formatBytes(summary.total_document_bytes)}</p>
                  <p className="text-xs text-muted-foreground">{summary.total_document_files.toLocaleString()} files</p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Messages</span>
                  </div>
                  <p className="text-lg font-semibold">{summary.total_messages.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">across conversations</p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm">Contacts</span>
                  </div>
                  <p className="text-lg font-semibold">{summary.contact_count}</p>
                  <p className="text-xs text-muted-foreground">with files</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No storage data available</p>
          )}
        </CardContent>
      </Card>

      {/* Per-Contact Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Storage by Contact</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                  <div 
                    className="col-span-4 flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    Contact
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div 
                    className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('media_bytes')}
                  >
                    Media
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div 
                    className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('document_bytes')}
                  >
                    Docs
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div 
                    className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('message_count')}
                  >
                    Messages
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div 
                    className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('total_bytes')}
                  >
                    Total
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </div>

                {/* Rows */}
                {filteredContacts.map((contact) => (
                  <ContactStorageRow key={contact.profile_id} contact={contact} />
                ))}

                {filteredContacts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No contacts found
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactStorageRow({ contact }: { contact: ContactStorageStats }) {
  const totalPercentage = contact.total_bytes > 0 
    ? (contact.media_bytes / contact.total_bytes) * 100 
    : 0;

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors">
      <div className="col-span-4 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={contact.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {contact.first_name?.[0]}{contact.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium truncate">
          {contact.first_name} {contact.last_name}
        </span>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <Image className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatBytes(contact.media_bytes)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{contact.media_count} files</span>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatBytes(contact.document_bytes)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{contact.document_count} files</span>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{contact.message_count.toLocaleString()}</span>
        </div>
      </div>
      <div className="col-span-2">
        <span className="font-semibold">{formatBytes(contact.total_bytes)}</span>
        <div className="w-full bg-muted rounded-full h-1 mt-1">
          <div 
            className="bg-primary h-1 rounded-full" 
            style={{ width: `${totalPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
