// Session Timeout Hook - Inactivity timeout with warning
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SessionTimeoutOptions {
  timeoutMs?: number;           // Total timeout (default: 30 min)
  warningBeforeMs?: number;     // Warning before timeout (default: 5 min)
  onTimeout?: () => void;       // Called when session times out
  onWarning?: () => void;       // Called when warning should show
  onActivity?: () => void;      // Called on user activity
  activityEvents?: string[];    // Events to track (default: mouse, keyboard, touch)
  enabled?: boolean;            // Enable/disable timeout
}

interface SessionTimeoutState {
  isWarningShown: boolean;
  timeUntilTimeout: number;
  lastActivityAt: number;
  isTimedOut: boolean;
}

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes
const UPDATE_INTERVAL_MS = 1000; // Update every second

const DEFAULT_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

export function useSessionTimeout({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningBeforeMs = DEFAULT_WARNING_BEFORE_MS,
  onTimeout,
  onWarning,
  onActivity,
  activityEvents = DEFAULT_ACTIVITY_EVENTS,
  enabled = true,
}: SessionTimeoutOptions = {}) {
  const { user, signOut } = useAuth();
  
  const [state, setState] = useState<SessionTimeoutState>({
    isWarningShown: false,
    timeUntilTimeout: timeoutMs,
    lastActivityAt: Date.now(),
    isTimedOut: false,
  });
  
  const warningShownRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activity timer
  const resetActivity = useCallback(() => {
    if (!enabled) return;
    
    const now = Date.now();
    setState(prev => ({
      ...prev,
      lastActivityAt: now,
      timeUntilTimeout: timeoutMs,
      isWarningShown: false,
    }));
    warningShownRef.current = false;
    
    onActivity?.();
  }, [enabled, timeoutMs, onActivity]);

  // Extend session (call this when user clicks "Stay logged in")
  const extendSession = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  // Force logout
  const forceLogout = useCallback(async () => {
    setState(prev => ({ ...prev, isTimedOut: true }));
    
    if (onTimeout) {
      onTimeout();
    } else {
      // Default behavior: sign out
      await signOut?.();
    }
  }, [onTimeout, signOut]);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    const elapsed = Date.now() - state.lastActivityAt;
    return Math.max(0, timeoutMs - elapsed);
  }, [state.lastActivityAt, timeoutMs]);

  // Handle activity events
  useEffect(() => {
    if (!enabled || !user) return;

    const handleActivity = () => {
      // Throttle activity updates to prevent excessive rerenders
      const now = Date.now();
      if (now - state.lastActivityAt > 1000) {
        resetActivity();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, user, state.lastActivityAt, activityEvents, resetActivity]);

  // Timer for checking timeout
  useEffect(() => {
    if (!enabled || !user) return;

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Update interval
    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      
      setState(prev => ({
        ...prev,
        timeUntilTimeout: remaining,
      }));

      // Check for warning threshold
      if (remaining <= warningBeforeMs && remaining > 0 && !warningShownRef.current) {
        warningShownRef.current = true;
        setState(prev => ({ ...prev, isWarningShown: true }));
        onWarning?.();
      }

      // Check for timeout
      if (remaining <= 0) {
        forceLogout();
      }
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, user, calculateTimeRemaining, warningBeforeMs, onWarning, forceLogout]);

  // Format time remaining
  const formatTimeRemaining = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, []);

  return {
    state,
    extendSession,
    forceLogout,
    resetActivity,
    timeRemaining: state.timeUntilTimeout,
    formattedTimeRemaining: formatTimeRemaining(state.timeUntilTimeout),
    isWarningShown: state.isWarningShown,
    isTimedOut: state.isTimedOut,
    isActive: enabled && !!user,
  };
}

// Session timeout warning dialog component helper
export interface SessionTimeoutDialogProps {
  isOpen: boolean;
  timeRemaining: string;
  onExtend: () => void;
  onLogout: () => void;
}
