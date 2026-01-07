import { ReactNode } from 'react';
import { useClearance, ClearanceLevel, AppRole } from '@/hooks/useClearance';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface ClearanceGateProps {
  children: ReactNode;
  requiredClearance?: ClearanceLevel;
  requiredRole?: AppRole;
  requiredCompartment?: string;
  resourceType?: string;
  resourceId?: string;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function ClearanceGate({
  children,
  requiredClearance,
  requiredRole,
  requiredCompartment,
  resourceType,
  resourceId,
  fallback,
  showAccessDenied = true,
}: ClearanceGateProps) {
  const { hasClearance, hasRole, hasCompartment, currentClearance, currentRole, CLEARANCE_LABELS } = useClearance();
  const { logEvent } = useAuditLog();

  // Check all requirements
  const clearanceOk = !requiredClearance || hasClearance(requiredClearance);
  const roleOk = !requiredRole || hasRole(requiredRole);
  const compartmentOk = !requiredCompartment || hasCompartment(requiredCompartment);
  
  const hasAccess = clearanceOk && roleOk && compartmentOk;

  // Log access attempt if resource is specified
  if (resourceType && resourceId) {
    logEvent({
      action_type: hasAccess ? 'access_granted' : 'access_denied',
      resource_type: resourceType,
      resource_id: resourceId,
      data_classification: requiredClearance,
      metadata: {
        required_clearance: requiredClearance,
        required_role: requiredRole,
        required_compartment: requiredCompartment,
        user_clearance: currentClearance,
        user_role: currentRole,
      },
    });
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showAccessDenied) {
    return null;
  }

  // Build denial reason
  const denialReasons: string[] = [];
  if (!clearanceOk) {
    denialReasons.push(
      `Requires ${CLEARANCE_LABELS[requiredClearance!]} clearance (you have ${CLEARANCE_LABELS[currentClearance]})`
    );
  }
  if (!roleOk) {
    denialReasons.push(`Requires ${requiredRole} role (you are ${currentRole})`);
  }
  if (!compartmentOk) {
    denialReasons.push(`Requires ${requiredCompartment} compartment access`);
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Lock className="h-5 w-5" />
          Access Denied
        </CardTitle>
        <CardDescription>
          You do not have sufficient permissions to view this content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {denialReasons.map((reason, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Contact your supervisor to request access elevation.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// HOC version for wrapping entire components
export function withClearance<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ClearanceGateProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ClearanceGate {...options}>
        <Component {...props} />
      </ClearanceGate>
    );
  };
}
