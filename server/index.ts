import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { apiLimiter } from "./middleware/rate-limit";
import logger from "./utils/logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

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

(async () => {
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
    
    // Import the closeDbConnections function from db.ts
    import('./db').then(({ closeDbConnections }) => {
      // Close database connections
      closeDbConnections().then(() => {
        console.log('All connections closed, shutting down');
        process.exit(0);
      }).catch((err) => {
        console.error('Error during shutdown:', err);
        process.exit(1);
      });
    });
    
    // Close HTTP server with a timeout
    server.close((err) => {
      if (err) {
        console.error('Error closing HTTP server:', err);
        return;
      }
      console.log('HTTP server closed successfully');
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
