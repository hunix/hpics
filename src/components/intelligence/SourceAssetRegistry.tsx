import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Link2,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface SourceAsset {
  id: string;
  asset_type: string;
  original_id: string | null;
  content_hash: string | null;
  analysis_count: number | null;
  is_deleted: boolean | null;
  deleted_at: string | null;
  created_at: string | null;
  profile_id: string | null;
}

const getAssetIcon = (assetType: string) => {
  switch (assetType) {
    case "image": return <FileImage className="h-4 w-4 text-violet-500" />;
    case "video": return <FileVideo className="h-4 w-4 text-blue-500" />;
    case "audio": return <FileAudio className="h-4 w-4 text-emerald-500" />;
    case "document": return <FileText className="h-4 w-4 text-amber-500" />;
    case "message": return <FileText className="h-4 w-4 text-rose-500" />;
    default: return <Database className="h-4 w-4 text-muted-foreground" />;
  }
};

const getAssetBadgeStyle = (assetType: string) => {
  switch (assetType) {
    case "image": return "bg-violet-500/10 text-violet-500 border-violet-500/20";
    case "video": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "audio": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "document": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "message": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

export function SourceAssetRegistry() {
  const { user } = useAuth();

  const { data: assets, isLoading } = useQuery({
    queryKey: ["source-asset-registry", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("source_asset_registry")
        .select("id, asset_type, original_id, content_hash, analysis_count, is_deleted, deleted_at, created_at, profile_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []) as SourceAsset[];
    },
    enabled: !!user?.id,
  });

  const { data: linkedEvents } = useQuery({
    queryKey: ["asset-linked-events", user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const { data, error } = await (supabase as any)
        .from("analysis_events")
        .select("source_registry_id")
        .eq("user_id", user.id)
        .not("source_registry_id", "is", null);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        if (e.source_registry_id) {
          counts[e.source_registry_id] = (counts[e.source_registry_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Source Asset Registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAssets = assets?.filter((a) => !a.is_deleted) || [];
  const deletedAssets = assets?.filter((a) => a.is_deleted) || [];

  const assetTypeCounts = activeAssets.reduce((acc, asset) => {
    acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Source Asset Registry
            </CardTitle>
            <CardDescription>
              Track source assets and their linked analysis events
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {Object.entries(assetTypeCounts).map(([type, count]) => (
              <Badge key={type} variant="outline" className={getAssetBadgeStyle(type)}>
                {getAssetIcon(type)}
                <span className="ml-1">{count}</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeAssets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No source assets registered</p>
            <p className="text-sm mt-1">Assets are automatically registered when analyzed</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content Hash</TableHead>
                  <TableHead>Analyses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAssetIcon(asset.asset_type)}
                        <span className="capitalize">{asset.asset_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {asset.content_hash?.slice(0, 12) || "N/A"}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Link2 className="h-3 w-3" />
                        {linkedEvents?.[asset.id] || asset.analysis_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.is_deleted ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          <XCircle className="h-3 w-3 mr-1" />
                          Deleted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {asset.created_at 
                          ? formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })
                          : "N/A"
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {deletedAssets.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              {deletedAssets.length} deleted assets (intelligence preserved)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
