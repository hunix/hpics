// Health Check System - Real-time monitoring of system components
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latency?: number;
  lastChecked: Date;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: HealthStatus;
  components: {
    network: ComponentHealth;
    database: ComponentHealth;
    auth: ComponentHealth;
    storage: ComponentHealth;
    edgeFunctions: ComponentHealth;
  };
  lastFullCheck: Date;
  checksPerformed: number;
}

export interface HealthCheckOptions {
  autoCheck?: boolean;
  intervalMs?: number;
  onStatusChange?: (health: SystemHealth) => void;
  components?: Array<'network' | 'database' | 'auth' | 'storage' | 'edgeFunctions'>;
}

const DEFAULT_COMPONENTS: Array<'network' | 'database' | 'auth' | 'storage' | 'edgeFunctions'> = [
  'network',
  'database',
  'auth',
  'storage',
  'edgeFunctions',
];

function createDefaultComponentHealth(name: string): ComponentHealth {
  return {
    name,
    status: 'unknown',
    lastChecked: new Date(),
  };
}

export function useHealthCheck(options: HealthCheckOptions = {}) {
  const {
    autoCheck = true,
    intervalMs = 60000, // 1 minute
    onStatusChange,
    components = DEFAULT_COMPONENTS,
  } = options;

  const [health, setHealth] = useState<SystemHealth>({
    overall: 'unknown',
    components: {
      network: createDefaultComponentHealth('Network'),
      database: createDefaultComponentHealth('Database'),
      auth: createDefaultComponentHealth('Authentication'),
      storage: createDefaultComponentHealth('Storage'),
      edgeFunctions: createDefaultComponentHealth('Edge Functions'),
    },
    lastFullCheck: new Date(),
    checksPerformed: 0,
  });

  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousOverallRef = useRef<HealthStatus>('unknown');

  const checkNetwork = useCallback(async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      const online = navigator.onLine;
      if (!online) {
        return {
          name: 'Network',
          status: 'unhealthy',
          lastChecked: new Date(),
          error: 'No network connection',
        };
      }

      // Try to reach Supabase
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const latency = Date.now() - startTime;
      
      return {
        name: 'Network',
        status: response.ok ? (latency < 1000 ? 'healthy' : 'degraded') : 'unhealthy',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Network',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Network check failed',
      };
    }
  }, []);

  const checkDatabase = useCallback(async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      // Simple query to check database connectivity
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        // RLS errors are okay - means DB is reachable
        if (error.code === 'PGRST116' || error.message.includes('permission')) {
          return {
            name: 'Database',
            status: latency < 500 ? 'healthy' : 'degraded',
            latency,
            lastChecked: new Date(),
          };
        }
        throw error;
      }

      return {
        name: 'Database',
        status: latency < 500 ? 'healthy' : 'degraded',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }, []);

  const checkAuth = useCallback(async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const latency = Date.now() - startTime;

      if (error) {
        return {
          name: 'Authentication',
          status: 'unhealthy',
          latency,
          lastChecked: new Date(),
          error: error.message,
        };
      }

      return {
        name: 'Authentication',
        status: 'healthy',
        latency,
        lastChecked: new Date(),
        details: {
          hasSession: !!session,
          userId: session?.user?.id,
        },
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Auth check failed',
      };
    }
  }, []);

  const checkStorage = useCallback(async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      const { error } = await supabase.storage.listBuckets();
      const latency = Date.now() - startTime;

      if (error) {
        // Permission errors are okay - means storage is reachable
        if (error.message.includes('permission') || error.message.includes('not authorized')) {
          return {
            name: 'Storage',
            status: latency < 500 ? 'healthy' : 'degraded',
            latency,
            lastChecked: new Date(),
          };
        }
        throw error;
      }

      return {
        name: 'Storage',
        status: latency < 500 ? 'healthy' : 'degraded',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Storage',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Storage check failed',
      };
    }
  }, []);

  const checkEdgeFunctions = useCallback(async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      // Try to invoke a health check endpoint if it exists
      const { error } = await supabase.functions.invoke('health-check', {
        body: { ping: true },
      });
      
      const latency = Date.now() - startTime;

      // If function doesn't exist, that's okay - edge functions infra is still working
      if (error && !error.message.includes('not found') && !error.message.includes('404')) {
        return {
          name: 'Edge Functions',
          status: 'degraded',
          latency,
          lastChecked: new Date(),
          error: error.message,
        };
      }

      return {
        name: 'Edge Functions',
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Edge Functions',
        status: 'degraded',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Edge function check failed',
      };
    }
  }, []);

  const calculateOverallHealth = useCallback((componentHealths: Record<string, ComponentHealth>): HealthStatus => {
    const statuses = Object.values(componentHealths).map(c => c.status);
    
    if (statuses.every(s => s === 'healthy')) return 'healthy';
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    return 'unknown';
  }, []);

  const runHealthCheck = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const checkPromises: Promise<[string, ComponentHealth]>[] = [];

      if (components.includes('network')) {
        checkPromises.push(checkNetwork().then(h => ['network', h] as [string, ComponentHealth]));
      }
      if (components.includes('database')) {
        checkPromises.push(checkDatabase().then(h => ['database', h] as [string, ComponentHealth]));
      }
      if (components.includes('auth')) {
        checkPromises.push(checkAuth().then(h => ['auth', h] as [string, ComponentHealth]));
      }
      if (components.includes('storage')) {
        checkPromises.push(checkStorage().then(h => ['storage', h] as [string, ComponentHealth]));
      }
      if (components.includes('edgeFunctions')) {
        checkPromises.push(checkEdgeFunctions().then(h => ['edgeFunctions', h] as [string, ComponentHealth]));
      }

      const results = await Promise.all(checkPromises);
      const componentHealths = Object.fromEntries(results);

      const newHealth: SystemHealth = {
        overall: calculateOverallHealth(componentHealths as Record<string, ComponentHealth>),
        components: {
          network: componentHealths.network || health.components.network,
          database: componentHealths.database || health.components.database,
          auth: componentHealths.auth || health.components.auth,
          storage: componentHealths.storage || health.components.storage,
          edgeFunctions: componentHealths.edgeFunctions || health.components.edgeFunctions,
        },
        lastFullCheck: new Date(),
        checksPerformed: health.checksPerformed + 1,
      };

      setHealth(newHealth);

      // Notify on status change
      if (previousOverallRef.current !== newHealth.overall) {
        previousOverallRef.current = newHealth.overall;
        onStatusChange?.(newHealth);
      }

      return newHealth;
    } finally {
      setIsChecking(false);
    }
  }, [
    isChecking,
    components,
    checkNetwork,
    checkDatabase,
    checkAuth,
    checkStorage,
    checkEdgeFunctions,
    calculateOverallHealth,
    health,
    onStatusChange,
  ]);

  // Auto-check on mount and interval
  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    runHealthCheck();

    // Set up interval
    intervalRef.current = setInterval(runHealthCheck, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoCheck, intervalMs, runHealthCheck]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => runHealthCheck();
    const handleOffline = () => {
      setHealth(prev => ({
        ...prev,
        overall: 'unhealthy',
        components: {
          ...prev.components,
          network: {
            ...prev.components.network,
            status: 'unhealthy',
            error: 'Network offline',
            lastChecked: new Date(),
          },
        },
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runHealthCheck]);

  return {
    health,
    isChecking,
    runHealthCheck,
    isHealthy: health.overall === 'healthy',
    isDegraded: health.overall === 'degraded',
    isUnhealthy: health.overall === 'unhealthy',
  };
}
