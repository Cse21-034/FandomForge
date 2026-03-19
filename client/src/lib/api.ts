// =====================================================================
// This is the COMPLETE updated client/src/lib/api.ts
// Adds profileApi with updateProfile, uploadProfileImage, updateCreatorSettings
// =====================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
}

function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

function setAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
}

function clearAuthToken(): void {
  localStorage.removeItem("authToken");
}

async function apiRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    clearAuthToken();
    window.location.href = "/";
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status} ${response.statusText}`);
  }

  return data;
}

// ── Auth endpoints ──────────────────────────────────────────────────
export const authApi = {
  register: (username: string, email: string, password: string, role: string) =>
    apiRequest("/auth/register", { method: "POST", body: { username, email, password, role } }),

  login: (email: string, password: string) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),

  getMe: () => apiRequest("/auth/me"),

  setToken: setAuthToken,
  getToken: getAuthToken,
  clearToken: clearAuthToken,
};

// ── Profile endpoints ───────────────────────────────────────────────
export const profileApi = {
  /** Update username and/or bio */
  updateProfile: (data: { username?: string; bio?: string }) =>
    apiRequest("/auth/profile", { method: "PUT", body: data }),

  /** Save Cloudinary URL to user's profileImage in DB */
  updateProfileImage: (profileImageUrl: string) =>
    apiRequest("/auth/profile/image", { method: "PUT", body: { profileImageUrl } }),

  /** Upload image directly to Cloudinary from browser, returns secure_url */
  uploadImageToCloudinary: async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === "your_cloud_name") {
      throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not set in .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "fandomforge_preset");
    formData.append("folder", "fandomforge/profiles");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    const result = await response.json();
    return result.secure_url as string;
  },

  /** Update creator-specific settings (subscription price, banner) */
  updateCreatorSettings: (data: { subscriptionPrice?: number; bannerImage?: string }) =>
    apiRequest("/auth/creator-settings", { method: "PUT", body: data }),
};

// ── Creator endpoints ───────────────────────────────────────────────
export const creatorApi = {
  getAll: () => apiRequest("/creators"),
  getById: (id: string) => apiRequest(`/creators/${id}`),
  update: (id: string, data: any) => apiRequest(`/creators/${id}`, { method: "PUT", body: data }),
};

// ── Video endpoints ─────────────────────────────────────────────────
export const videoApi = {
  getAll: () => apiRequest("/videos"),
  getById: (id: string) => apiRequest(`/videos/${id}`),
  getByCreatorId: (creatorId: string) => apiRequest(`/videos/creator/${creatorId}`),

  create: (data: {
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    type: "free" | "paid";
    price?: number;
    categoryId?: string | null;
  }) => {
    const body: any = {
      title: data.title,
      videoUrl: data.videoUrl,
      type: data.type,
      price: data.price ?? 0,
    };
    if (data.description) body.description = data.description;
    if (data.thumbnailUrl) body.thumbnailUrl = data.thumbnailUrl;
    if (data.categoryId && data.categoryId !== "") body.categoryId = data.categoryId;
    return apiRequest("/videos", { method: "POST", body });
  },

  update: (id: string, data: any) =>
    apiRequest(`/videos/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    apiRequest(`/videos/${id}`, { method: "DELETE" }),

  uploadFile: async (file: File) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "fandomforge_preset");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Cloudinary upload failed");
    }
    const result = await response.json();
    return { url: result.secure_url, publicId: result.public_id };
  },
};

// ── Subscription endpoints ──────────────────────────────────────────
export const subscriptionApi = {
  getAll: () => apiRequest("/subscriptions"),
  check: (creatorId: string) => apiRequest(`/subscriptions/check/${creatorId}`),
  subscribe: (creatorId: string, priceId: string) =>
    apiRequest("/payments/subscribe", { method: "POST", body: { creatorId, priceId } }),
};

// ── Engagement endpoints ────────────────────────────────────────────
export const engagementApi = {
  like: (videoId: string) =>
    apiRequest(`/videos/${videoId}/like`, { method: "POST" }),
  unlike: (videoId: string) =>
    apiRequest(`/videos/${videoId}/like`, { method: "DELETE" }),
  isLiked: (videoId: string) =>
    apiRequest(`/videos/${videoId}/like`),
  share: (videoId: string) =>
    apiRequest(`/videos/${videoId}/share`, { method: "POST" }),
  trackView: (videoId: string) =>
    apiRequest(`/videos/${videoId}/view`, { method: "POST" }),
};

// ── Payment endpoints ───────────────────────────────────────────────
export const paymentApi = {
  createPPV: (videoId: string, creatorId: string, amount: string) =>
    apiRequest("/payments/ppv", { method: "POST", body: { videoId, creatorId, amount } }),
};

// ── Category endpoints ──────────────────────────────────────────────
export const categoryApi = {
  getAll: () => apiRequest("/categories"),
  create: (name: string) => apiRequest("/categories", { method: "POST", body: { name } }),
};

// ── Comments endpoints ──────────────────────────────────────────────
export const commentApi = {
  getByVideoId: (videoId: string) => apiRequest(`/videos/${videoId}/comments`),
  create: (videoId: string, content: string) =>
    apiRequest(`/videos/${videoId}/comments`, { method: "POST", body: { content } }),
  delete: (commentId: string) =>
    apiRequest(`/comments/${commentId}`, { method: "DELETE" }),
};

// ── Watchlist endpoints ─────────────────────────────────────────────
export const watchlistApi = {
  add: (videoId: string) =>
    apiRequest("/watchlist", { method: "POST", body: { videoId } }),
  remove: (videoId: string) =>
    apiRequest(`/watchlist/${videoId}`, { method: "DELETE" }),
  getAll: () => apiRequest("/watchlist"),
  check: (videoId: string) => apiRequest(`/watchlist/check/${videoId}`),
};

// ── Notifications endpoints ─────────────────────────────────────────
export const notificationApi = {
  getAll: () => apiRequest("/notifications"),
  getUnreadCount: () => apiRequest("/notifications/unread-count"),
  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" }),
};

// ── Direct Messages endpoints ───────────────────────────────────────
export const messageApi = {
  send: (recipientId: string, content: string) =>
    apiRequest("/messages", { method: "POST", body: { recipientId, content } }),
  getConversation: (userId: string) =>
    apiRequest(`/messages/conversation/${userId}`),
  getInbox: () => apiRequest("/messages/inbox"),
  getUnreadCount: () => apiRequest("/messages/unread-count"),
  markAsRead: (messageId: string) =>
    apiRequest(`/messages/${messageId}/read`, { method: "PATCH" }),
};

// =====================================================================
// Paste this block at the BOTTOM of client/src/lib/api.ts
// =====================================================================

// ── Referral / Rewards API ────────────────────────────────────────────
export const referralApi = {
  /** Get or create the user's referral code + pre-built share links */
  getCode: () =>
    apiRequest("/referral/code"),

  /** Full stats: clicks, registrations, balance, recent events */
  getStats: () =>
    apiRequest("/referral/stats"),

  /** Quick balance + estimatedUsd */
  getBalance: () =>
    apiRequest("/referral/balance"),

  /** Points ledger (last 50 transactions) */
  getHistory: () =>
    apiRequest("/referral/history"),

  /** Public top-20 leaderboard */
  getLeaderboard: () =>
    apiRequest("/referral/leaderboard"),

  /** Track a referral link click — no auth needed */
  trackClick: (code: string) =>
    apiRequest("/referral/track-click", {
      method: "POST",
      body: { code },
    }),

  /** Credit referrer after new user signs up */
  trackRegistration: (code: string, newUserId: string) =>
    apiRequest("/referral/track-registration", {
      method: "POST",
      body: { code, newUserId },
    }),

  /** Request a cash withdrawal */
  withdraw: (data: {
    pointsAmount:   number;
    paymentMethod:  string;
    paymentDetails: Record<string, string>;
  }) =>
    apiRequest("/referral/withdraw", { method: "POST", body: data }),

  /** List the user's past withdrawal requests */
  getWithdrawals: () =>
    apiRequest("/referral/withdrawals"),

  /** Spend points to unlock a premium video */
  usePointsForVideo: (videoId: string, pointsCost: number) =>
    apiRequest("/referral/use-points", {
      method: "POST",
      body: { videoId, pointsCost },
    }),
};