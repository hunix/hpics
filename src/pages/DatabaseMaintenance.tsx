/**
 * Database Maintenance Center
 * Health metrics, cleanup operations, and data integrity management
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Database, Users, Trash2, Merge, AlertTriangle, CheckCircle, 
  Loader2, RefreshCw, HardDrive, FileWarning, Zap, Shield
} from 'lucide-react';
import { useDatabaseHealth, DuplicateGroup } from '@/hooks/useDatabaseHealth';

export default function DatabaseMaintenance() {
  const {
    health,
    isLoading,
    refetch,
    duplicates,
    duplicatesLoading,
    cleanupStale,
    batchMerge,
    mergeGroup,
  } = useDatabaseHealth();

  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showBatchMergeDialog, setShowBatchMergeDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);

  const handleMergeGroup = () => {
    if (!selectedGroup || !primaryId) return;
    const duplicateIds = selectedGroup.profiles.filter(p => p.id !== primaryId).map(p => p.id);
    mergeGroup.mutate({ primaryId, duplicateIds });
    setShowMergeDialog(false);
    setSelectedGroup(null);
    setPrimaryId(null);
  };

  const healthScore = health
    ? Math.max(0, 100 - (health.duplicateGroups * 5) - (health.staleBulkItems / 10) - (health.orphanedMedia * 2))
    : 100;

  return (
    <AppLayout title="Database Maintenance">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Database Maintenance Center</h1>
              <p className="text-muted-foreground">Health metrics, cleanup operations & data integrity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge 
              variant={healthScore >= 80 ? 'default' : healthScore >= 50 ? 'secondary' : 'destructive'}
              className="text-lg px-4 py-2"
            >
              <Shield className="h-4 w-4 mr-2" />
              Health: {healthScore.toFixed(0)}%
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={Users}
            label="Duplicate Groups"
            value={health?.duplicateGroups}
            isLoading={isLoading}
            variant={health?.duplicateGroups ? 'warning' : 'success'}
          />
          <MetricCard
            icon={Trash2}
            label="Stale Jobs"
            value={health?.staleBulkItems}
            isLoading={isLoading}
            variant={health?.staleBulkItems ? 'warning' : 'success'}
          />
          <MetricCard
            icon={HardDrive}
            label="Total Profiles"
            value={health?.totalProfiles}
            isLoading={isLoading}
            variant="neutral"
          />
          <MetricCard
            icon={FileWarning}
            label="Lonely Profiles"
            value={health?.lonelyProfiles}
            isLoading={isLoading}
            variant={health?.lonelyProfiles && health.lonelyProfiles > 100 ? 'warning' : 'neutral'}
          />
          <MetricCard
            icon={HardDrive}
            label="Total Media"
            value={health?.totalMedia}
            isLoading={isLoading}
            variant="neutral"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Orphaned Media"
            value={health?.orphanedMedia}
            isLoading={isLoading}
            variant={health?.orphanedMedia ? 'error' : 'success'}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>One-click database cleanup operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowBatchMergeDialog(true)}
              disabled={!health?.duplicateGroups || batchMerge.isPending}
              variant={health?.duplicateGroups ? 'default' : 'outline'}
            >
              {batchMerge.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Merge className="h-4 w-4 mr-2" />
              Merge All Duplicates ({health?.duplicateGroups || 0})
            </Button>
            <Button
              onClick={() => setShowCleanupDialog(true)}
              disabled={!health?.staleBulkItems || cleanupStale.isPending}
              variant={health?.staleBulkItems ? 'default' : 'outline'}
            >
              {cleanupStale.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              Purge Stale Jobs ({health?.staleBulkItems || 0})
            </Button>
          </CardContent>
        </Card>

        {/* Duplicate Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Duplicate Profile Groups
              {duplicates && duplicates.length > 0 && (
                <Badge variant="destructive">{duplicates.length} found</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Profiles with matching names that may be duplicates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {duplicatesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : !duplicates?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold">No duplicates found</h3>
                <p className="text-sm text-muted-foreground">Your contact list is clean!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {duplicates.map((group) => (
                  <div key={group.name} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium capitalize">{group.name}</span>
                        <Badge variant="secondary">{group.profiles.length} profiles</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          const sorted = [...group.profiles].sort((a, b) => {
                            const scoreA = a.relationshipCount + a.mediaCount + a.documentCount;
                            const scoreB = b.relationshipCount + b.mediaCount + b.documentCount;
                            return scoreB - scoreA;
                          });
                          setPrimaryId(sorted[0].id);
                          setShowMergeDialog(true);
                        }}
                      >
                        <Merge className="h-4 w-4 mr-1" />
                        Merge
                      </Button>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {group.profiles.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span>{profile.first_name} {profile.last_name}</span>
                            {profile.organization && (
                              <span className="text-muted-foreground">@ {profile.organization}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{profile.relationshipCount} rel</span>
                            <span>{profile.mediaCount} media</span>
                            <span>{profile.documentCount} docs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merge Single Group Dialog */}
      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Duplicate Profiles</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Select the primary profile to keep. All data from other profiles will be merged into it.</p>
              {selectedGroup && (
                <div className="space-y-2 mt-4">
                  {selectedGroup.profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setPrimaryId(profile.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        primaryId === profile.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{profile.first_name} {profile.last_name}</span>
                          {profile.organization && (
                            <span className="text-muted-foreground ml-2">@ {profile.organization}</span>
                          )}
                        </div>
                        {primaryId === profile.id && <Badge>Primary</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {profile.relationshipCount} relationships • {profile.mediaCount} media • {profile.documentCount} documents
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMergeGroup} disabled={!primaryId || mergeGroup.isPending}>
              {mergeGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Merge Profiles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Merge Dialog */}
      <AlertDialog open={showBatchMergeDialog} onOpenChange={setShowBatchMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batch Merge All Duplicates</AlertDialogTitle>
            <AlertDialogDescription>
              This will automatically merge all {health?.duplicateGroups || 0} duplicate groups.
              The oldest profile in each group will be kept as the primary, and all data will be consolidated.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                batchMerge.mutate();
                setShowBatchMergeDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Merge All Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cleanup Dialog */}
      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purge Stale Jobs</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {health?.staleBulkItems || 0} pending/failed bulk analysis items
              that are older than 3 days. This helps clean up your database and improve performance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cleanupStale.mutate(3);
                setShowCleanupDialog(false);
              }}
            >
              Purge Stale Jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  label,
  value,
  isLoading,
  variant = 'neutral',
}: {
  icon: React.ElementType;
  label: string;
  value?: number;
  isLoading?: boolean;
  variant?: 'success' | 'warning' | 'error' | 'neutral';
}) {
  const variantStyles = {
    success: 'border-green-500/30 bg-gradient-to-br from-green-950/50 to-background text-green-400',
    warning: 'border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-background text-amber-400',
    error: 'border-red-500/30 bg-gradient-to-br from-red-950/50 to-background text-red-400',
    neutral: 'border-border bg-card text-foreground',
  };

  const iconStyles = {
    success: 'text-green-500',
    warning: 'text-amber-500',
    error: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value?.toLocaleString() ?? 0}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${iconStyles[variant]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
