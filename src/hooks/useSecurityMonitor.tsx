import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SecurityEvent {
  type: 'anomaly' | 'threat' | 'warning' | 'info';
  category: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface AnomalyDetectionConfig {
  maxRequestsPerMinute: number;
  maxFailedLogins: number;
  maxBulkOperations: number;
  sensitiveDataAccessThreshold: number;
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  maxRequestsPerMinute: 100,
  maxFailedLogins: 5,
  maxBulkOperations: 20,
  sensitiveDataAccessThreshold: 30,
};

export function useSecurityMonitor(config: Partial<AnomalyDetectionConfig> = {}) {
  const { user } = useAuth();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Track events for anomaly detection
  const eventHistory = useRef<SecurityEvent[]>([]);
  const requestCounts = useRef<Map<string, number>>(new Map());
  const failedLoginAttempts = useRef<number>(0);

  // Log security event
  const logEvent = useCallback((event: Omit<SecurityEvent, 'timestamp'>) => {
    const fullEvent = { ...event, timestamp: new Date() };
    eventHistory.current.push(fullEvent);

    // Keep only last 1000 events
    if (eventHistory.current.length > 1000) {
      eventHistory.current = eventHistory.current.slice(-1000);
    }

    // Log to console with appropriate level
    const logFn = event.type === 'threat' ? console.error : 
                  event.type === 'anomaly' ? console.warn : 
                  console.log;
    logFn(`[SECURITY:${event.type.toUpperCase()}]`, event);

    // Alert on threats
    if (event.type === 'threat') {
      toast.error(`Security Alert: ${event.description}`, {
        duration: 10000,
      });
    }

    return fullEvent;
  }, []);

  // Track request patterns for anomaly detection
  const trackRequest = useCallback((endpoint: string) => {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${endpoint}:${minute}`;
    
    const count = (requestCounts.current.get(key) || 0) + 1;
    requestCounts.current.set(key, count);

    // Clean old entries
    for (const [k] of requestCounts.current) {
      const [, timeStr] = k.split(':');
      if (parseInt(timeStr) < minute - 5) {
        requestCounts.current.delete(k);
      }
    }

    // Check for anomaly
    if (count > mergedConfig.maxRequestsPerMinute) {
      logEvent({
        type: 'anomaly',
        category: 'rate_limit',
        description: `Unusual request rate detected for ${endpoint}`,
        metadata: { endpoint, count, threshold: mergedConfig.maxRequestsPerMinute },
      });
      return false;
    }

    return true;
  }, [mergedConfig.maxRequestsPerMinute, logEvent]);

  // Detect bulk operation attempts
  const trackBulkOperation = useCallback((operation: string, count: number) => {
    if (count > mergedConfig.maxBulkOperations) {
      logEvent({
        type: 'warning',
        category: 'bulk_operation',
        description: `Large bulk operation detected: ${operation} with ${count} items`,
        metadata: { operation, count, threshold: mergedConfig.maxBulkOperations },
      });
    }
    return true;
  }, [mergedConfig.maxBulkOperations, logEvent]);

  // Track failed login attempts
  const trackFailedLogin = useCallback(() => {
    failedLoginAttempts.current++;
    
    if (failedLoginAttempts.current >= mergedConfig.maxFailedLogins) {
      logEvent({
        type: 'threat',
        category: 'brute_force',
        description: 'Multiple failed login attempts detected',
        metadata: { 
          attempts: failedLoginAttempts.current,
          threshold: mergedConfig.maxFailedLogins 
        },
      });
    }
  }, [mergedConfig.maxFailedLogins, logEvent]);

  // Reset failed login counter on successful login
  const resetFailedLogins = useCallback(() => {
    failedLoginAttempts.current = 0;
  }, []);

  // Session integrity check
  useEffect(() => {
    const checkSession = () => {
      if (!user) return;

      // Check for session anomalies
      const sessionStart = localStorage.getItem('session_start');
      const now = Date.now();

      if (!sessionStart) {
        localStorage.setItem('session_start', now.toString());
      } else {
        const duration = now - parseInt(sessionStart);
        const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours

        if (duration > maxSessionDuration) {
          logEvent({
            type: 'warning',
            category: 'session',
            description: 'Long-running session detected',
            metadata: { duration, threshold: maxSessionDuration },
          });
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user, logEvent]);

  // Get recent events for monitoring dashboard
  const getRecentEvents = useCallback((minutes: number = 60) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return eventHistory.current.filter(e => e.timestamp >= cutoff);
  }, []);

  // Get threat summary
  const getThreatSummary = useCallback(() => {
    const events = getRecentEvents(60);
    return {
      total: events.length,
      threats: events.filter(e => e.type === 'threat').length,
      anomalies: events.filter(e => e.type === 'anomaly').length,
      warnings: events.filter(e => e.type === 'warning').length,
    };
  }, [getRecentEvents]);

  return {
    logEvent,
    trackRequest,
    trackBulkOperation,
    trackFailedLogin,
    resetFailedLogins,
    getRecentEvents,
    getThreatSummary,
  };
}
