/**
 * Logger utility for Rylie AI platform
 * Provides consistent formatting for logs with severity levels and timestamp
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Set minimum log level based on environment
const LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO  // Only INFO and above in production
  : LogLevel.DEBUG; // All levels in development

/**
 * Formats a log message with timestamp and additional context
 */
function formatLogMessage(level: string, message: string, context?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (context) {
    try {
      formattedMessage += ` ${JSON.stringify(context)}`;
    } catch (e) {
      formattedMessage += ` [Context serialization failed]`;
    }
  }
  
  return formattedMessage;
}

/**
 * Logs a debug message (development only)
 */
export function debug(message: string, context?: Record<string, any>): void {
  if (LOG_LEVEL <= LogLevel.DEBUG) {
    console.debug(formatLogMessage('DEBUG', message, context));
  }
}

/**
 * Logs an info message
 */
export function info(message: string, context?: Record<string, any>): void {
  if (LOG_LEVEL <= LogLevel.INFO) {
    console.info(formatLogMessage('INFO', message, context));
  }
}

/**
 * Logs a warning message
 */
export function warn(message: string, context?: Record<string, any>): void {
  if (LOG_LEVEL <= LogLevel.WARN) {
    console.warn(formatLogMessage('WARN', message, context));
  }
}

/**
 * Logs an error message
 */
export function error(message: string, err?: Error, context?: Record<string, any>): void {
  if (LOG_LEVEL <= LogLevel.ERROR) {
    const errorContext = {
      ...(context || {}),
      ...(err ? {
        error: err.message,
        stack: err.stack
      } : {})
    };
    
    console.error(formatLogMessage('ERROR', message, errorContext));
  }
}

export default {
  debug,
  info,
  warn,
  error
};