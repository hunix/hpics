import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface UrgentInsight {
  title: string;
  description: string;
  type: string;
  affected_contacts: Array<{ id: string; name: string }>;
}

export function ProactiveAlertBanner() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const navigate = useNavigate();

  const { data: urgentAlerts } = useQuery({
    queryKey: ['urgent-alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch high-priority items from activity feed
      const { data } = await supabase
        .from('contact_activity_feed')
        .select(`
          id, title, description, activity_subtype, metadata,
          profiles:profile_id (id, first_name, last_name)
        `)
        .eq('user_id', user.id)
        .eq('activity_type', 'proactive_insight')
        .gte('importance_score', 8)
        .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('importance_score', { ascending: false })
        .limit(3);

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.activity_subtype,
        affected_contacts: item.profiles ? [{
          id: (item.profiles as any).id,
          name: `${(item.profiles as any).first_name || ''} ${(item.profiles as any).last_name || ''}`.trim()
        }] : [],
      })) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const visibleAlerts = urgentAlerts?.filter(a => !dismissed.includes(a.id)) || [];

  if (visibleAlerts.length === 0) return null;

  const topAlert = visibleAlerts[0];

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{topAlert.title}</span>
        <div className="flex items-center gap-2">
          {visibleAlerts.length > 1 && (
            <span className="text-xs font-normal">
              +{visibleAlerts.length - 1} more
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setDismissed([...dismissed, topAlert.id])}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{topAlert.description}</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={() => {
            if (topAlert.affected_contacts?.[0]?.id) {
              navigate(`/contacts/${topAlert.affected_contacts[0].id}`);
            } else {
              navigate('/network-intelligence');
            }
          }}
        >
          View Details
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
