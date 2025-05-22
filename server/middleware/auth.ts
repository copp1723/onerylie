import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

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

// Middleware for admin-only routes
export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session || !req.session.role !== "admin") {
    return res.status(403).json({
      message: "Access denied: Admin privileges required",
    });
  }

  next();
}
