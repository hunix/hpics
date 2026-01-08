import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, TrendingDown, Minus, Activity, RefreshCw, AlertTriangle 
} from "lucide-react";
import { subDays, differenceInDays } from "date-fns";

interface VelocityData {
  profileId: string;
  profileName: string;
  currentRate: number; // messages per week
  previousRate: number;
  velocityChange: number; // percentage change
  trend: "accelerating" | "decelerating" | "stable";
  lastContact: Date | null;
  totalMessages: number;
}

export function CommunicationVelocityWidget() {
  const { data: velocityData, isLoading } = useQuery({
    queryKey: ["communication-velocity"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date();
      const fourWeeksAgo = subDays(now, 28);
      const eightWeeksAgo = subDays(now, 56);

      // Get communications from last 8 weeks
      const { data: comms, error } = await supabase
        .from("communications")
        .select("profile_id, occurred_at")
        .eq("user_id", user.id)
        .gte("occurred_at", eightWeeksAgo.toISOString())
        .order("occurred_at", { ascending: false });

      if (error) throw error;

      // Get profile names
      const profileIds = [...new Set(comms?.map(c => c.profile_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()]) || []);

      // Calculate velocity per profile
      const profileStats = new Map<string, {
        recentCount: number;
        previousCount: number;
        lastContact: Date | null;
        totalMessages: number;
      }>();

      comms?.forEach(c => {
        const date = new Date(c.occurred_at);
        const current = profileStats.get(c.profile_id) || {
          recentCount: 0,
          previousCount: 0,
          lastContact: null,
          totalMessages: 0
        };

        current.totalMessages++;
        
        if (!current.lastContact || date > current.lastContact) {
          current.lastContact = date;
        }

        if (date >= fourWeeksAgo) {
          current.recentCount++;
        } else {
          current.previousCount++;
        }

        profileStats.set(c.profile_id, current);
      });

      // Convert to velocity data
      const velocities: VelocityData[] = [];

      profileStats.forEach((stats, profileId) => {
        const currentRate = stats.recentCount / 4; // per week
        const previousRate = stats.previousCount / 4;
        
        let velocityChange = 0;
        if (previousRate > 0) {
          velocityChange = ((currentRate - previousRate) / previousRate) * 100;
        } else if (currentRate > 0) {
          velocityChange = 100; // New activity
        }

        let trend: "accelerating" | "decelerating" | "stable" = "stable";
        if (velocityChange > 20) trend = "accelerating";
        else if (velocityChange < -20) trend = "decelerating";

        velocities.push({
          profileId,
          profileName: profileMap.get(profileId) || "Unknown",
          currentRate,
          previousRate,
          velocityChange,
          trend,
          lastContact: stats.lastContact,
          totalMessages: stats.totalMessages
        });
      });

      // Sort by absolute velocity change (most significant changes first)
      return velocities.sort((a, b) => 
        Math.abs(b.velocityChange) - Math.abs(a.velocityChange)
      );
    },
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "accelerating": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decelerating": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadgeVariant = (trend: string): "default" | "destructive" | "secondary" => {
    switch (trend) {
      case "accelerating": return "default";
      case "decelerating": return "destructive";
      default: return "secondary";
    }
  };

  const accelerating = velocityData?.filter(v => v.trend === "accelerating") || [];
  const decelerating = velocityData?.filter(v => v.trend === "decelerating") || [];
  const significantDeclines = decelerating.filter(v => v.velocityChange < -50);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Communication Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Communication Velocity
        </CardTitle>
        {velocityData && velocityData.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {accelerating.length} accelerating • {decelerating.length} decelerating
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!velocityData || velocityData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No communication data yet</p>
            <p className="text-sm mt-1">Log communications to track velocity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {significantDeclines.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">Attention Needed</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {significantDeclines.slice(0, 3).map(v => (
                    <Badge key={v.profileId} variant="outline" className="text-xs">
                      {v.profileName}: {v.velocityChange.toFixed(0)}%
                    </Badge>
                  ))}
                  {significantDeclines.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{significantDeclines.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {velocityData.slice(0, 15).map((velocity) => (
                  <div
                    key={velocity.profileId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getTrendIcon(velocity.trend)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">
                          {velocity.profileName}
                        </span>
                        <Badge 
                          variant={getTrendBadgeVariant(velocity.trend)}
                          className="text-xs ml-2"
                        >
                          {velocity.velocityChange > 0 ? "+" : ""}
                          {velocity.velocityChange.toFixed(0)}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {velocity.currentRate.toFixed(1)}/wk
                        </span>
                        <span>•</span>
                        <span>
                          {velocity.totalMessages} total
                        </span>
                        {velocity.lastContact && (
                          <>
                            <span>•</span>
                            <span>
                              {differenceInDays(new Date(), velocity.lastContact)}d ago
                            </span>
                          </>
                        )}
                      </div>
                      
                      <Progress 
                        value={Math.min(100, velocity.currentRate * 20)} 
                        className="h-1 mt-1" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {velocityData.length > 15 && (
              <p className="text-xs text-center text-muted-foreground">
                Showing top 15 of {velocityData.length} contacts
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
