import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, AlertTriangle, Shield, Clock, MapPin, Download, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SurveillanceEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  evidence: any;
  detected_at: string;
  status: string;
}

export function CounterSurveillancePanel() {
  const [selectedEvent, setSelectedEvent] = useState<SurveillanceEvent | null>(null);

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['counter-surveillance-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counter_surveillance_events')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SurveillanceEvent[];
    }
  });

  const handleMarkReviewed = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('counter_surveillance_events')
      .update({ 
        status: 'reviewed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', eventId);
    
    refetch();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'unusual_access': return <Eye className="h-4 w-4" />;
      case 'bulk_export': return <Download className="h-4 w-4" />;
      case 'after_hours': return <Clock className="h-4 w-4" />;
      case 'geo_anomaly': return <MapPin className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const pendingCount = events?.filter(e => e.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Counter-Surveillance Monitor
          </h3>
          <p className="text-sm text-muted-foreground">
            Detect and analyze suspicious access patterns and anomalies
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {pendingCount} Pending Review
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {events?.filter(e => e.severity === 'critical').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {events?.filter(e => e.status === 'reviewed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Automatically detected suspicious access patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : events?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No suspicious activity detected</p>
              <p className="text-xs mt-1">System is actively monitoring for anomalies</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {events?.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                          {getEventIcon(event.event_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {event.event_type.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="outline" className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                            {event.status === 'reviewed' && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                <Check className="h-3 w-3 mr-1" /> Reviewed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(event.detected_at), 'PPpp')}
                          </p>
                        </div>
                      </div>
                      {event.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkReviewed(event.id);
                          }}
                        >
                          Mark Reviewed
                        </Button>
                      )}
                    </div>
                    {selectedEvent?.id === event.id && event.evidence && (
                      <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
                        <strong>Evidence:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(event.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}