import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, AlertTriangle, Shield, DollarSign, Swords, 
  TrendingUp, Users, X, ExternalLink, Settings
} from 'lucide-react';
import { useBetrayalPrediction } from '@/hooks/intelligence/useBetrayalPrediction';
import { useMICEAnalysis } from '@/hooks/intelligence/useMICEAnalysis';
import { useSacredValues } from '@/hooks/intelligence/useSacredValues';
import { toast } from 'sonner';

interface Alert {
  id: string;
  type: 'betrayal' | 'mice' | 'sacred' | 'semantic' | 'consensus';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  profileId?: string;
  profileName?: string;
  timestamp: Date;
  dismissed: boolean;
}

const SEVERITY_CONFIG = {
  critical: { 
    color: 'bg-red-500/20 text-red-400 border-red-500/30', 
    icon: AlertTriangle,
    pulse: true 
  },
  high: { 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
    icon: AlertTriangle,
    pulse: false 
  },
  medium: { 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    icon: Shield,
    pulse: false 
  },
  low: { 
    color: 'bg-muted text-muted-foreground border-muted', 
    icon: Bell,
    pulse: false 
  },
};

const TYPE_CONFIG = {
  betrayal: { icon: AlertTriangle, label: 'Betrayal Risk', color: 'text-red-400' },
  mice: { icon: DollarSign, label: 'MICE Vulnerability', color: 'text-amber-400' },
  sacred: { icon: Shield, label: 'Sacred Value', color: 'text-violet-400' },
  semantic: { icon: Swords, label: 'Semantic Shift', color: 'text-blue-400' },
  consensus: { icon: Users, label: 'Consensus', color: 'text-emerald-400' },
};

export function CognitiveWarfareAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    betrayalAlerts: true,
    miceAlerts: true,
    sacredAlerts: true,
    semanticAlerts: true,
    consensusAlerts: true,
    criticalOnly: false,
    soundEnabled: true,
  });

  const { highRiskRelationships, activeWarnings } = useBetrayalPrediction();
  const { allAssessments } = useMICEAnalysis();
  const { criticalValues } = useSacredValues();

  // Generate alerts from data sources
  useEffect(() => {
    const newAlerts: Alert[] = [];

    // Betrayal alerts
    if (alertSettings.betrayalAlerts) {
      highRiskRelationships.forEach((rel) => {
        const profile = rel.profiles as { full_name?: string; id?: string } | null;
        newAlerts.push({
          id: `betrayal-${rel.id}`,
          type: 'betrayal',
          severity: (rel.defection_probability || 0) >= 0.8 ? 'critical' : 'high',
          title: 'High Defection Risk Detected',
          description: `${profile?.full_name || 'Unknown contact'} shows ${Math.round((rel.defection_probability || 0) * 100)}% betrayal probability`,
          profileId: profile?.id,
          profileName: profile?.full_name,
          timestamp: new Date(rel.updated_at),
          dismissed: false,
        });
      });

      activeWarnings.forEach((warn) => {
        const profile = warn.profiles as { full_name?: string; id?: string } | null;
        warn.warning_signs?.forEach((sign, idx) => {
          newAlerts.push({
            id: `warning-${warn.id}-${idx}`,
            type: 'betrayal',
            severity: 'medium',
            title: 'Active Warning Sign',
            description: `${profile?.full_name || 'Unknown'}: ${sign}`,
            profileId: profile?.id,
            profileName: profile?.full_name,
            timestamp: new Date(warn.updated_at),
            dismissed: false,
          });
        });
      });
    }

    // MICE vulnerability alerts
    if (alertSettings.miceAlerts && allAssessments) {
      allAssessments
        .filter((a: { money_vulnerability?: number | null }) => (a.money_vulnerability || 0) >= 0.7)
        .forEach((assessment: { id: string; money_vulnerability?: number | null; profiles?: { full_name?: string; id?: string } | null; updated_at: string }) => {
          const profile = assessment.profiles;
          newAlerts.push({
            id: `mice-${assessment.id}`,
            type: 'mice',
            severity: (assessment.money_vulnerability || 0) >= 0.85 ? 'critical' : 'high',
            title: 'Critical MICE Vulnerability',
            description: `${profile?.full_name || 'Unknown'} shows high vulnerability to recruitment approaches`,
            profileId: profile?.id,
            profileName: profile?.full_name,
            timestamp: new Date(assessment.updated_at),
            dismissed: false,
          });
        });
    }

    // Sacred values alerts
    if (alertSettings.sacredAlerts && criticalValues) {
      criticalValues.forEach((value: { id: string; domain?: string; profiles?: { full_name?: string; id?: string } | null; updated_at: string }) => {
        const profile = value.profiles;
        newAlerts.push({
          id: `sacred-${value.id}`,
          type: 'sacred',
          severity: 'medium',
          title: 'Critical Sacred Value Identified',
          description: `${profile?.full_name || 'Unknown'}: ${value.domain} is a protected value`,
          profileId: profile?.id,
          profileName: profile?.full_name,
          timestamp: new Date(value.updated_at),
          dismissed: false,
        });
      });
    }

    // Apply critical-only filter
    const filteredAlerts = alertSettings.criticalOnly 
      ? newAlerts.filter(a => a.severity === 'critical')
      : newAlerts;

    // Sort by severity and timestamp
    const sortedAlerts = filteredAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setAlerts(sortedAlerts);
  }, [highRiskRelationships, activeWarnings, allAssessments, criticalValues, alertSettings]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success('Alert dismissed');
  };

  const dismissAll = () => {
    setAlerts([]);
    toast.success('All alerts dismissed');
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <Card className="border-red-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5 text-red-400" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <CardTitle>Cognitive Warfare Alerts</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-400">
              {criticalCount} Critical
            </Badge>
            <Badge variant="outline" className="text-amber-400">
              {highCount} High
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time intelligence alerts for betrayal, MICE, and sacred value changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <Card className="bg-background/50 border-muted">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm mb-3">Alert Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Betrayal Alerts</span>
                  <Switch 
                    checked={alertSettings.betrayalAlerts}
                    onCheckedChange={(v) => setAlertSettings(prev => ({ ...prev, betrayalAlerts: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MICE Alerts</span>
                  <Switch 
                    checked={alertSettings.miceAlerts}
                    onCheckedChange={(v) => setAlertSettings(prev => ({ ...prev, miceAlerts: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sacred Values</span>
                  <Switch 
                    checked={alertSettings.sacredAlerts}
                    onCheckedChange={(v) => setAlertSettings(prev => ({ ...prev, sacredAlerts: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critical Only</span>
                  <Switch 
                    checked={alertSettings.criticalOnly}
                    onCheckedChange={(v) => setAlertSettings(prev => ({ ...prev, criticalOnly: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active alerts</p>
            <p className="text-xs mt-1">Monitoring all cognitive warfare indicators</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={dismissAll}>
                Dismiss All
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const severityConfig = SEVERITY_CONFIG[alert.severity];
                  const typeConfig = TYPE_CONFIG[alert.type];
                  const SeverityIcon = severityConfig.icon;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card 
                      key={alert.id} 
                      className={`${severityConfig.color} border ${severityConfig.pulse ? 'animate-pulse' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <SeverityIcon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{alert.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  <TypeIcon className={`h-3 w-3 mr-1 ${typeConfig.color}`} />
                                  {typeConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm opacity-90">{alert.description}</p>
                              <div className="flex items-center gap-3 text-xs opacity-70">
                                <span>{alert.timestamp.toLocaleString()}</span>
                                {alert.profileName && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 text-xs"
                                    onClick={() => {
                                      // Navigate to profile
                                      window.location.href = `/contacts/${alert.profileId}`;
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Profile
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
