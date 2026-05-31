import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Radio, Mic, Smartphone, Activity, Shield,
  CheckCircle2, XCircle, AlertCircle, ChevronRight,
  Settings, Zap, Clock, Users, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useBackgroundLocation } from '@/hooks/useBackgroundLocation';
import { useContextEngine } from '@/hooks/useContextEngine';
import { AppLayout } from '@/components/AppLayout';
import { IntegrationSetupBanner } from '@/components/shared/IntegrationSetupBanner';

interface EcosystemService {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastActivity?: string;
  stats?: { label: string; value: string | number }[];
}

export default function MobileEcosystemPage() {
  const navigate = useNavigate();
  const { isTracking, geofences, nearbyContacts, startTracking, stopTracking } = useBackgroundLocation();
  const { currentContext, confidence, isMonitoring, startMonitoring, stopMonitoring } = useContextEngine();
  
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(false);

  const services: EcosystemService[] = [
    {
      id: 'location',
      name: 'Location Tracking',
      description: 'Background GPS with geofence monitoring',
      icon: MapPin,
      status: isTracking ? 'active' : 'inactive',
      stats: [
        { label: 'Geofences', value: geofences.length },
        { label: 'Updates', value: isTracking ? 'Live' : 'Paused' }
      ]
    },
    {
      id: 'bluetooth',
      name: 'Bluetooth Proximity',
      description: 'Detect nearby registered devices',
      icon: Radio,
      status: bluetoothEnabled ? 'active' : 'inactive',
      stats: [
        { label: 'Nearby', value: nearbyContacts.length },
        { label: 'Devices', value: 0 }
      ]
    },
    {
      id: 'ambient',
      name: 'Ambient Intelligence',
      description: 'Background speech recognition & context',
      icon: Mic,
      status: ambientEnabled ? 'active' : 'inactive',
      stats: [
        { label: 'Wake Word', value: 'Hey Intel' },
        { label: 'Status', value: ambientEnabled ? 'Listening' : 'Off' }
      ]
    },
    {
      id: 'context',
      name: 'Context Engine',
      description: 'Multi-sensor context awareness',
      icon: Activity,
      status: isMonitoring ? 'active' : 'inactive',
      stats: [
        { label: 'Context', value: currentContext },
        { label: 'Confidence', value: `${Math.round(confidence * 100)}%` }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400';
      case 'inactive': return 'text-muted-foreground';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-amber-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle2;
      case 'inactive': return XCircle;
      case 'error': return AlertCircle;
      case 'pending': return RefreshCw;
      default: return XCircle;
    }
  };

  const handleToggleService = async (serviceId: string) => {
    switch (serviceId) {
      case 'location':
        if (isTracking) {
          stopTracking();
        } else {
          await startTracking();
        }
        break;
      case 'bluetooth':
        setBluetoothEnabled(!bluetoothEnabled);
        break;
      case 'ambient':
        setAmbientEnabled(!ambientEnabled);
        break;
      case 'context':
        if (isMonitoring) {
          stopMonitoring();
        } else {
          await startMonitoring();
        }
        break;
    }
  };

  // Calculate overall ecosystem progress
  const activeServices = services.filter(s => s.status === 'active').length;
  const ecosystemProgress = (activeServices / services.length) * 100;

  return (
    <AppLayout title="Mobile Ecosystem">
      <div className="space-y-6">

        {localStorage.getItem('setup-banner-android-sync') !== 'dismissed' && (
          <IntegrationSetupBanner
            title="Samsung Galaxy S26 Ultra Detected"
            description="Sync your SMS, WhatsApp, Instagram and LinkedIn data from your Android device."
            linkTo="/android-sync"
            linkLabel="Open Android Data Sync"
            storageKey="setup-banner-android-sync"
            icon={Smartphone}
            variant="info"
          />
        )}

        {/* Ecosystem Progress */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Ecosystem Status</CardTitle>
              <Badge variant={ecosystemProgress === 100 ? 'default' : 'secondary'}>
                {activeServices}/{services.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={ecosystemProgress} className="h-2 mb-3" />
            <p className="text-sm text-muted-foreground">
              {ecosystemProgress === 100 
                ? 'All intelligence services are active'
                : `Enable more services to maximize intelligence gathering`}
            </p>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service, index) => {
            const StatusIcon = getStatusIcon(service.status);
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "border-border/50 transition-all",
                  service.status === 'active' && "border-emerald-500/30 bg-emerald-500/5"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          service.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          <service.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{service.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-1">
                            <StatusIcon className={cn("h-3 w-3", getStatusColor(service.status))} />
                            <span className={cn("text-xs capitalize", getStatusColor(service.status))}>
                              {service.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={service.status === 'active'}
                        onCheckedChange={() => handleToggleService(service.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {service.description}
                    </p>
                    {service.stats && (
                      <div className="flex items-center gap-4">
                        {service.stats.map(stat => (
                          <div key={stat.label} className="text-center">
                            <div className="text-lg font-semibold">{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/settings')}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure Geofences
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/contacts')}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Device Links
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/security')}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy Settings
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Enable services to start collecting intelligence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
