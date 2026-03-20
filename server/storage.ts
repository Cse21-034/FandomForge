import {
  type User,
  type InsertUser,
  type Creator,
  type Video,
  type Subscription,
  type Payment,
  type Category,
  type Comment,
  type WatchlistItem,
  type Notification,
  type DirectMessage,
  users,
  creators,
  videos,
  subscriptions,
  payments,
  creatorPayouts,
  categories,
  comments,
  watchlist,
  notifications,
  directMessages,
  collections,
  collectionItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, asc } from "drizzle-orm";

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
  getCreatorEarnings(creatorId: string): Promise<number | null>;
  getPlatformCommission(startDate?: Date, endDate?: Date): Promise<number | null>;

  // Creator Payouts
  createCreatorPayout(payout: any): Promise<any>;
  getCreatorPayout(id: string): Promise<any | undefined>;
  getCreatorPayouts(creatorId: string): Promise<any[]>;
  updateCreatorPayout(id: string, updates: any): Promise<any | undefined>;
  getPendingCreatorPayouts(): Promise<any[]>;

  // Comments
  createComment(comment: any): Promise<Comment>;
  getCommentsByVideoId(videoId: string): Promise<Comment[]>;
  getComment(id: string): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<boolean>;

  // Watchlist
  addToWatchlist(watchlistItem: any): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, videoId: string): Promise<boolean>;
  getWatchlist(userId: string): Promise<WatchlistItem[]>;
  isInWatchlist(userId: string, videoId: string): Promise<boolean>;

  // Notifications
  createNotification(notification: any): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<Notification | undefined>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Direct Messages
  createDirectMessage(message: any): Promise<DirectMessage>;
  getConversation(user1Id: string, user2Id: string): Promise<DirectMessage[]>;
  getUserConversations(userId: string): Promise<DirectMessage[]>;
  markMessageAsRead(messageId: string): Promise<DirectMessage | undefined>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Collections
  createCollection(data: any): Promise<any>;
  getCollection(id: string): Promise<any | undefined>;
  getCollectionsByCreatorId(creatorId: string): Promise<any[]>;
  updateCollection(id: string, updates: Partial<any>): Promise<any | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  getCollectionWithItems(id: string): Promise<(any & { items: any[] }) | undefined>;

  createCollectionItem(data: any): Promise<any>;
  updateCollectionItem(id: string, updates: Partial<any>): Promise<any | undefined>;
  deleteCollectionItem(id: string): Promise<boolean>;
  reorderCollectionItems(collectionId: string, orderedIds: string[]): Promise<void>;
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

  // Comments
  async createComment(comment: any): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async getCommentsByVideoId(videoId: string): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId));
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id));
    return result[0];
  }

  async deleteComment(id: string): Promise<boolean> {
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // Watchlist
  async addToWatchlist(watchlistItem: any): Promise<WatchlistItem> {
    const result = await db.insert(watchlist).values(watchlistItem).returning();
    return result[0];
  }

  async removeFromWatchlist(userId: string, videoId: string): Promise<boolean> {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.videoId, videoId)
        )
      );
    return true;
  }

  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId));
  }

  async isInWatchlist(userId: string, videoId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.videoId, videoId)
        )
      );
    return result.length > 0;
  }

  // Notifications
  async createNotification(notification: any): Promise<Notification> {
    const result = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
  }

  async markNotificationAsRead(
    notificationId: string
  ): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return result[0];
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return result.length;
  }

  // Direct Messages
  async createDirectMessage(message: any): Promise<DirectMessage> {
    const result = await db
      .insert(directMessages)
      .values(message)
      .returning();
    return result[0];
  }

  async getConversation(
    user1Id: string,
    user2Id: string
  ): Promise<DirectMessage[]> {
    return db
      .select()
      .from(directMessages)
      .where(
        or(
          and(
            eq(directMessages.senderId, user1Id),
            eq(directMessages.recipientId, user2Id)
          ),
          and(
            eq(directMessages.senderId, user2Id),
            eq(directMessages.recipientId, user1Id)
          )
        )
      );
  }

  async getUserConversations(userId: string): Promise<DirectMessage[]> {
    return db
      .select()
      .from(directMessages)
      .where(
        or(
          eq(directMessages.senderId, userId),
          eq(directMessages.recipientId, userId)
        )
      );
  }

  async markMessageAsRead(
    messageId: string
  ): Promise<DirectMessage | undefined> {
    const result = await db
      .update(directMessages)
      .set({ isRead: true })
      .where(eq(directMessages.id, messageId))
      .returning();
    return result[0];
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(directMessages)
      .where(
        and(
          eq(directMessages.recipientId, userId),
          eq(directMessages.isRead, false)
        )
      );
    return result.length;
  }

  // Creator Earnings & Commission
  async getCreatorEarnings(creatorId: string): Promise<any> {
    const result = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.creatorId, creatorId),
          eq(payments.status, "completed")
        )
      );
    
    const totalEarnings = result.reduce((sum, payment) => {
      return sum + parseFloat(payment.creatorEarnings || "0");
    }, 0);
    
    return totalEarnings;
  }

  async getPlatformCommission(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db
      .select()
      .from(payments)
      .where(eq(payments.status, "completed"));
    
    const result = await query;
    
    const totalCommission = result.reduce((sum, payment) => {
      return sum + parseFloat(payment.platformCommission || "0");
    }, 0);
    
    return totalCommission;
  }

  // Creator Payouts
  async createCreatorPayout(payout: any): Promise<any> {
    const result = await db
      .insert(creatorPayouts)
      .values(payout)
      .returning();
    return result[0];
  }

  async getCreatorPayout(id: string): Promise<any | undefined> {
    const result = await db
      .select()
      .from(creatorPayouts)
      .where(eq(creatorPayouts.id, id));
    return result[0];
  }

  async getCreatorPayouts(creatorId: string): Promise<any[]> {
    return db
      .select()
      .from(creatorPayouts)
      .where(eq(creatorPayouts.creatorId, creatorId));
  }

  async updateCreatorPayout(id: string, updates: any): Promise<any | undefined> {
    const result = await db
      .update(creatorPayouts)
      .set(updates)
      .where(eq(creatorPayouts.id, id))
      .returning();
    return result[0];
  }

  async getPendingCreatorPayouts(): Promise<any[]> {
    return db
      .select()
      .from(creatorPayouts)
      .where(eq(creatorPayouts.status, "pending"));
  }

  // Collections
  async createCollection(data: any): Promise<any> {
    const result = await db.insert(collections).values(data).returning();
    return result[0];
  }

  async getCollection(id: string): Promise<any | undefined> {
    const result = await db.select().from(collections).where(eq(collections.id, id));
    return result[0];
  }

  async getCollectionsByCreatorId(creatorId: string): Promise<any[]> {
    return db
      .select()
      .from(collections)
      .where(eq(collections.creatorId, creatorId))
      .orderBy(collections.createdAt);
  }

  async updateCollection(id: string, updates: any): Promise<any | undefined> {
    const result = await db
      .update(collections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    return result[0];
  }

  async deleteCollection(id: string): Promise<boolean> {
    await db.delete(collections).where(eq(collections.id, id));
    return true;
  }

  async getCollectionWithItems(id: string): Promise<any | undefined> {
    const collection = await this.getCollection(id);
    if (!collection) return undefined;

    const items = await db
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, id))
      .orderBy(asc(collectionItems.position));

    return { ...collection, items };
  }

  async createCollectionItem(data: any): Promise<any> {
    const result = await db.insert(collectionItems).values(data).returning();
    return result[0];
  }

  async updateCollectionItem(id: string, updates: any): Promise<any | undefined> {
    const result = await db
      .update(collectionItems)
      .set(updates)
      .where(eq(collectionItems.id, id))
      .returning();
    return result[0];
  }

  async deleteCollectionItem(id: string): Promise<boolean> {
    await db.delete(collectionItems).where(eq(collectionItems.id, id));
    return true;
  }

  async reorderCollectionItems(collectionId: string, orderedIds: string[]): Promise<void> {
    // Update each item's position based on its index in the orderedIds array
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(collectionItems)
          .set({ position: index + 1 })
          .where(
            and(
              eq(collectionItems.id, id),
              eq(collectionItems.collectionId, collectionId)
            )
          )
      )
    );
  }
}

export const storage = new DatabaseStorage();

