import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Users, 
  RefreshCw,
  ChevronRight,
  Clock,
  MessageSquare,
  Target,
  Brain
} from 'lucide-react';
import { useContactNewsCorrelation } from '@/hooks/useContactNewsCorrelation';
import { format, formatDistanceToNow } from 'date-fns';

interface ContactNewsAlertsProps {
  profileId?: string;
  compact?: boolean;
}

export function ContactNewsAlerts({ profileId, compact = false }: ContactNewsAlertsProps) {
  const {
    alerts,
    unreadAlertCount,
    predictions,
    trackedIndustries,
    isLoading,
    isCorrelating,
    correlateAll,
    predictBehavior,
    updateIndustries,
    markAlertRead,
  } = useContactNewsCorrelation(profileId);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'layoff_warning': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'funding_announcement': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'competitor_move': return <Target className="h-4 w-4 text-blue-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'job_change': return <Users className="h-4 w-4" />;
      case 'financial_stress': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity_window': return <TrendingUp className="h-4 w-4" />;
      case 'mood_shift': return <Brain className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Contact Alerts
              {unreadAlertCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadAlertCount}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => correlateAll(7)}
              disabled={isCorrelating}
            >
              <RefreshCw className={`h-4 w-4 ${isCorrelating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 ${
                  !alert.is_read ? 'bg-primary/5' : ''
                }`}
                onClick={() => markAlertRead(alert.id)}
              >
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No alerts yet. Run correlation analysis to generate alerts.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Contact Intelligence Alerts
              {unreadAlertCount > 0 && (
                <Badge variant="destructive">{unreadAlertCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered alerts correlating news with your contacts
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateIndustries()}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Update Industries
            </Button>
            <Button
              size="sm"
              onClick={() => correlateAll(7)}
              disabled={isCorrelating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCorrelating ? 'animate-spin' : ''}`} />
              Analyze News
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alerts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Predictions ({predictions.length})
            </TabsTrigger>
            <TabsTrigger value="industries" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Industries ({trackedIndustries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-4">
            <ScrollArea className="h-[400px]">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg mb-3 cursor-pointer transition-colors ${
                    !alert.is_read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => markAlertRead(alert.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.alert_type)}
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {alert.description}
                  </p>

                  {alert.profiles && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {alert.profiles.first_name} {alert.profiles.last_name}
                        {alert.profiles.organization && ` • ${alert.profiles.organization}`}
                      </span>
                    </div>
                  )}

                  {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                    <div className="mt-3 p-2 bg-muted rounded">
                      <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                      {alert.recommended_actions.slice(0, 2).map((action: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <ChevronRight className="h-3 w-3" />
                          <span>{action.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {action.timing}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {alert.conversation_starters && alert.conversation_starters.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground italic">
                        "{alert.conversation_starters[0]}"
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                    </span>
                    {profileId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          predictBehavior(alert.profile_id);
                        }}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Predict Behavior
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts yet</p>
                  <p className="text-sm">Run the news analysis to generate contact alerts</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="predictions" className="mt-4">
            <ScrollArea className="h-[400px]">
              {predictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="p-4 border rounded-lg mb-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPredictionIcon(prediction.prediction_type)}
                      <span className="font-medium capitalize">
                        {prediction.prediction_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {Math.round(prediction.confidence_score * 100)}% confidence
                    </Badge>
                  </div>

                  {prediction.profiles && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {prediction.profiles.first_name} {prediction.profiles.last_name}
                        {prediction.profiles.company && ` • ${prediction.profiles.company}`}
                      </span>
                    </div>
                  )}

                  <div className="bg-muted p-3 rounded mt-2">
                    <p className="text-sm">
                      {prediction.prediction_value?.description || JSON.stringify(prediction.prediction_value)}
                    </p>
                    {prediction.prediction_value?.implications && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Implications:</strong> {prediction.prediction_value.implications}
                      </p>
                    )}
                  </div>

                  {prediction.evidence && prediction.evidence.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Evidence:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {(prediction.evidence as string[]).slice(0, 3).map((e: string, i: number) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-muted-foreground">
                    <span>Time horizon: {prediction.time_horizon || 'unknown'}</span>
                    <span>{format(new Date(prediction.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              ))}
              {predictions.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No predictions yet</p>
                  <p className="text-sm">Analyze contacts with news to generate predictions</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="industries" className="mt-4">
            <ScrollArea className="h-[400px]">
              {trackedIndustries.map((industry) => (
                <div
                  key={industry.id}
                  className="p-4 border rounded-lg mb-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{industry.industry_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {industry.contacts_count} contacts
                      </Badge>
                      <Badge 
                        variant={industry.risk_level === 'high' ? 'destructive' : 
                                 industry.risk_level === 'medium' ? 'secondary' : 'default'}
                      >
                        {industry.risk_level} risk
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="text-2xl font-bold">
                        {industry.current_sentiment > 0 ? '+' : ''}
                        {(industry.current_sentiment * 100).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="text-2xl font-bold capitalize flex items-center justify-center gap-1">
                        {industry.sentiment_trend === 'rising' && <TrendingUp className="h-5 w-5 text-green-500" />}
                        {industry.sentiment_trend === 'falling' && <TrendingUp className="h-5 w-5 text-red-500 rotate-180" />}
                        {industry.sentiment_trend}
                      </p>
                      <p className="text-xs text-muted-foreground">Trend</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="text-2xl font-bold">
                        {industry.opportunity_score.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Opportunity</p>
                    </div>
                  </div>
                </div>
              ))}
              {trackedIndustries.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No industries tracked yet</p>
                  <p className="text-sm">Add industries to your contacts to track them</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
