import {
  type User,
  type InsertUser,
  type Creator,
  type Video,
  type Subscription,
  type Payment,
  type Category,
  users,
  creators,
  videos,
  subscriptions,
  payments,
  categories,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: string,
    updates: Partial<Omit<User, "id">>
  ): Promise<User | undefined>;

  // Creators
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorByUserId(userId: string): Promise<Creator | undefined>;
  createCreator(creator: any): Promise<Creator>;
  updateCreator(id: string, updates: Partial<Creator>): Promise<Creator | undefined>;

  // Videos
  getVideo(id: string): Promise<Video | undefined>;
  getVideosByCreatorId(creatorId: string): Promise<Video[]>;
  getAllVideos(): Promise<Video[]>;
  createVideo(video: any): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;

  // Categories
  getCategory(id: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: any): Promise<Category>;

  // Subscriptions
  getSubscription(
    consumerId: string,
    creatorId: string
  ): Promise<Subscription | undefined>;
  getConsumerSubscriptions(consumerId: string): Promise<Subscription[]>;
  createSubscription(subscription: any): Promise<Subscription>;
  getActiveSubscription(
    consumerId: string,
    creatorId: string
  ): Promise<Subscription | undefined>;
  updateSubscription(
    id: string,
    updates: Partial<Subscription>
  ): Promise<Subscription | undefined>;





  // Payments
  createPayment(payment: any): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByCreatorId(creatorId: string): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(
    id: string,
    updates: Partial<Omit<User, "id">>
  ): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
// Add this method to the IStorage interface in server/storage.ts:
// getCreatorSubscriptions(creatorId: string): Promise<Subscription[]>;

// Add this implementation to DatabaseStorage class:
async getCreatorSubscriptions(creatorId: string): Promise<Subscription[]> {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.creatorId, creatorId))
    .orderBy(subscriptions.createdAt);
}
  // Creators
  async getCreator(id: string): Promise<Creator | undefined> {
    const result = await db
      .select()
      .from(creators)
      .where(eq(creators.id, id));
    return result[0];
  }

  async getCreatorByUserId(userId: string): Promise<Creator | undefined> {
    const result = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, userId));
    return result[0];
  }

  async createCreator(creator: any): Promise<Creator> {
    const result = await db.insert(creators).values(creator).returning();
    return result[0];
  }

  async updateCreator(
    id: string,
    updates: Partial<Creator>
  ): Promise<Creator | undefined> {
    const result = await db
      .update(creators)
      .set(updates)
      .where(eq(creators.id, id))
      .returning();
    return result[0];
  }

  // Videos
  async getVideo(id: string): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id));
    return result[0];
  }

  async getVideosByCreatorId(creatorId: string): Promise<Video[]> {
    return db
      .select()
      .from(videos)
      .where(eq(videos.creatorId, creatorId));
  }

  async getAllVideos(): Promise<Video[]> {
    return db.select().from(videos);
  }

  async createVideo(video: any): Promise<Video> {
    const result = await db.insert(videos).values(video).returning();
    return result[0];
  }

  async updateVideo(
    id: string,
    updates: Partial<Video>
  ): Promise<Video | undefined> {
    const result = await db
      .update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    return result[0];
  }

  async deleteVideo(id: string): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id));
    return true;
  }

  // Categories
  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return result[0];
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(category: any): Promise<Category> {
    const result = await db
      .insert(categories)
      .values(category)
      .returning();
    return result[0];
  }

  // Subscriptions
  async getSubscription(
    consumerId: string,
    creatorId: string
  ): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.consumerId, consumerId),
          eq(subscriptions.creatorId, creatorId)
        )
      );
    return result[0];
  }

  async getConsumerSubscriptions(consumerId: string): Promise<Subscription[]> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.consumerId, consumerId));
  }

  async createSubscription(subscription: any): Promise<Subscription> {
    const result = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return result[0];
  }

  async getActiveSubscription(
    consumerId: string,
    creatorId: string
  ): Promise<Subscription | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.consumerId, consumerId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.isActive, true)
        )
      );
    
    if (result.length > 0) {
      const sub = result[0];
      // Check if subscription is still valid
      if (new Date(sub.endDate) > now) {
        return sub;
      }
    }
    return undefined;
  }

  async updateSubscription(
    id: string,
    updates: Partial<Subscription>
  ): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  // Payments
  async createPayment(payment: any): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentsByCreatorId(creatorId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.creatorId, creatorId));
  }

  async updatePayment(
    id: string,
    updates: Partial<Payment>
  ): Promise<Payment | undefined> {
    const result = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();

