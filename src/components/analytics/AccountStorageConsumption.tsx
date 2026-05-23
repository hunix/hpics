import { useAccountStorageSummary } from '@/hooks/analytics/useAccountStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  HardDrive, Image, FileText, Video, MessageSquare, 
  Users, Cpu, DollarSign, AlertTriangle, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountStorageConsumptionProps {
  className?: string;
  compact?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function AccountStorageConsumption({ className, compact = false }: AccountStorageConsumptionProps) {
  const { data: storageData, isLoading } = useAccountStorageSummary();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!storageData) {
    return null;
  }

  const usagePercent = storageData.usage_percentage || 0;
  const isHighUsage = usagePercent >= 80;
  const isCriticalUsage = usagePercent >= 95;

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <span className="text-sm font-mono">
              {formatBytes(storageData.total_bytes)} / {formatBytes(storageData.storage_quota_bytes)}
            </span>
          </div>
          <Progress 
            value={usagePercent} 
            className={cn(
              "h-2",
              isCriticalUsage && "[&>div]:bg-destructive",
              isHighUsage && !isCriticalUsage && "[&>div]:bg-yellow-500"
            )}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{storageData.contact_count} contacts</span>
            <span>{formatNumber(storageData.message_count)} messages</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Storage & Usage
            </CardTitle>
            <CardDescription>
              Account-wide resource consumption
            </CardDescription>
          </div>
          {isCriticalUsage && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Critical
            </Badge>
          )}
          {isHighUsage && !isCriticalUsage && (
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              High Usage
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Storage Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Storage</span>
            <span className="font-mono font-medium">
              {formatBytes(storageData.total_bytes)} / {formatBytes(storageData.storage_quota_bytes)}
            </span>
          </div>
          <Progress 
            value={usagePercent} 
            className={cn(
              "h-3",
              isCriticalUsage && "[&>div]:bg-destructive",
              isHighUsage && !isCriticalUsage && "[&>div]:bg-yellow-500"
            )}
          />
          <div className="text-xs text-muted-foreground text-right">
            {usagePercent.toFixed(1)}% used
          </div>
        </div>

        {/* Storage Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <StorageItem
            icon={Image}
            label="Media"
            value={formatBytes(storageData.media_bytes)}
            percent={(storageData.media_bytes / storageData.storage_quota_bytes) * 100}
          />
          <StorageItem
            icon={FileText}
            label="Documents"
            value={formatBytes(storageData.document_bytes)}
            percent={(storageData.document_bytes / storageData.storage_quota_bytes) * 100}
          />
          <StorageItem
            icon={Video}
            label="Recordings"
            value={formatBytes(storageData.recording_bytes)}
            percent={(storageData.recording_bytes / storageData.storage_quota_bytes) * 100}
          />
        </div>

        {/* Data Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-bold">{storageData.contact_count}</div>
              <div className="text-xs text-muted-foreground">Contacts</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-bold">{formatNumber(storageData.message_count)}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
          </div>
        </div>

        {/* AI Usage */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            AI Usage
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Cpu className="h-5 w-5 text-primary" />
              <div>
                <div className="font-bold">{formatNumber(storageData.ai_tokens_used)}</div>
                <div className="text-xs text-muted-foreground">Tokens Used</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <div className="font-bold">${(storageData.ai_cost_cents / 100).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Total Cost</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StorageItem({ 
  icon: Icon, 
  label, 
  value, 
  percent 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  percent: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <div className="font-mono font-medium">{value}</div>
      <Progress value={percent} className="h-1" />
    </div>
  );
}
