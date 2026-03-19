// =====================================================================
// server/referral-routes.ts
// Mount in server/routes.ts:
//   import { registerReferralRoutes } from "./referral-routes";
//   // at end of registerRoutes(), before return httpServer:
//   registerReferralRoutes(app);
// =====================================================================

import type { Express } from "express";
import { db } from "./db";
import {
  referralCodes,
  referralEvents,
  pointsLedger,
  pointsBalances,
  withdrawalRequests,
  users,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticateToken, type AuthenticatedRequest } from "./middleware";

// ── Constants ─────────────────────────────────────────────────────────
const POINTS_PER_CLICK        = 0.20;   // per unique IP visit
const POINTS_PER_REGISTRATION = 1.00;   // when referred user signs up
const MIN_WITHDRAWAL_POINTS   = 50;     // 50 pts minimum = $0.50
const POINTS_TO_USD_RATE      = 0.01;   // 1 pt = $0.01  (100 pts = $1)
const CLICK_DEDUP_HOURS       = 24;     // same IP won't count twice in 24h

// ── Helpers ───────────────────────────────────────────────────────────
function generateCode(): string {
  // 8-char alphanumeric — avoids O/0/I/l confusion
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0].code;

  // Unique collision check
  let code = generateCode();
  while (true) {
    const collision = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);
    if (collision.length === 0) break;
    code = generateCode();
  }

  await db.insert(referralCodes).values({ userId, code });
  return code;
}

async function ensureBalance(userId: string) {
  const existing = await db
    .select()
    .from(pointsBalances)
    .where(eq(pointsBalances.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(pointsBalances).values({ userId });
  }
}

async function creditPoints(
  userId: string,
  amount: number,
  description: string,
  referralEventId?: string
): Promise<void> {
  await ensureBalance(userId);

  const updated = await db
    .update(pointsBalances)
    .set({
      balance:      sql`${pointsBalances.balance}      + ${amount}`,
      totalEarned:  sql`${pointsBalances.totalEarned}  + ${amount}`,
      updatedAt:    new Date(),
    })
    .where(eq(pointsBalances.userId, userId))
    .returning();

  const newBalance = parseFloat(updated[0]?.balance ?? "0");

  await db.insert(pointsLedger).values({
    userId,
    amount:       amount.toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    description,
    referralEventId: referralEventId ?? null,
  });
}

// ── Route registration ────────────────────────────────────────────────
export function registerReferralRoutes(app: Express): void {

  // ── GET /api/referral/code ────────────────────────────────────────
  // Returns the user's referral code and pre-built share links
  app.get("/api/referral/code", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId   = req.user!.userId;
        const code     = await ensureReferralCode(userId);
        const baseUrl  = process.env.FRONTEND_URL || "http://localhost:5173";
        const fullLink = `${baseUrl}?ref=${code}`;

        res.json({
          code,
          link: fullLink,
          shareLinks: {
            whatsapp: `https://wa.me/?text=Join%20FandomForge!%20${encodeURIComponent(fullLink)}`,
            twitter:  `https://twitter.com/intent/tweet?text=Join%20FandomForge!&url=${encodeURIComponent(fullLink)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullLink)}`,
          },
        });
      } catch (err) {
        console.error("Get referral code error:", err);
        res.status(500).json({ error: "Failed to get referral code" });
      }
    }
  );

  // ── GET /api/referral/stats ───────────────────────────────────────
  // Full dashboard data: clicks, registrations, balance, recent events
  app.get("/api/referral/stats", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const code   = await ensureReferralCode(userId);
        await ensureBalance(userId);

        const [codeRow] = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.code, code))
          .limit(1);

        const [balRow] = await db
          .select()
          .from(pointsBalances)
          .where(eq(pointsBalances.userId, userId))
          .limit(1);

        const recentEvents = await db
          .select()
          .from(referralEvents)
          .where(eq(referralEvents.referrerId, userId))
          .orderBy(desc(referralEvents.createdAt))
          .limit(20);

        const baseUrl  = process.env.FRONTEND_URL || "http://localhost:5173";
        const fullLink = `${baseUrl}?ref=${code}`;
        const balance  = parseFloat(balRow?.balance ?? "0");

        res.json({
          code,
          link: fullLink,
          shareLinks: {
            whatsapp: `https://wa.me/?text=Join%20FandomForge!%20${encodeURIComponent(fullLink)}`,
            twitter:  `https://twitter.com/intent/tweet?text=Join%20FandomForge!&url=${encodeURIComponent(fullLink)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullLink)}`,
          },
          totalClicks:         codeRow?.totalClicks         ?? 0,
          totalRegistrations:  codeRow?.totalRegistrations  ?? 0,
          balance,
          totalEarned:         parseFloat(balRow?.totalEarned    ?? "0"),
          totalWithdrawn:      parseFloat(balRow?.totalWithdrawn ?? "0"),
          estimatedUsd:        balance * POINTS_TO_USD_RATE,
          recentEvents,
          // constants — so frontend can stay in sync without hardcoding
          pointsPerClick:        POINTS_PER_CLICK,
          pointsPerRegistration: POINTS_PER_REGISTRATION,
          minWithdrawalPoints:   MIN_WITHDRAWAL_POINTS,
          pointsToUsdRate:       POINTS_TO_USD_RATE,
        });
      } catch (err) {
        console.error("Get referral stats error:", err);
        res.status(500).json({ error: "Failed to get referral stats" });
      }
    }
  );

  // ── POST /api/referral/track-click ───────────────────────────────
  // Public (no auth) — called when visitor arrives via ?ref= link
  app.post("/api/referral/track-click", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "code required" });

      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const [codeRow] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, code))
        .limit(1);

      if (!codeRow) return res.status(404).json({ error: "Invalid referral code" });

      // Dedup: same IP within 24 h for this code = no credit
      const cutoff     = new Date(Date.now() - CLICK_DEDUP_HOURS * 3_600_000);
      const recent     = await db
        .select()
        .from(referralEvents)
        .where(
          and(
            eq(referralEvents.referralCodeId, codeRow.id),
            eq(referralEvents.eventType,      "click"),
            eq(referralEvents.ipAddress,      ip),
            sql`${referralEvents.createdAt} > ${cutoff}`
          )
        )
        .limit(1);

      if (recent.length > 0) {
        return res.json({ counted: false, reason: "duplicate_ip" });
      }

      const [event] = await db
        .insert(referralEvents)
        .values({
          referrerId:      codeRow.userId,
          referralCodeId:  codeRow.id,
          eventType:       "click",
          pointsEarned:    POINTS_PER_CLICK.toFixed(2),
          ipAddress:       ip,
        })
        .returning();

      await db
        .update(referralCodes)
        .set({ totalClicks: sql`${referralCodes.totalClicks} + 1` })
        .where(eq(referralCodes.id, codeRow.id));

      await creditPoints(
        codeRow.userId,
        POINTS_PER_CLICK,
        "Referral link click",
        event.id
      );

      res.json({ counted: true, pointsEarned: POINTS_PER_CLICK });
    } catch (err) {
      console.error("Track click error:", err);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // ── POST /api/referral/track-registration ────────────────────────
  // Called after new user registers — credits the referrer +1 pt
  app.post("/api/referral/track-registration", async (req, res) => {
    try {
      const { code, newUserId } = req.body;
      if (!code || !newUserId) {
        return res.status(400).json({ error: "code and newUserId required" });
      }

      const [codeRow] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, code))
        .limit(1);

      if (!codeRow) return res.status(404).json({ error: "Invalid referral code" });

      // Prevent self-referral
      if (codeRow.userId === newUserId) {
        return res.status(400).json({ error: "Self-referral not allowed" });
      }

      // One registration credit per referred user
      const dup = await db
        .select()
        .from(referralEvents)
        .where(
          and(
            eq(referralEvents.referredUserId, newUserId),
            eq(referralEvents.eventType,      "register")
          )
        )
        .limit(1);

      if (dup.length > 0) {
        return res.json({ counted: false, reason: "already_credited" });
      }

      const [event] = await db
        .insert(referralEvents)
        .values({
          referrerId:      codeRow.userId,
          referralCodeId:  codeRow.id,
          referredUserId:  newUserId,
          eventType:       "register",
          pointsEarned:    POINTS_PER_REGISTRATION.toFixed(2),
        })
        .returning();

      await db
        .update(referralCodes)
        .set({ totalRegistrations: sql`${referralCodes.totalRegistrations} + 1` })
        .where(eq(referralCodes.id, codeRow.id));

      await creditPoints(
        codeRow.userId,
        POINTS_PER_REGISTRATION,
        "New user registered via your referral",
        event.id
      );

      res.json({ counted: true, pointsEarned: POINTS_PER_REGISTRATION });
    } catch (err) {
      console.error("Track registration error:", err);
      res.status(500).json({ error: "Failed to track registration" });
    }
  });

  // ── GET /api/referral/leaderboard ────────────────────────────────
  // Public — top 20 referrers ranked by registrations
  app.get("/api/referral/leaderboard", async (_req, res) => {
    try {
      const rows = await db
        .select({
          userId:             referralCodes.userId,
          code:               referralCodes.code,
          totalClicks:        referralCodes.totalClicks,
          totalRegistrations: referralCodes.totalRegistrations,
          username:           users.username,
          profileImage:       users.profileImage,
        })
        .from(referralCodes)
        .innerJoin(users, eq(referralCodes.userId, users.id))
        .orderBy(desc(referralCodes.totalRegistrations))
        .limit(20);

      const enriched = await Promise.all(
        rows.map(async (row) => {
          const [bal] = await db
            .select()
            .from(pointsBalances)
            .where(eq(pointsBalances.userId, row.userId))
            .limit(1);
          return {
            ...row,
            totalEarned: parseFloat(bal?.totalEarned ?? "0"),
          };
        })
      );

      res.json(enriched);
    } catch (err) {
      console.error("Leaderboard error:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // ── GET /api/referral/balance ─────────────────────────────────────
  app.get("/api/referral/balance", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        await ensureBalance(req.user!.userId);
        const [row] = await db
          .select()
          .from(pointsBalances)
          .where(eq(pointsBalances.userId, req.user!.userId))
          .limit(1);
        const bal = parseFloat(row?.balance ?? "0");
        res.json({
          balance:        bal,
          totalEarned:    parseFloat(row?.totalEarned    ?? "0"),
          totalWithdrawn: parseFloat(row?.totalWithdrawn ?? "0"),
          estimatedUsd:   bal * POINTS_TO_USD_RATE,
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch balance" });
      }
    }
  );

  // ── GET /api/referral/history ─────────────────────────────────────
  app.get("/api/referral/history", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const entries = await db
          .select()
          .from(pointsLedger)
          .where(eq(pointsLedger.userId, req.user!.userId))
          .orderBy(desc(pointsLedger.createdAt))
          .limit(50);
        res.json(entries);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch history" });
      }
    }
  );

  // ── POST /api/referral/withdraw ───────────────────────────────────
  // Deducts points immediately and queues a withdrawal request
  app.post("/api/referral/withdraw", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { pointsAmount, paymentMethod, paymentDetails } = req.body;
        const userId = req.user!.userId;

        if (!pointsAmount || !paymentMethod || !paymentDetails) {
          return res.status(400).json({
            error: "pointsAmount, paymentMethod, and paymentDetails are required",
          });
        }

        const pts = parseFloat(String(pointsAmount));
        if (isNaN(pts) || pts < MIN_WITHDRAWAL_POINTS) {
          return res.status(400).json({
            error: `Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points ($${(MIN_WITHDRAWAL_POINTS * POINTS_TO_USD_RATE).toFixed(2)})`,
          });
        }

        await ensureBalance(userId);
        const [balRow] = await db
          .select()
          .from(pointsBalances)
          .where(eq(pointsBalances.userId, userId))
          .limit(1);

        const currentBal = parseFloat(balRow?.balance ?? "0");
        if (currentBal < pts) {
          return res.status(400).json({ error: "Insufficient points balance" });
        }

        const usdAmount = pts * POINTS_TO_USD_RATE;

        // Deduct balance immediately (held pending review)
        const updated = await db
          .update(pointsBalances)
          .set({
            balance:        sql`${pointsBalances.balance}        - ${pts}`,
            totalWithdrawn: sql`${pointsBalances.totalWithdrawn} + ${pts}`,
            updatedAt:      new Date(),
          })
          .where(eq(pointsBalances.userId, userId))
          .returning();

        const [withdrawal] = await db
          .insert(withdrawalRequests)
          .values({
            userId,
            pointsAmount:   pts.toFixed(2),
            usdAmount:      usdAmount.toFixed(2),
            paymentMethod,
            paymentDetails:
              typeof paymentDetails === "string"
                ? paymentDetails
                : JSON.stringify(paymentDetails),
          })
          .returning();

        // Ledger debit
        await db.insert(pointsLedger).values({
          userId,
          amount:       (-pts).toFixed(2),
          balanceAfter: parseFloat(updated[0]?.balance ?? "0").toFixed(2),
          description:  `Withdrawal request — $${usdAmount.toFixed(2)} (pending)`,
          withdrawalId: withdrawal.id,
        });

        res.status(201).json({
          withdrawal,
          message: `Withdrawal request submitted. You will receive $${usdAmount.toFixed(2)} once approved.`,
        });
      } catch (err) {
        console.error("Withdraw error:", err);
        res.status(500).json({ error: "Failed to create withdrawal request" });
      }
    }
  );

  // ── GET /api/referral/withdrawals ─────────────────────────────────
  app.get("/api/referral/withdrawals", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const rows = await db
          .select()
          .from(withdrawalRequests)
          .where(eq(withdrawalRequests.userId, req.user!.userId))
          .orderBy(desc(withdrawalRequests.createdAt));
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch withdrawals" });
      }
    }
  );

  // ── POST /api/referral/use-points ────────────────────────────────
  // Spend points to unlock a premium video
  app.post("/api/referral/use-points", authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { videoId, pointsCost } = req.body;
        const userId = req.user!.userId;

        if (!videoId || !pointsCost) {
          return res.status(400).json({ error: "videoId and pointsCost required" });
        }

        const cost = parseFloat(String(pointsCost));
        await ensureBalance(userId);

        const [balRow] = await db
          .select()
          .from(pointsBalances)
          .where(eq(pointsBalances.userId, userId))
          .limit(1);

        if (parseFloat(balRow?.balance ?? "0") < cost) {
          return res.status(400).json({ error: "Insufficient points" });
        }

        const updated = await db
          .update(pointsBalances)
          .set({
            balance:   sql`${pointsBalances.balance} - ${cost}`,
            updatedAt: new Date(),
          })
          .where(eq(pointsBalances.userId, userId))
          .returning();

        await db.insert(pointsLedger).values({
          userId,
          amount:       (-cost).toFixed(2),
          balanceAfter: parseFloat(updated[0]?.balance ?? "0").toFixed(2),
          description:  "Unlocked premium video with points",
        });

        res.json({
          success:    true,
          newBalance: parseFloat(updated[0]?.balance ?? "0"),
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to use points" });
      }
    }
  );
}