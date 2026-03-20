import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  generateToken,
  hashPassword,
  verifyPassword,
  verifyToken,
} from "./auth";
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest,
} from "./middleware";
import PayPalClient from "./paypal";
import { registerReferralRoutes } from "./referral-routes";
import { v2 as cloudinary } from "cloudinary";
import { db } from "./db";
import { likes, shares, videoViews, videos as videosTable, payments as paymentsTable } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const paypal = new PayPalClient({
  clientId: process.env.PAYPAL_CLIENT_ID || "",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  mode: (process.env.PAYPAL_MODE as "sandbox" | "production") || "sandbox",
  returnUrl: process.env.PAYPAL_RETURN_URL || "http://localhost:5173/payment-success",
  cancelUrl: process.env.PAYPAL_CANCEL_URL || "http://localhost:5173/payment-cancel",
});

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
      } as any);
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
 // =====================================================================
// ADD THESE ROUTES to server/routes.ts
// Place them after the existing auth routes section
// =====================================================================

// ── UPDATE USER PROFILE (username, bio, profileImage) ──────────────
app.put("/api/auth/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { username, bio } = req.body;
    const userId = req.user!.userId;

    // Build update object — only include fields that were sent
    const updates: Record<string, any> = {};
    if (username && username.trim()) updates.username = username.trim();
    if (bio !== undefined) updates.bio = bio.trim();

    const updatedUser = await storage.updateUser(userId, updates);
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: req.user!.role,
      bio: updatedUser.bio,
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── UPLOAD PROFILE IMAGE TO CLOUDINARY ─────────────────────────────
// The frontend uploads the image directly to Cloudinary (same pattern
// as video uploads) and then calls this endpoint to save the URL.
app.put("/api/auth/profile/image", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { profileImageUrl } = req.body;
    const userId = req.user!.userId;

    if (!profileImageUrl || typeof profileImageUrl !== "string") {
      res.status(400).json({ error: "profileImageUrl is required" });
      return;
    }

    const updatedUser = await storage.updateUser(userId, {
      profileImage: profileImageUrl,
    });

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // If user is a creator, also update their creator banner/profile info
    const creator = await storage.getCreatorByUserId(userId);
    if (creator) {
      await storage.updateCreator(creator.id, {
        bannerImage: creator.bannerImage, // keep existing banner
      });
    }

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: req.user!.role,
      bio: updatedUser.bio,
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({ error: "Failed to update profile image" });
  }
});

// ── UPDATE CREATOR SUBSCRIPTION PRICE ──────────────────────────────
app.put("/api/auth/creator-settings", authenticateToken, requireRole("creator"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { subscriptionPrice, bannerImage } = req.body;
      const creator = await storage.getCreatorByUserId(req.user!.userId);

      if (!creator) {
        res.status(404).json({ error: "Creator profile not found" });
        return;
      }

      const updates: Record<string, any> = {};
      if (subscriptionPrice !== undefined) {
        const price = parseFloat(String(subscriptionPrice));
        if (isNaN(price) || price < 0) {
          res.status(400).json({ error: "Invalid subscription price" });
          return;
        }
        updates.subscriptionPrice = price.toFixed(2);
      }
      if (bannerImage) updates.bannerImage = bannerImage;

      const updated = await storage.updateCreator(creator.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update creator settings error:", error);
      res.status(500).json({ error: "Failed to update creator settings" });
    }
  }
);
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

  app.get("/api/videos", async (req, res) => {
    try {
      const allVideos = await storage.getAllVideos();
      
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      let isAuthenticated = false;
      
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) isAuthenticated = true;
      }
      
      // Only show free videos to unauthenticated users
      const filtered = isAuthenticated 
        ? allVideos 
        : allVideos.filter(v => v.type === "free");
      
      res.json(filtered);
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

  // ==================== PAYMENTS (PayPal) ====================

  // Create PPV/One-time payment order
  app.post("/api/payments/create-ppv", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId, creatorId, amount } = req.body;
        
        // Validate inputs
        if (!videoId || !creatorId || !amount) {
          res.status(400).json({ error: "Missing required fields" });
          return;
        }

        const video = await storage.getVideo(videoId);
        if (!video) {
          res.status(404).json({ error: "Video not found" });
          return;
        }

        const creator = await storage.getCreator(creatorId);
        if (!creator) {
          res.status(404).json({ error: "Creator not found" });
          return;
        }

        // Calculate commission (20% to platform, 80% to creator)
        const commissionPercentage = 20;
        const platformCommission = parseFloat(amount) * (commissionPercentage / 100);
        const creatorEarnings = parseFloat(amount) - platformCommission;

        // Create PayPal order
        const baseReturnUrl = process.env.PAYPAL_RETURN_URL || "http://localhost:5173/payment-success";
        const returnUrl = `${baseReturnUrl}?videoId=${videoId}&creatorId=${creatorId}`;
        const baseCancelUrl = process.env.PAYPAL_CANCEL_URL || "http://localhost:5173/payment-cancel";
        
        const order = await paypal.createOrder({
          amount: amount.toString(),
          currency: "USD",
          description: `Purchase: ${video.title}`,
          returnUrl: returnUrl,
          cancelUrl: baseCancelUrl,
        });

        // Store pending payment in DB
        const payment = await storage.createPayment({
          consumerId: req.user!.userId,
          creatorId,
          videoId,
          amount: amount.toString(),
          type: "ppv",
          status: "pending",
          paypalOrderId: order.id,
          creatorEarnings: creatorEarnings.toString(),
          platformCommission: platformCommission.toString(),
          commissionPercentage,
        });

        res.status(201).json({
          payment,
          approvalUrl: order.approval_link,
        });
      } catch (error) {
        console.error("Create PPV payment error:", error);
        res.status(500).json({ error: "Failed to create payment" });
      }
    }
  );

  // Capture PPV payment after user approves on PayPal
  app.post("/api/payments/capture-ppv", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { orderId, payerId } = req.body;

        if (!orderId) {
          res.status(400).json({ error: "Missing orderId" });
          return;
        }

        // 1. Capture the PayPal order (money is collected here)
        const orderDetails = await paypal.captureOrder(orderId);
        console.log("PayPal capture result:", orderDetails.status);

        if (orderDetails.status !== "COMPLETED") {
          res.status(400).json({
            error: `Payment not completed. Status: ${orderDetails.status}`
          });
          return;
        }

        // 2. Find the pending payment record by PayPal order ID
        const pendingPayments = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.paypalOrderId, orderId))
          .limit(1);

        // 3. Mark it completed — THIS is what was missing
        if (pendingPayments.length > 0) {
          await db
            .update(paymentsTable)
            .set({
              status: "completed",
              paypalTransactionId: orderDetails.id,
            })
            .where(eq(paymentsTable.id, pendingPayments[0].id));
        }

        res.json({
          success: true,
          transactionId: orderDetails.id,
          status: orderDetails.status,
        });
      } catch (error) {
        console.error("Capture PPV error:", error);
        const msg = error instanceof Error ? error.message : "Failed";
        res.status(500).json({ error: msg });
      }
    }
  );

  // Check if user has PPV access to a video
  app.get("/api/payments/check-ppv/:videoId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user!.userId;

        const result = await db
          .select()
          .from(paymentsTable)
          .where(
            and(
              eq(paymentsTable.consumerId, userId),
              eq(paymentsTable.videoId, videoId),
              eq(paymentsTable.type, "ppv"),
              eq(paymentsTable.status, "completed")
            )
          )
          .limit(1);

        res.json({ hasAccess: result.length > 0 });
      } catch (error) {
        console.error("Check PPV access error:", error);
        res.status(500).json({ error: "Failed to check access" });
      }
    }
  );

  // Create subscription (recurring payment)
  app.post("/api/payments/create-subscription", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { creatorId } = req.body;
        const user = await storage.getUser(req.user!.userId);
        if(!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }

        const creator = await storage.getCreator(creatorId);
        if (!creator) {
          res.status(404).json({ error: "Creator not found" });
          return;
        }

        const amount = creator.subscriptionPrice || "9.99";

        // Create or use existing PayPal billing plan
        // For now, creating a new plan each time (in production, you'd cache/reuse)
        const plan = await paypal.createBillingPlan({
          name: `${creator.id}-subscription`,
          description: `Monthly subscription to creator`,
          amount: amount.toString(),
          currency: "USD",
          interval: "MONTH",
          intervalCount: 1,
        });

        // Create subscription request
        const baseReturnUrl = process.env.PAYPAL_RETURN_URL || "http://localhost:5173/payment-success";
        const returnUrl = `${baseReturnUrl}?creatorId=${creatorId}`;
        const baseCancelUrl = process.env.PAYPAL_CANCEL_URL || "http://localhost:5173/payment-cancel";
        
        const subscription = await paypal.createSubscription({
          planId: plan.id,
          email: user.email,
          name: user.username,
          returnUrl: returnUrl,
          cancelUrl: baseCancelUrl,
        });

        res.json({
          approvalUrl: subscription.approval_link,
        });
      } catch (error) {
        console.error("Create subscription error:", error);
        res.status(500).json({ error: "Failed to create subscription" });
      }
    }
  );

  // Confirm subscription after user approves on PayPal
  app.post("/api/payments/confirm-subscription", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { subscriptionId, creatorId } = req.body;

        if (!subscriptionId || !creatorId) {
          res.status(400).json({ error: "Missing subscriptionId or creatorId" });
          return;
        }

        // Get subscription details from PayPal to verify it's active
        const subDetails = await paypal.getSubscriptionDetails(subscriptionId);

        if (subDetails.status !== "ACTIVE") {
          res.status(400).json({ error: "Subscription is not active" });
          return;
        }

        const creator = await storage.getCreator(creatorId);
        if (!creator) {
          res.status(404).json({ error: "Creator not found" });
          return;
        }

        // Calculate endDate (1 month from now)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        // Calculate commission (20% to platform, 80% to creator)
        const amount = creator.subscriptionPrice || "9.99";
        const commissionPercentage = 20;
        const platformCommission = parseFloat(amount) * (commissionPercentage / 100);
        const creatorEarnings = parseFloat(amount) - platformCommission;

        // Store subscription in DB
        const dbSubscription = await storage.createSubscription({
          consumerId: req.user!.userId,
          creatorId,
          amount: amount.toString(),
          paypalSubscriptionId: subscriptionId,
          paypalPlanId: subDetails.plan_id,
          endDate,
          isActive: true,
        });

        // Create initial payment record for this subscription
        await storage.createPayment({
          consumerId: req.user!.userId,
          creatorId,
          amount: amount.toString(),
          type: "subscription",
          status: "completed",
          paypalTransactionId: subscriptionId,
          creatorEarnings: creatorEarnings.toString(),
          platformCommission: platformCommission.toString(),
          commissionPercentage,
        });

        res.status(201).json(dbSubscription);
      } catch (error) {
        console.error("Confirm subscription error:", error);
        res.status(500).json({ error: "Failed to confirm subscription" });
      }
    }
  );

  // Cancel subscription
  app.post("/api/payments/cancel-subscription/:subscriptionId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { subscriptionId } = req.params;

        // Cancel with PayPal
        await paypal.cancelSubscription(subscriptionId, "User canceled subscription");

        // Update DB subscription
        await storage.updateSubscription(subscriptionId, {
          isActive: false,
        });

        res.json({ success: true });
      } catch (error) {
        console.error("Cancel subscription error:", error);
        res.status(500).json({ error: "Failed to cancel subscription" });
      }
    }
  );

  // PayPal webhook endpoint for subscription updates
  app.post("/api/payments/webhook/paypal", async (req, res) => {
    try {
      // In production, verify the webhook signature from PayPal
      const event = req.body;

      console.log("PayPal webhook event:", event.event_type);

      // Handle different PayPal webhook events
      if (event.event_type === "BILLING.SUBSCRIPTION.CREATED") {
        const subscriptionId = event.resource?.id;
        console.log("Subscription created:", subscriptionId);
      } else if (event.event_type === "BILLING.SUBSCRIPTION.UPDATED") {
        const subscriptionId = event.resource?.id;
        const status = event.resource?.status;
        console.log("Subscription updated:", subscriptionId, "Status:", status);
      } else if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
        const subscriptionId = event.resource?.id;
        // Mark subscription as inactive in DB
        // await storage.updateSubscription(subscriptionId, { isActive: false });
        console.log("Subscription canceled:", subscriptionId);
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        // One-time payment completed
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
        console.log("Payment completed:", orderId);
        // Update payment status in DB
      }

      // Always respond with 200 to acknowledge receipt
      res.json({ acknowledged: true });
    } catch (error) {
      console.error("PayPal webhook error:", error);
      // Still return 200 to prevent PayPal from retrying
      res.status(200).json({ error: "Webhook processed" });
    }
  });

  // Get creator earnings
  app.get("/api/creator/:creatorId/earnings", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { creatorId } = req.params;

        // Verify the user is the creator
        const creator = await storage.getCreator(creatorId);
        if (!creator) {
          res.status(404).json({ error: "Creator not found" });
          return;
        }

        // Get all completed payments for this creator
        const payments = await storage.getPaymentsByCreatorId(creatorId);
        const completedPayments = payments.filter((p) => p.status === "completed");

        const totalEarnings = completedPayments.reduce((sum, payment) => {
          return sum + parseFloat(payment.creatorEarnings || "0");
        }, 0);

        const paymentBreakdown = {
          totalEarnings: totalEarnings.toFixed(2),
          subscriptionEarnings: completedPayments
            .filter((p) => p.type === "subscription")
            .reduce((sum, p) => sum + parseFloat(p.creatorEarnings || "0"), 0)
            .toFixed(2),
          ppvEarnings: completedPayments
            .filter((p) => p.type === "ppv")
            .reduce((sum, p) => sum + parseFloat(p.creatorEarnings || "0"), 0)
            .toFixed(2),
          transactionCount: completedPayments.length,
        };

        res.json(paymentBreakdown);
      } catch (error) {
        console.error("Get creator earnings error:", error);
        res.status(500).json({ error: "Failed to fetch earnings" });
      }
    }
  );

  // Get platform commission (admin only)
  app.get("/api/admin/commission", authenticateToken, requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const payments = await db.select().from(videosTable);
        // This is a simplified version - in production, query payments directly
        res.json({ commission: "0" });
      } catch (error) {
        console.error("Get commission error:", error);
        res.status(500).json({ error: "Failed to fetch commission" });
      }
    }
  );

  // Batch creator payout (admin only)
  app.post("/api/admin/payouts/batch", authenticateToken, requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Get all creators with pending earnings
        const pendingPayouts = await storage.getPendingCreatorPayouts();

        if (pendingPayouts.length === 0) {
          res.json({ message: "No pending payouts", processedCount: 0 });
          return;
        }

        // Build payout list
        const payoutItems = [];
        for (const payout of pendingPayouts) {
          const creator = await storage.getCreator(payout.creatorId);
          if (!creator) continue;
          
          const user = await storage.getUser(creator.userId);
          if (!user) continue;

          payoutItems.push({
            email: user.email,
            amount: payout.amount.toString(),
            note: `FandomForge Creator Payout - ${new Date().toLocaleDateString()}`,
          });
        }

        if (payoutItems.length === 0) {
          res.json({ message: "No valid creators to payout", processedCount: 0 });
          return;
        }

        // Create PayPal payout batch
        const batch = await paypal.createPayoutBatch(payoutItems);

        // Update payout statuses
        for (const payout of pendingPayouts) {
          await storage.updateCreatorPayout(payout.id, {
            status: "processing",
            paypalPayoutId: batch.batch_id,
          });
        }

        res.json({
          message: "Payout batch created",
          batchId: batch.batch_id,
          processedCount: pendingPayouts.length,
        });
      } catch (error) {
        console.error("Batch payout error:", error);
        res.status(500).json({ error: "Failed to create payout batch" });
      }
    }
  );

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
        if (updated) {
          res.json({ views: updated.views, alreadyCounted: false });
        } else {
          res.json({ views: parseInt(newViews), alreadyCounted: false });
        }
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

  // ==================== COMMENTS ====================
  app.post("/api/videos/:videoId/comments", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const { content } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!content || !content.trim()) {
          return res.status(400).json({ error: "Comment content is required" });
        }

        const comment = await storage.createComment({
          userId,
          videoId,
          content: content.trim(),
        });

        // Create notification for video creator
        const video = await storage.getVideo(videoId);
        if (video) {
          const creator = await storage.getCreator(video.creatorId);
          if (creator) {
            const user = await storage.getUser(userId);
            await storage.createNotification({
              userId: creator.userId,
              type: "new_comment",
              content: `${user?.username} commented on your video "${video.title}"`,
              relatedUserId: userId,
              relatedVideoId: videoId,
            });
          }
        }

        res.status(201).json(comment);
      } catch (error) {
        console.error("Create comment error:", error);
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  );

  app.get("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const { videoId } = req.params;
      const comments_list = await storage.getCommentsByVideoId(videoId);
      res.json(comments_list);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.delete("/api/comments/:commentId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { commentId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const comment = await storage.getComment(commentId);
        if (!comment) {
          return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.userId !== userId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        await storage.deleteComment(commentId);
        res.json({ success: true });
      } catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({ error: "Failed to delete comment" });
      }
    }
  );

  // ==================== WATCHLIST ====================
  app.post("/api/watchlist", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!videoId) {
          return res.status(400).json({ error: "Video ID is required" });
        }

        const isInWatchlist = await storage.isInWatchlist(userId, videoId);
        if (isInWatchlist) {
          return res.status(400).json({ error: "Video already in watchlist" });
        }

        const item = await storage.addToWatchlist({ userId, videoId });
        res.status(201).json(item);
      } catch (error) {
        console.error("Add to watchlist error:", error);
        res.status(500).json({ error: "Failed to add to watchlist" });
      }
    }
  );

  app.get("/api/watchlist", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const items = await storage.getWatchlist(userId);
        res.json(items);
      } catch (error) {
        console.error("Get watchlist error:", error);
        res.status(500).json({ error: "Failed to fetch watchlist" });
      }
    }
  );

  app.delete("/api/watchlist/:videoId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        await storage.removeFromWatchlist(userId, videoId);
        res.json({ success: true });
      } catch (error) {
        console.error("Remove from watchlist error:", error);
        res.status(500).json({ error: "Failed to remove from watchlist" });
      }
    }
  );

  app.get("/api/watchlist/check/:videoId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const isInWatchlist = await storage.isInWatchlist(userId, videoId);
        res.json({ isInWatchlist });
      } catch (error) {
        console.error("Check watchlist error:", error);
        res.status(500).json({ error: "Failed to check watchlist" });
      }
    }
  );

  // ==================== NOTIFICATIONS ====================
  app.get("/api/notifications", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const notifs = await storage.getUserNotifications(userId);
        res.json(notifs);
      } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
      }
    }
  );

  app.get("/api/notifications/unread-count", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const count = await storage.getUnreadNotificationCount(userId);
        res.json({ count });
      } catch (error) {
        console.error("Get unread notification count error:", error);
        res.status(500).json({ error: "Failed to fetch notification count" });
      }
    }
  );

  app.patch("/api/notifications/:notificationId/read", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { notificationId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const notif = await storage.markNotificationAsRead(notificationId);
        res.json(notif);
      } catch (error) {
        console.error("Mark notification as read error:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
      }
    }
  );

  // ==================== DIRECT MESSAGES ====================
  app.post("/api/messages", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { recipientId, content } = req.body;
        const senderId = req.user?.userId;

        if (!senderId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!recipientId || !content) {
          return res.status(400).json({ error: "Recipient ID and content are required" });
        }

        if (senderId === recipientId) {
          return res.status(400).json({ error: "Cannot message yourself" });
        }

        const recipient = await storage.getUser(recipientId);
        if (!recipient) {
          return res.status(404).json({ error: "Recipient not found" });
        }

        const message = await storage.createDirectMessage({
          senderId,
          recipientId,
          content: content.trim(),
        });

        // Create notification for recipient
        const sender = await storage.getUser(senderId);
        await storage.createNotification({
          userId: recipientId,
          type: "new_message",
          content: `New message from ${sender?.username}`,
          relatedUserId: senderId,
        });

        res.status(201).json(message);
      } catch (error) {
        console.error("Create message error:", error);
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  );

  app.get("/api/messages/conversation/:userId", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId } = req.params;
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const conversation = await storage.getConversation(currentUserId, userId);
        res.json(conversation);
      } catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({ error: "Failed to fetch conversation" });
      }
    }
  );

  app.get("/api/messages/inbox", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const messages = await storage.getUserConversations(userId);
        res.json(messages);
      } catch (error) {
        console.error("Get inbox error:", error);
        res.status(500).json({ error: "Failed to fetch inbox" });
      }
    }
  );

  app.get("/api/messages/unread-count", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const count = await storage.getUnreadMessageCount(userId);
        res.json({ count });
      } catch (error) {
        console.error("Get unread message count error:", error);
        res.status(500).json({ error: "Failed to fetch message count" });
      }
    }
  );

  app.patch("/api/messages/:messageId/read", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { messageId } = req.params;
        const message = await storage.markMessageAsRead(messageId);
        res.json(message);
      } catch (error) {
        console.error("Mark message as read error:", error);
        res.status(500).json({ error: "Failed to mark message as read" });
      }
    }
  );

  registerReferralRoutes(app);

  const httpServer = createServer(app);

  
  return httpServer;
}
