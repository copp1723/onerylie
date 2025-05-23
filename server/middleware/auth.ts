import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { Session } from "express-session";
import { User } from "@shared/schema";

// Extend the Session interface to include our user type
declare module "express-session" {
  interface Session {
    userId?: number;
    user?: User;
    role?: string;
  }
}

// Define type for authenticated request
export interface AuthenticatedRequest extends Request {
  dealershipId?: number;
  apiKey?: string;
}

// Middleware to check for valid API key
export async function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({
      message: "Authentication failed: API key is required",
    });
  }

  try {
    const validApiKey = await storage.verifyApiKey(apiKey);

    if (!validApiKey) {
      return res.status(401).json({
        message: "Authentication failed: Invalid API key",
      });
    }

    // Add dealership ID to request for use in route handlers
    req.dealershipId = validApiKey.dealershipId;
    req.apiKey = apiKey;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      message: "Authentication error occurred",
    });
  }
}

// Middleware for session authentication (for dashboard access)
export function sessionAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: "Authentication failed: Please log in",
    });
  }

  next();
}

// Role-based access control middleware
export function requireRole(roles: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await storage.getUser(req.session?.userId);
    
    if (!user || !user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Access denied: Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

// Admin only middleware (shorthand)
export const adminOnly = requireRole('admin');

// Manager only middleware
export const managerOnly = requireRole(['admin', 'manager']);

// Verified user middleware
export function requireVerified(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  
  if (!user || !user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email first",
    });
  }

  next();
}
