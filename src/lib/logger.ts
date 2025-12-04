/**
 * Structured logging system
 * Can be easily integrated with external services like Sentry, DataDog, etc.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogContext {
  userId?: string
  email?: string
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

class Logger {
  private serviceName: string = 'tutusporta'
  private environment: string = process.env.NODE_ENV || 'development'

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      service: this.serviceName,
      environment: this.environment,
    })
  }

  /**
   * Write log to appropriate output
   */
  private write(entry: LogEntry) {
    const formatted = this.formatLog(entry)

    // In production, you could send to external service here
    // Example: sendToSentry(), sendToDataDog(), etc.

    switch (entry.level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      default:
        console.log(formatted)
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>) {
    if (this.environment === 'development') {
      this.write({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context,
        metadata,
      })
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      metadata,
    })
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      metadata,
    })
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      metadata,
    })
  }

  /**
   * Log fatal error (system-critical)
   */
  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      metadata,
    })
  }

  /**
   * Log API request
   */
  logRequest(method: string, path: string, context?: LogContext) {
    this.info('API Request', {
      ...context,
      method,
      path,
    })
  }

  /**
   * Log API response
   */
  logResponse(method: string, path: string, status: number, duration: number, context?: LogContext) {
    this.info('API Response', {
      ...context,
      method,
      path,
      status,
      duration,
    })
  }

  /**
   * Log authentication event
   */
  logAuth(event: 'login' | 'logout' | 'failed_login' | 'signup', context?: LogContext) {
    this.info(`Auth: ${event}`, context, { event })
  }

  /**
   * Log admin action
   */
  logAdminAction(action: string, targetUserId?: string, context?: LogContext, metadata?: Record<string, any>) {
    this.info(`Admin Action: ${action}`, {
      ...context,
      targetUserId,
    }, {
      ...metadata,
      action,
    })
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext, metadata?: Record<string, any>) {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN
    
    this.write({
      timestamp: new Date().toISOString(),
      level,
      message: `Security Event: ${event}`,
      context,
      metadata: {
        ...metadata,
        event,
        severity,
      },
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export as default for convenience
export default logger
