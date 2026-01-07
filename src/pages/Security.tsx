import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClearanceManager } from '@/components/security/ClearanceManager';
import { ClearanceGate } from '@/components/security/ClearanceGate';
import { ImmutableAuditViewer } from '@/components/security/ImmutableAuditViewer';
import { EncryptionStatusPanel } from '@/components/security/EncryptionStatusPanel';
import { SecurityAlertsWidget } from '@/components/security/SecurityAlertsWidget';
import { ThreatMonitorWidget } from '@/components/security/ThreatMonitorWidget';
import { CrossReferenceExplorer } from '@/components/intelligence/CrossReferenceExplorer';
import { ForensicTimeline } from '@/components/intelligence/ForensicTimeline';
import { CounterSurveillancePanel } from '@/components/security/CounterSurveillancePanel';
import { KeyRotationPanel } from '@/components/security/KeyRotationPanel';
import { AdminBootstrap } from '@/components/security/AdminBootstrap';
import { useClearance } from '@/hooks/useClearance';
import { Shield, Lock, Eye, Network, AlertTriangle, Users, Clock, Radar, Key } from 'lucide-react';

export default function Security() {
  const { currentClearance, currentRole, CLEARANCE_LABELS, isAdmin } = useClearance();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Security Center
            </h1>
            <p className="text-muted-foreground">
              Agency-grade security management, audit trails, and intelligence tools
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Your clearance:</span>
            <span className="font-semibold">{CLEARANCE_LABELS[currentClearance]}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Role:</span>
            <span className="font-semibold capitalize">{currentRole}</span>
          </div>
        </div>

        {/* Admin Bootstrap - only show if not admin */}
        {!isAdmin && <AdminBootstrap />}

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clearances" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clearances
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="encryption" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Encryption
            </TabsTrigger>
            <TabsTrigger value="crossref" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Cross-Reference
            </TabsTrigger>
            <TabsTrigger value="forensic" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Forensic Timeline
            </TabsTrigger>
            <TabsTrigger value="countersurv" className="flex items-center gap-2">
              <Radar className="h-4 w-4" />
              Counter-Surveillance
            </TabsTrigger>
            <TabsTrigger value="keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Key Management
            </TabsTrigger>
          </TabsList>

          {/* Security Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SecurityAlertsWidget />
              <ThreatMonitorWidget />
            </div>
          </TabsContent>

          {/* Clearance Management */}
          <TabsContent value="clearances">
            <ClearanceGate requiredRole="admin" showAccessDenied>
              <ClearanceManager />
            </ClearanceGate>
          </TabsContent>

          {/* Immutable Audit Trail */}
          <TabsContent value="audit">
            <ClearanceGate requiredClearance="secret" showAccessDenied>
              <ImmutableAuditViewer />
            </ClearanceGate>
          </TabsContent>

          {/* Encryption Status */}
          <TabsContent value="encryption">
            <ClearanceGate requiredClearance="confidential" showAccessDenied>
              <EncryptionStatusPanel />
            </ClearanceGate>
          </TabsContent>

          {/* Cross-Reference Intelligence */}
          <TabsContent value="crossref">
            <ClearanceGate requiredClearance="confidential" showAccessDenied>
              <CrossReferenceExplorer />
            </ClearanceGate>
          </TabsContent>

          {/* Forensic Timeline */}
          <TabsContent value="forensic">
            <ClearanceGate requiredClearance="secret" showAccessDenied>
              <ForensicTimeline />
            </ClearanceGate>
          </TabsContent>

          {/* Counter-Surveillance */}
          <TabsContent value="countersurv">
            <ClearanceGate requiredClearance="top_secret" showAccessDenied>
              <CounterSurveillancePanel />
            </ClearanceGate>
          </TabsContent>

          {/* Key Management */}
          <TabsContent value="keys">
            <ClearanceGate requiredRole="admin" showAccessDenied>
              <KeyRotationPanel />
            </ClearanceGate>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
