/**
 * Centralized logging utility for hpics application
 * - Development: All levels logged to console with colors
 * - Production: Only warn and error logged
 * - Test: All logging suppressed
 */

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
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
    const logData = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(data && { data }),
    };

    // In test mode, suppress all logging
    if (isTest) return;

    // In production, only log warnings and errors
    if (!isDev) {
      if (level === 'warn') {
        console.warn(`[${timestamp}] ${message}`, data);
      } else if (level === 'error') {
        console.error(`[${timestamp}] ${message}`, data);
        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
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
