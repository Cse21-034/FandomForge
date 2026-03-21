// server/auth.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set and at least 32 characters long");
}

const JWT_EXPIRY = "2h"; // Short expiry — was 7d

export interface JWTPayload {
  userId: string;
  email: string;
  role: "consumer" | "creator" | "admin";
}

// SECURITY: Each password gets its own unique random salt
// Old format was: pbkdf2(password, "salt", ...) — same salt for everyone
// New format: pbkdf2(password, randomSalt, ...) stored as "salt:hash"
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    // Handle both old format (no colon) and new format (salt:hash)
    if (stored.includes(":")) {
      // New format: salt:hash
      const [salt, hash] = stored.split(":");
      const hashVerify = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(hashVerify, "hex")
      );
    } else {
      // Legacy format: old hardcoded "salt" — migrate on next login
      const hashVerify = crypto
        .pbkdf2Sync(password, "salt", 1000, 64, "sha512")
        .toString("hex");
      return hashVerify === stored;
    }
  } catch {
    return false;
  }
}

// Auto-migrate old passwords to new format on successful login
export function needsRehash(stored: string): boolean {
  return !stored.includes(":");
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}