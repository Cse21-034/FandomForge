import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken, JWTPayload } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) { res.status(401).json({ error: "No token provided" }); return; }

  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: "Invalid or expired token" }); return; }

  req.user = decoded;
  next();
}

export function requireRole(...roles: Array<"consumer" | "creator" | "admin">) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // SECURITY: For admin routes, always verify against DB
    // This prevents a stale token with role:admin from working
    // after the role has been revoked in the DB
    if (roles.includes("admin")) {
      try {
        const result = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, req.user.userId))
          .limit(1);

        const dbRole = result[0]?.role;
        if (dbRole !== "admin") {
          res.status(403).json({ error: "Forbidden" });
          return;
        }
        next();
        return;
      } catch {
        res.status(500).json({ error: "Authorization check failed" });
        return;
      }
    }

    // For non-admin roles, token is sufficient
    if (!roles.includes(req.user.role as any)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
}