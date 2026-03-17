import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  generateToken,
  hashPassword,
  verifyPassword,
} from "./auth";
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest,
} from "./middleware";
import Stripe from "stripe";
import { v2 as cloudinary } from "cloudinary";
import { db } from "./db";
import { likes, shares, videoViews, videos as videosTable } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function registerRoutes(app: Express): Promise<Server> {

  // ==================== HEALTH ====================
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== AUTH ====================
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || "consumer",
      });
      if (role === "creator") {
        await storage.createCreator({
          userId: user.id,
          subscriptionPrice: "9.99",
        });
      }
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: role || "consumer",
      });
      return res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email, role: role || "consumer" },
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      const message = error instanceof Error ? error.message : "Registration failed";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      const user = await storage.getUserByEmail(email);
      if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
      if (!verifyPassword(password, user.password)) {
        res.status(401).json({ error: "Invalid credentials" }); return;
      }
      let role: "consumer" | "creator" | "admin" = "consumer";
      if (user.role) {
        role = user.role as "consumer" | "creator" | "admin";
      } else {
        const creator = await storage.getCreatorByUserId(user.id);
        if (creator) role = "creator";
      }
      const token = generateToken({ userId: user.id, email: user.email, role });
      res.json({ user: { id: user.id, username: user.username, email: user.email, role }, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) { res.status(404).json({ error: "User not found" }); return; }
      const creator = await storage.getCreatorByUserId(user.id);
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: req.user!.role,
        bio: user.bio,
        profileImage: user.profileImage,
        creator: creator ? {
          id: creator.id,
          subscriptionPrice: creator.subscriptionPrice,
          bannerImage: creator.bannerImage,
          totalSubscribers: creator.totalSubscribers,
          totalEarnings: creator.totalEarnings,
        } : null,
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ==================== CREATORS ====================
  app.get("/api/creators", async (_req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Get creators error:", error);
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  app.get("/api/creators/:id", async (req, res) => {
    try {
      const creator = await storage.getCreator(req.params.id);
      if (!creator) { res.status(404).json({ error: "Creator not found" }); return; }
      const user = await storage.getUser(creator.userId);
      const videos = await storage.getVideosByCreatorId(creator.id);
      res.json({
        ...creator,
        user: { username: user?.username, email: user?.email, bio: user?.bio, profileImage: user?.profileImage },
        videos,
      });
    } catch (error) {
      console.error("Get creator error:", error);
      res.status(500).json({ error: "Failed to fetch creator" });
    }
  });

  app.put("/api/creators/:id", authenticateToken, requireRole("creator"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { subscriptionPrice, bannerImage, bio } = req.body;
        const creator = await storage.getCreator(req.params.id);
        if (!creator) { res.status(404).json({ error: "Creator not found" }); return; }
        if (creator.userId !== req.user!.userId) {
          res.status(403).json({ error: "Not authorized to update this creator" }); return;
        }
        const updated = await storage.updateCreator(creator.id, {
          subscriptionPrice: subscriptionPrice || creator.subscriptionPrice,
          bannerImage: bannerImage || creator.bannerImage,
        });
        if (bio) await storage.updateUser(creator.userId, { bio });
        res.json(updated);
      } catch (error) {
        console.error("Update creator error:", error);
        res.status(500).json({ error: "Failed to update creator" });
      }
    }
  );

  // ==================== VIDEOS ====================
  // IMPORTANT: specific routes (/creator/:id, /upload) must come BEFORE /:id
  // otherwise Express matches "creator" and "upload" as the :id param

  app.get("/api/videos", async (_req, res) => {
    try {
      const allVideos = await storage.getAllVideos();
      res.json(allVideos);
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // ✅ MUST be before GET /api/videos/:id
  app.get("/api/videos/creator/:creatorId", async (req, res) => {
    try {
      const videos = await storage.getVideosByCreatorId(req.params.creatorId);
      res.json(videos);
    } catch (error) {
      console.error("Get creator videos error:", error);
      res.status(500).json({ error: "Failed to fetch creator videos" });
    }
  });

// =====================================================================
// REPLACE the existing GET /api/videos/:id route in server/routes.ts
// with this version. It checks subscription before returning videoUrl.
// =====================================================================

// In your server/routes.ts, find:
//   app.get("/api/videos/:id", async (req, res) => {
// and replace the entire handler with this:

app.get("/api/videos/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const video = await storage.getVideo(req.params.id);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Free videos — anyone can see full details including videoUrl
    if (video.type === "free") {
      res.json(video);
      return;
    }

    // ── PAID VIDEO ── access control below ──────────────────────────

    // Try to get the logged-in user from the token (optional auth)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let userId: string | null = null;
    let userCreatorId: string | null = null;

    if (token) {
      const { verifyToken } = await import("./auth");
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
        // Check if this user is a creator and get their creatorId
        const creator = await storage.getCreatorByUserId(decoded.userId);
        if (creator) userCreatorId = creator.id;
      }
    }

    // Rule 1: The creator who OWNS this video can always watch it
    if (userCreatorId && userCreatorId === video.creatorId) {
      res.json(video);
      return;
    }

    // Rule 2: A subscribed user can watch it
    if (userId) {
      const subscription = await storage.getActiveSubscription(userId, video.creatorId);
      if (subscription) {
        res.json(video);
        return;
      }
    }

    // Rule 3: Everyone else gets metadata but NO videoUrl
    // This prevents bypassing the UI to grab the stream URL directly
    res.json({
      ...video,
      videoUrl: null,   // strip the actual video URL
      locked: true,     // tell frontend it's locked
    });

  } catch (error) {
    console.error("Get video error:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

  // ✅ FIXED: decimal price coercion + safe categoryId handling
  app.post("/api/videos", authenticateToken, requireRole("creator"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { title, description, videoUrl, thumbnailUrl, type, price, categoryId } = req.body;

        if (!title || !videoUrl) {
          res.status(400).json({ error: "title and videoUrl are required" });
          return;
        }

        const creator = await storage.getCreatorByUserId(req.user!.userId);
        if (!creator) {
          res.status(404).json({ error: "Creator profile not found" });
          return;
        }

        // Drizzle decimal columns need a string value, not a JS number
        const priceStr = String(parseFloat(String(price ?? 0)).toFixed(2));

        const insertData: any = {
          creatorId: creator.id,
          title: String(title).trim(),
          description: description ? String(description).trim() : null,
          videoUrl: String(videoUrl),
          thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : null,
          type: type === "paid" ? "paid" : "free",
          price: priceStr,
        };

        // Only include categoryId when it is a real non-empty string
        // Passing null breaks the FK constraint
        if (categoryId && typeof categoryId === "string" && categoryId.trim() !== "") {
          insertData.categoryId = categoryId.trim();
        }

        console.log("Creating video:", JSON.stringify(insertData));
        const video = await storage.createVideo(insertData);
        console.log("Video created:", video.id);

        res.status(201).json(video);
      } catch (error) {
        console.error("Create video error:", error);
        const message = error instanceof Error ? error.message : "Failed to create video";
        res.status(500).json({ error: message });
      }
    }
  );

  // Fallback server-side upload endpoint (videos now upload directly from
  // the browser to Cloudinary, so this is rarely called)
  app.post("/api/videos/upload", authenticateToken, requireRole("creator"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { file, type } = req.body;
        if (!file) {
          res.status(400).json({ error: "No file provided. Upload directly from the browser to Cloudinary instead." });
          return;
        }
        const result = await cloudinary.uploader.upload(file, {
          resource_type: type === "video" ? "video" : "auto",
          folder: "fandomforge",
        });
        res.json({ url: result.secure_url, publicId: result.public_id });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  app.put("/api/videos/:id", authenticateToken, requireRole("creator"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { title, description, type, price } = req.body;
        const video = await storage.getVideo(req.params.id);
        if (!video) { res.status(404).json({ error: "Video not found" }); return; }
        const creator = await storage.getCreator(video.creatorId);
        if (creator?.userId !== req.user!.userId) {
          res.status(403).json({ error: "Not authorized to update this video" }); return;
        }
        const updated = await storage.updateVideo(video.id, {
          title: title || video.title,
          description: description || video.description,
          type: type || video.type,
          price: price != null
            ? String(parseFloat(String(price)).toFixed(2))
            : video.price,
        });
        res.json(updated);
      } catch (error) {
        console.error("Update video error:", error);
        res.status(500).json({ error: "Failed to update video" });
      }
    }
  );

  app.delete("/api/videos/:id", authenticateToken, requireRole("creator"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const video = await storage.getVideo(req.params.id);
        if (!video) { res.status(404).json({ error: "Video not found" }); return; }
        const creator = await storage.getCreator(video.creatorId);
        if (creator?.userId !== req.user!.userId) {
          res.status(403).json({ error: "Not authorized to delete this video" }); return;
        }
        await storage.deleteVideo(video.id);
        res.json({ message: "Video deleted" });
      } catch (error) {
        console.error("Delete video error:", error);
        res.status(500).json({ error: "Failed to delete video" });
      }
    }
  );

  // ==================== SUBSCRIPTIONS ====================
  app.get("/api/subscriptions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const subs = await storage.getConsumerSubscriptions(req.user!.userId);
      res.json(subs);
    } catch (error) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // ✅ MUST be before /api/subscriptions/:id style routes
  app.get("/api/subscriptions/check/:creatorId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sub = await storage.getActiveSubscription(req.user!.userId, req.params.creatorId);
        res.json(sub ? { subscribed: true, subscription: sub } : { subscribed: false });
      } catch (error) {
        console.error("Check subscription error:", error);
        res.status(500).json({ error: "Failed to check subscription" });
      }
    }
  );

  app.get("/api/subscriptions/creator/:creatorId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const creator = await storage.getCreator(req.params.creatorId);
        if (!creator) { res.status(404).json({ error: "Creator not found" }); return; }
        if (creator.userId !== req.user!.userId) {
          res.status(403).json({ error: "Forbidden" }); return;
        }
        const subs = await storage.getCreatorSubscriptions(req.params.creatorId);
        res.json(subs);
      } catch (error) {
        console.error("Get creator subscriptions error:", error);
        res.status(500).json({ error: "Failed to fetch subscriptions" });
      }
    }
  );

  // ==================== PAYMENTS ====================
  app.post("/api/payments/subscribe", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { creatorId, priceId } = req.body;
        const creator = await storage.getCreator(creatorId);
        if (!creator) { res.status(404).json({ error: "Creator not found" }); return; }
        await stripe.subscriptions.create({
          customer: req.user!.userId,
          items: [{ price: priceId }],
        });
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const dbSubscription = await storage.createSubscription({
          consumerId: req.user!.userId,
          creatorId,
          endDate,
        });
        res.status(201).json(dbSubscription);
      } catch (error) {
        console.error("Create subscription error:", error);
        res.status(500).json({ error: "Failed to create subscription" });
      }
    }
  );

  app.post("/api/payments/ppv", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId, creatorId, amount } = req.body;
        const video = await storage.getVideo(videoId);
        if (!video) { res.status(404).json({ error: "Video not found" }); return; }
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(amount) * 100),
          currency: "usd",
        });
        const payment = await storage.createPayment({
          consumerId: req.user!.userId,
          creatorId,
          videoId,
          amount: String(parseFloat(String(amount)).toFixed(2)),
          type: "ppv",
          stripePaymentId: paymentIntent.id,
        });
        res.status(201).json({ payment, clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Create payment error:", error);
        res.status(500).json({ error: "Failed to create payment" });
      }
    }
  );

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        JSON.stringify(req.body),
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as any;
        const payment = await storage.getPayment(paymentIntent.id);
        if (payment) await storage.updatePayment(payment.id, { status: "completed" });
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook failed" });
    }
  });

  // ==================== VIDEO ENGAGEMENT (LIKES/SHARES) ====================
  app.post("/api/videos/:videoId/like", authenticateToken, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user!.userId;

        // Check if already liked
        const existing = await db.select().from(likes)
          .where(and(
            eq(likes.consumerId, userId),
            eq(likes.videoId, videoId)
          ))
          .limit(1);

        if (existing.length > 0) {
          return res.status(400).json({ error: "Already liked" });
        }

        await db.insert(likes).values({
          consumerId: userId,
          videoId,
        });

        res.status(201).json({ liked: true });
      } catch (error) {
        console.error("Like video error:", error);
        res.status(500).json({ error: "Failed to like video" });
      }
    }
  );

  app.delete("/api/videos/:videoId/like", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user!.userId;

        await db.delete(likes)
          .where(and(
            eq(likes.consumerId, userId),
            eq(likes.videoId, videoId)
          ));

        res.json({ liked: false });
      } catch (error) {
        console.error("Unlike video error:", error);
        res.status(500).json({ error: "Failed to unlike video" });
      }
    }
  );

  app.get("/api/videos/:videoId/like", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user!.userId;

        const like = await db.select().from(likes)
          .where(and(
            eq(likes.consumerId, userId),
            eq(likes.videoId, videoId)
          ))
          .limit(1);

        res.json({ liked: like.length > 0 });
      } catch (error) {
        console.error("Check like error:", error);
        res.status(500).json({ error: "Failed to check like status" });
      }
    }
  );

  app.post("/api/videos/:videoId/share", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user!.userId;

        await db.insert(shares).values({
          consumerId: userId,
          videoId,
        });

        res.status(201).json({ shared: true });
      } catch (error) {
        console.error("Share video error:", error);
        res.status(500).json({ error: "Failed to share video" });
      }
    }
  );

  app.post("/api/videos/:videoId/view", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.user!.userId;

      // Check if user has already viewed this video
      const existingView = await db
        .select()
        .from(videoViews)
        .where(and(
          eq(videoViews.userId, userId),
          eq(videoViews.videoId, videoId)
        ))
        .limit(1);

      // If already viewed, don't increment
      if (existingView.length > 0) {
        const video = await storage.getVideo(videoId);
        res.json({ views: video?.views || 0, alreadyCounted: true });
        return;
      }

      // First time viewing - record the view
      await db.insert(videoViews).values({
        userId,
        videoId,
      });

      // Increment views counter
      const video = await storage.getVideo(videoId);
      if (video) {
        const newViews = (parseInt(String(video.views || 0)) + 1).toString();
        const updated = await storage.updateVideo(videoId, { views: parseInt(newViews) });
        res.json({ views: updated.views, alreadyCounted: false });
      } else {
        res.status(404).json({ error: "Video not found" });
      }
    } catch (error) {
      console.error("Record view error:", error);
      res.status(500).json({ error: "Failed to record view" });
    }
  });

  // ==================== CATEGORIES ====================
  app.get("/api/categories", async (_req, res) => {
    try {
      const cats = await storage.getAllCategories();
      res.json(cats);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { name } = req.body;
        const category = await storage.createCategory({ name });
        res.status(201).json(category);
      } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}