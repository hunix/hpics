/**
 * Centralized logging utility for hpics application
 * - Development: All levels logged to console with colors
 * - Production: Only warn and error logged, errors tracked in database
 * - Test: All logging suppressed
 */

import { supabase } from '@/integrations/supabase/client';

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Persist error to database for production monitoring
 */
async function persistErrorToDatabase(
  message: string,
  data: unknown,
  context: LogContext
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    await supabase.from('error_logs').insert({
      user_id: userId || null,
      reference_id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      code: context.module || 'APPLICATION_ERROR',
      message: message,
      context: {
        data,
        logContext: context,
      } as unknown as Record<string, unknown>,
      severity: 'error',
      category: 'application',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null,
    } as never);
  } catch (dbError) {
    // Silently fail - don't create infinite error loops
    console.error('[Logger] Failed to persist error to database:', dbError);
  }
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();

    // In test mode, suppress all logging
    if (isTest) return;

    // In production, only log warnings and errors
    if (!isDev) {
      if (level === 'warn') {
        console.warn(`[${timestamp}] ${message}`, data);
      } else if (level === 'error') {
        console.error(`[${timestamp}] ${message}`, data);
        // Persist error to database for tracking
        persistErrorToDatabase(message, data, this.context);
      }
      return;
    }

    // Development logging with colors
    const styles = {
      debug: 'color: #888; font-weight: normal',
      info: 'color: #0066cc; font-weight: bold',
      warn: 'color: #ff9900; font-weight: bold',
      error: 'color: #cc0000; font-weight: bold',
    };

    console.log(
      `%c[${level.toUpperCase()}] ${message}`,
      styles[level],
      data !== undefined ? data : ''
    );
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data);
  }
}

export const logger = new Logger();

/**
 * Create a logger instance for a specific module
 * @param module Module name to include in all logs
 * @returns Logger instance with module context
 */
export const createModuleLogger = (module: string) => {
  const moduleLogger = new Logger();
  moduleLogger.setContext({ module });
  return moduleLogger;
};
