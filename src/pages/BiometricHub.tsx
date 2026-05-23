/**
 * Biometric Intelligence Hub
 * 
 * Unified interface for all biometric modalities:
 * Face, Voice, Gait, Signature, Keystroke, Body Language
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LocalMLDashboard } from '@/components/intelligence/LocalMLDashboard';
import { KeystrokeMonitor } from '@/components/biometrics/KeystrokeMonitor';
import { 
  Fingerprint, 
  Mic, 
  Footprints, 
  PenTool, 
  Keyboard, 
  Camera,
  Cpu,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useBiometricEnrollmentStats } from '@/hooks/biometrics/useBiometricEnrollmentStats';

const MODALITIES = [
  { id: 'face', label: 'Face', icon: Camera, color: 'text-blue-500' },
  { id: 'voice', label: 'Voice', icon: Mic, color: 'text-green-500' },
  { id: 'gait', label: 'Gait', icon: Footprints, color: 'text-orange-500' },
  { id: 'signature', label: 'Signature', icon: PenTool, color: 'text-purple-500' },
  { id: 'keystroke', label: 'Keystroke', icon: Keyboard, color: 'text-pink-500' },
  { id: 'fingerprint', label: 'Fingerprint', icon: Fingerprint, color: 'text-cyan-500' },
];

export default function BiometricHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: enrollmentStats } = useBiometricEnrollmentStats(MODALITIES.map(m => m.id));

  const overallProgress = enrollmentStats 
    ? Math.round(
        (Object.values(enrollmentStats).reduce((sum, s) => sum + (s.completed > 0 ? 1 : 0), 0) / 
        MODALITIES.length) * 100
      )
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Fingerprint className="h-8 w-8 text-primary" />
              Biometric Intelligence Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Multi-modal biometric enrollment, verification, and cross-modal fusion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {overallProgress}% Enrolled
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {MODALITIES.map((modality) => {
            const Icon = modality.icon;
            const stats = enrollmentStats?.[modality.id];
            const isEnrolled = stats && stats.completed > 0;
            
            return (
              <Card key={modality.id} className={isEnrolled ? 'border-primary/50' : ''}>
                <CardContent className="p-4 text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${modality.color}`} />
                  <p className="font-medium text-sm">{modality.label}</p>
                  <Badge 
                    variant={isEnrolled ? 'default' : 'secondary'} 
                    className="mt-2 text-xs"
                  >
                    {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="keystroke" className="gap-2">
              <Keyboard className="h-4 w-4" />
              Keystroke Monitor
            </TabsTrigger>
            <TabsTrigger value="ml-models" className="gap-2">
              <Cpu className="h-4 w-4" />
              Local ML Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Progress</CardTitle>
                  <CardDescription>
                    Complete enrollment across modalities for stronger identity verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-medium">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    {MODALITIES.map((modality) => {
                      const Icon = modality.icon;
                      const stats = enrollmentStats?.[modality.id];
                      const isEnrolled = stats && stats.completed > 0;
                      
                      return (
                        <div key={modality.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${modality.color}`} />
                            <span className="text-sm">{modality.label}</span>
                          </div>
                          <Badge variant={isEnrolled ? 'default' : 'outline'} className="text-xs">
                            {isEnrolled ? `${stats?.completed} samples` : 'Enroll'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cross-Modal Fusion</CardTitle>
                  <CardDescription>
                    Combined biometric confidence across enrolled modalities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Enroll 2+ modalities to enable fusion analysis</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keystroke" className="mt-6">
            <KeystrokeMonitor />
          </TabsContent>

          <TabsContent value="ml-models" className="mt-6">
            <LocalMLDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
