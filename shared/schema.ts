import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["consumer", "creator", "admin"]);
export const videoTypeEnum = pgEnum("video_type", ["free", "paid"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const paymentTypeEnum = pgEnum("payment_type", ["subscription", "ppv", "collection"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_video",
  "new_subscriber",
  "new_comment",
  "new_message",
  "subscription_expiring",
]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);

// Users Table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("consumer"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Creators Table (extends users)
export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscriptionPrice: decimal("subscription_price", { precision: 10, scale: 2 })
    .notNull()
    .default("9.99"),
  bannerImage: text("banner_image"),
  totalSubscribers: integer("total_subscribers").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Categories Table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Videos Table
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: videoTypeEnum("type").notNull().default("free"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  categoryId: varchar("category_id").references(() => categories.id),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// ── collections ─────────────────────────────────────────────────────
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("series"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("9.99"),
  thumbnailUrl: text("thumbnail_url"),
  isPublished: boolean("is_published").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── collection_items ─────────────────────────────────────────────────
export const collectionItems = pgTable("collection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  itemType: text("item_type").notNull().default("video"),
  videoId: varchar("video_id").references(() => videos.id, { onDelete: "set null" }),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  textContent: text("text_content"),
  title: text("title"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  paypalSubscriptionId: text("paypal_subscription_id"),
  paypalPlanId: text("paypal_plan_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull().default(sql`now()`),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Payments Table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  videoId: varchar("video_id").references(() => videos.id, {
    onDelete: "set null",
  }),
  collectionId: varchar("collection_id").references(() => collections.id, {
    onDelete: "set null",
  }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paypalTransactionId: text("paypal_transaction_id"),
  paypalOrderId: text("paypal_order_id"),
  creatorEarnings: decimal("creator_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionPercentage: integer("commission_percentage").notNull().default(20),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Creator Payouts Table
export const creatorPayouts = pgTable("creator_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum("status").notNull().default("pending"),
  paypalPayoutId: text("paypal_payout_id"),
  payoutDate: timestamp("payout_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────
// Likes Table — supports both videos AND collections (one nullable FK)
// ─────────────────────────────────────────────────────────────────────
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .references(() => videos.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id")
    .references(() => collections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Shares Table
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .references(() => videos.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id")
    .references(() => collections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────
// Video/Collection Views Table
// ─────────────────────────────────────────────────────────────────────
export const videoViews = pgTable("video_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .references(() => videos.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id")
    .references(() => collections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────
// Comments Table — supports both videos AND collections
// ─────────────────────────────────────────────────────────────────────
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .references(() => videos.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id")
    .references(() => collections.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────
// Watchlist Table — supports both videos AND collections
// ─────────────────────────────────────────────────────────────────────
export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .references(() => videos.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id")
    .references(() => collections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  content: text("content").notNull(),
  relatedUserId: varchar("related_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  relatedVideoId: varchar("related_video_id").references(() => videos.id, {
    onDelete: "set null",
  }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Direct Messages Table
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ── Referral System ──────────────────────────────────────────────────
export const referralEventTypeEnum = pgEnum("referral_event_type", [
  "click",
  "register",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
]);

export const referralCodes = pgTable("referral_codes", {
  id:                  varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId:              varchar("user_id").notNull().unique()
                         .references(() => users.id, { onDelete: "cascade" }),
  code:                text("code").notNull().unique(),
  totalClicks:         integer("total_clicks").notNull().default(0),
  totalRegistrations:  integer("total_registrations").notNull().default(0),
  createdAt:           timestamp("created_at").notNull().default(sql`now()`),
});

export const referralEvents = pgTable("referral_events", {
  id:              varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId:      varchar("referrer_id").notNull()
                     .references(() => users.id, { onDelete: "cascade" }),
  referralCodeId:  varchar("referral_code_id").notNull()
                     .references(() => referralCodes.id, { onDelete: "cascade" }),
  referredUserId:  varchar("referred_user_id")
                     .references(() => users.id, { onDelete: "set null" }),
  eventType:       referralEventTypeEnum("event_type").notNull(),
  pointsEarned:    decimal("points_earned", { precision: 10, scale: 2 }).notNull(),
  ipAddress:       text("ip_address"),
  createdAt:       timestamp("created_at").notNull().default(sql`now()`),
});

export const pointsLedger = pgTable("points_ledger", {
  id:               varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId:           varchar("user_id").notNull()
                      .references(() => users.id, { onDelete: "cascade" }),
  amount:           decimal("amount",       { precision: 10, scale: 2 }).notNull(),
  balanceAfter:     decimal("balance_after",{ precision: 10, scale: 2 }).notNull(),
  description:      text("description").notNull(),
  referralEventId:  varchar("referral_event_id")
                      .references(() => referralEvents.id, { onDelete: "set null" }),
  withdrawalId:     varchar("withdrawal_id"),
  createdAt:        timestamp("created_at").notNull().default(sql`now()`),
});

export const pointsBalances = pgTable("points_balances", {
  id:              varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId:          varchar("user_id").notNull().unique()
                     .references(() => users.id, { onDelete: "cascade" }),
  balance:         decimal("balance",         { precision: 10, scale: 2 }).notNull().default("0"),
  totalEarned:     decimal("total_earned",    { precision: 10, scale: 2 }).notNull().default("0"),
  totalWithdrawn:  decimal("total_withdrawn", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt:       timestamp("updated_at").notNull().default(sql`now()`),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id:              varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId:          varchar("user_id").notNull()
                     .references(() => users.id, { onDelete: "cascade" }),
  pointsAmount:    decimal("points_amount", { precision: 10, scale: 2 }).notNull(),
  usdAmount:       decimal("usd_amount",    { precision: 10, scale: 2 }).notNull(),
  status:          withdrawalStatusEnum("status").notNull().default("pending"),
  paymentMethod:   text("payment_method").notNull(),
  paymentDetails:  text("payment_details").notNull(),
  adminNote:       text("admin_note"),
  createdAt:       timestamp("created_at").notNull().default(sql`now()`),
  updatedAt:       timestamp("updated_at").notNull().default(sql`now()`),
});

// ── Zod Schemas ──────────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertCreatorSchema = createInsertSchema(creators).pick({
  userId: true,
  subscriptionPrice: true,
  bannerImage: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  creatorId: true,
  title: true,
  description: true,
  videoUrl: true,
  thumbnailUrl: true,
  type: true,
  price: true,
  categoryId: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  consumerId: true,
  creatorId: true,
  amount: true,
  endDate: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  consumerId: true,
  creatorId: true,
  videoId: true,
  amount: true,
  type: true,
  creatorEarnings: true,
  platformCommission: true,
  commissionPercentage: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  videoId: true,
  content: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  userId: true,
  videoId: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  content: true,
  relatedUserId: true,
  relatedVideoId: true,
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  senderId: true,
  recipientId: true,
  content: true,
});

// ── Types ────────────────────────────────────────────────────────────
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = typeof collectionItems.$inferInsert;
export type ReferralCode     = typeof referralCodes.$inferSelect;
export type ReferralEvent    = typeof referralEvents.$inferSelect;
export type PointsLedger     = typeof pointsLedger.$inferSelect;
export type PointsBalance    = typeof pointsBalances.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;