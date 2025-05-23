import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rate-limit';
import { dynamicRateLimiter, premiumFeatureLimiter } from './middleware/tiered-rate-limit';
import logger from "./utils/logger";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import monitoringRoutes from './routes/monitoring-routes';
import { monitoring } from './services/monitoring';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET || 'rylie-secure-secret'));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Security headers
app.use((req, res, next) => {
  // Security headers for enterprise-level protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Only apply HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;");

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Use our structured logger instead of basic logging
      const context = {
        method: req.method,
        path: path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      // Add response data to logs for non-success status codes or in development
      if (res.statusCode >= 400 || process.env.NODE_ENV !== 'production') {
        if (capturedJsonResponse) {
          context['response'] = capturedJsonResponse;
        }
      }

      // Log with appropriate level based on status code
      if (res.statusCode >= 500) {
        logger.error(`API error: ${req.method} ${path}`, null, context);
      } else if (res.statusCode >= 400) {
        logger.warn(`API warning: ${req.method} ${path}`, context);
      } else {
        logger.info(`API request: ${req.method} ${path}`, context);
      }
    }
  });

  next();
});

// Add monitoring routes before other routes
app.use('/api/metrics', monitoringRoutes);

// Track all requests
app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    monitoring.trackRequest(req.path, duration, res.statusCode);
  });
  next();
});

(async () => {
  // Initialize queue consumers with in-memory fallback
  try {
    const { initializeQueueConsumers } = await import('./services/queue-consumers');
    await initializeQueueConsumers();
    logger.info('Queue consumers successfully initialized');
  } catch (error) {
    logger.warn('Failed to initialize queue consumers, will use in-memory fallback', error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // In production, don't expose detailed error messages
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage = isProduction && status === 500 
      ? 'An unexpected error occurred. Our team has been notified.'
      : message;

    // Log the full error details for debugging
    if (status >= 500) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack || err}`);
    } else {
      console.warn(`[WARN] ${new Date().toISOString()} - ${err.message || 'Unknown error'}`);
    }

    res.status(status).json({ 
      message: responseMessage,
      success: false,
      code: isProduction ? undefined : err.code
    });

    // Only re-throw in development for better debugging
    if (!isProduction) {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000

  // Implement graceful shutdown for production scaling
  const handleShutdown = () => {
    console.log('Shutting down application gracefully...');

    // Import necessary shutdown functions
    Promise.all([
      import('./db').then(({ closeDbConnections }) => closeDbConnections()),
      import('./utils/cache').then(({ shutdownCache }) => shutdownCache())
    ]).then(() => {
      console.log('All resources released, shutting down cleanly');

      // Close HTTP server with a timeout
      server.close((err) => {
        if (err) {
          console.error('Error closing HTTP server:', err);
          return;
        }
        console.log('HTTP server closed successfully');
        process.exit(0);
      });
    }).catch((err) => {
      console.error('Error during resource cleanup:', err);
      process.exit(1);
    });

    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Setup signal handlers for graceful shutdown
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);

  // Add cache statistics to health endpoint
  app.get('/api/health/cache', async (req, res) => {
    const { getCacheStats } = await import('./utils/cache');
    res.json(getCacheStats());
  });
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();