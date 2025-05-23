/**
 * Enhanced Logger utility for Rylie AI platform
 * Provides consistent formatting for logs with severity levels, timestamp, and log rotation
 */
import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define log levels with custom colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Define format for console logs (colorful and detailed)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message} ${
      Object.keys(info).filter(key => !['timestamp', 'level', 'message'].includes(key)).length > 0 
        ? JSON.stringify(info, (key, value) => {
            if (key === 'level' || key === 'timestamp' || key === 'message') return undefined;
            return value;
          }, 2)
        : ''
    }`
  )
);

// Define format for file logs (JSON for easier parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Configure rotating file transports
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, '%DATE%-application.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: fileFormat,
});

// Configure error-specific rotating file transport
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Keep error logs longer (30 days)
  level: 'error',
  format: fileFormat,
});

// Add lifecycle events for log rotation
fileRotateTransport.on('rotate', function(oldFilename, newFilename) {
  console.log(`Log rotated from ${oldFilename} to ${newFilename}`);
});

// Create the Winston logger with all transports
const winstonLogger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console transport for development visibility
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Rotating file transports for production logging
    fileRotateTransport,
    errorFileRotateTransport
  ],
  // Don't exit on uncaught exceptions, log them instead
  exitOnError: false
});

// For production, disable console logging if needed
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_CONSOLE_LOGS === 'true') {
  winstonLogger.transports.forEach((transport) => {
    if (transport instanceof winston.transports.Console) {
      transport.silent = true;
    }
  });
}

/**
 * Logs a debug message (development only)
 */
export function debug(message: string, context?: Record<string, any>): void {
  winstonLogger.debug(message, context);
}

/**
 * Logs an info message
 */
export function info(message: string, context?: Record<string, any>): void {
  winstonLogger.info(message, context);
}

/**
 * Logs a warning message
 */
export function warn(message: string, context?: Record<string, any>): void {
  winstonLogger.warn(message, context);
}

/**
 * Logs an error message
 */
export function error(message: string, err?: Error, context?: Record<string, any>): void {
  const errorContext = {
    ...(context || {}),
    ...(err ? {
      error: err.message,
      stack: err.stack
    } : {})
  };
  
  winstonLogger.error(message, errorContext);
}

/**
 * Logs HTTP requests in a structured format
 */
export function http(message: string, context?: Record<string, any>): void {
  winstonLogger.http(message, context);
}

/**
 * Create a request logger middleware
 */
export function requestLogger() {
  return (req: Request, res: Response, next: Function) => {
    // Skip logging for health checks to reduce noise
    if (req.path === '/api/health' || req.path === '/health') {
      return next();
    }
    
    const start = Date.now();
    const logContext: Record<string, any> = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    // Add user information if authenticated
    if (req.user) {
      logContext.userId = (req.user as any).id || 'unknown';
    }
    
    // Add API key information if present
    if ((req as any).apiKey) {
      logContext.apiKeyId = (req as any).apiKey.id;
      logContext.dealershipId = (req as any).apiKey.dealershipId;
    }
    
    // Log when the request finishes
    res.on('finish', () => {
      logContext.statusCode = res.statusCode;
      logContext.duration = `${Date.now() - start}ms`;
      
      // Include response if error status code (only in development)
      if (res.statusCode >= 400 && process.env.NODE_ENV === 'development') {
        logContext.response = res.locals.responseBody;
      }
      
      http(`API request: ${req.method} ${req.path}`, logContext);
    });
    
    next();
  };
}

/**
 * Capture response body for error logging
 */
export function responseCapture() {
  return (req: Request, res: Response, next: Function) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      res.locals.responseBody = body;
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Create a stream object for integrating with Express/Morgan
 */
export const logStream = {
  write: (message: string) => {
    http(message.trim());
  },
};

/**
 * Shut down logging gracefully
 */
export function shutdownLogger(): Promise<void> {
  return new Promise<void>((resolve) => {
    winstonLogger.on('finish', () => {
      resolve();
    });
    winstonLogger.end();
  });
}

export default {
  debug,
  info,
  warn,
  error,
  http,
  requestLogger,
  responseCapture,
  shutdownLogger,
  logStream
};