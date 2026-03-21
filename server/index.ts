import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = [
          "https://fandom-forge.vercel.app",
          "https://fandomforge.vercel.app",
          process.env.FRONTEND_URL,
          "http://localhost:5173",
          "http://localhost:3000",
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed"), false);
        }
      }
    : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ── RATE LIMITERS ────────────────────────────────────────────────────

// Auth endpoints — strict: 10 attempts per 15 minutes
// Protects against brute-force login and mass registration attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many attempts, please try again in 15 minutes" },
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false,
});

// Payment endpoints — moderate: 20 requests per 15 minutes
// Prevents payment abuse / card testing attacks
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many payment requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload endpoints — moderate: 30 requests per hour
// Prevents storage abuse from mass uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { error: "Upload limit reached, please try again in an hour" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API — relaxed: 300 requests per minute
// Catches runaway clients / scrapers without affecting normal use
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === "/api/health",
});

// ── Apply rate limiters BEFORE body parsing ───────────────────────────
// Auth — most restrictive, applied first
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Payments
app.use("/api/payments", paymentLimiter);

// Uploads
app.use("/api/videos/upload", uploadLimiter);
app.use("/api/videos", (req, res, next) => {
  // Only limit POST (create) not GET (browse)
  if (req.method === "POST") return uploadLimiter(req, res, next);
  next();
});

// General API — applied to all remaining /api routes
app.use("/api", generalApiLimiter);

// ── BODY PARSING ──────────────────────────────────────────────────────
// Standard payload limits - large files upload directly to Cloudinary
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── REQUEST LOGGING ───────────────────────────────────────────────────
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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ── ROUTES ────────────────────────────────────────────────────────────
(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware — must be after all routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Handle rate limit errors gracefully
    if (err.status === 429) {
      return res.status(429).json({
        error: err.message || "Too many requests",
        status: 429,
      });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("API Error:", {
      status,
      message,
      stack: err.stack,
    });

    if (res.headersSent) {
      return;
    }

    res.status(status).json({
      error: message,
      status,
    });
  });

  // Catch-all 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Setup Vite in development, serve static in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve on the port specified in PORT env variable
  // Other ports are firewalled. Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();