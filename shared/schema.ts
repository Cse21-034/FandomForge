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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["consumer", "creator", "admin"]);
export const videoTypeEnum = pgEnum("video_type", ["free", "paid"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const paymentTypeEnum = pgEnum("payment_type", ["subscription", "ppv"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_video",
  "new_subscriber",
  "new_comment",
  "new_message",
  "subscription_expiring",
]);

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

// Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
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
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Likes Table
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Shares Table
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Video Views Table (track unique user views)
export const videoViews = pgTable("video_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Comments Table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Watchlist Table
export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: varchar("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
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

// Zod Schemas
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
  endDate: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  consumerId: true,
  creatorId: true,
  videoId: true,
  amount: true,
  type: true,
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

// Types
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
