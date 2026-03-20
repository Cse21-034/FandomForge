// =====================================================================
// client/src/lib/api.ts  — FIXED: 401 no longer hard-redirects to /
// =====================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  // If true, a 401 will throw an error instead of redirecting to /
  // Use this for endpoints where auth is optional
  silentOn401?: boolean;
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
    // Only hard-redirect if the user had a token (i.e. session expired)
    // Don't redirect unauthenticated users who are just browsing
    if (token && !options.silentOn401) {
      clearAuthToken();
      window.location.href = "/";
      return;
    }
    // For requests without a token (or silentOn401), throw so callers can handle gracefully
    const data = await response.json().catch(() => ({ error: "Unauthorized" }));
    throw new Error(data.error || "Unauthorized");
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
  updateProfile: (data: { username?: string; bio?: string }) =>
    apiRequest("/auth/profile", { method: "PUT", body: data }),

  updateProfileImage: (profileImageUrl: string) =>
    apiRequest("/auth/profile/image", { method: "PUT", body: { profileImageUrl } }),

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
  // silentOn401 so unauthenticated users on video pages don't get redirected
  check: (creatorId: string) =>
    apiRequest(`/subscriptions/check/${creatorId}`, { silentOn401: true }),
};

// ── Payment endpoints (PayPal) ──────────────────────────────────────
export const paymentApi = {
  // PPV (One-time payment)
  createPPVOrder: (videoId: string, creatorId: string, amount: string) =>
    apiRequest("/payments/create-ppv", { method: "POST", body: { videoId, creatorId, amount } }),

  capturePPVOrder: (orderId: string, payerId: string) =>
    apiRequest("/payments/capture-ppv", { method: "POST", body: { orderId, payerId } }),

  // Subscriptions
  createSubscription: (creatorId: string) =>
    apiRequest("/payments/create-subscription", { method: "POST", body: { creatorId } }),

  confirmSubscription: (subscriptionId: string, creatorId: string) =>
    apiRequest("/payments/confirm-subscription", { method: "POST", body: { subscriptionId, creatorId } }),

  cancelSubscription: (subscriptionId: string) =>
    apiRequest(`/payments/cancel-subscription/${subscriptionId}`, { method: "POST" }),

  // Creator Earnings
  getCreatorEarnings: (creatorId: string) =>
    apiRequest(`/creator/${creatorId}/earnings`, { silentOn401: true }),

  // Admin
  getCommission: () =>
    apiRequest("/admin/commission"),

  batchPayout: () =>
    apiRequest("/admin/payouts/batch", { method: "POST" }),
};

// ── Engagement endpoints ────────────────────────────────────────────
export const engagementApi = {
  // silentOn401 so unauthenticated users browsing videos aren't kicked to /
  like: (videoId: string) =>
    apiRequest(`/videos/${videoId}/like`, { method: "POST" }),
  unlike: (videoId: string) =>
    apiRequest(`/videos/${videoId}/like`, { method: "DELETE" }),
  isLiked: (videoId: string) =>
    apiRequest(`/videos/${videoId}/like`, { silentOn401: true }),
  share: (videoId: string) =>
    apiRequest(`/videos/${videoId}/share`, { method: "POST" }),
  trackView: (videoId: string) =>
    apiRequest(`/videos/${videoId}/view`, { method: "POST", silentOn401: true }),
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
  check: (videoId: string) =>
    apiRequest(`/watchlist/check/${videoId}`, { silentOn401: true }),
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

// ── Referral / Rewards API ────────────────────────────────────────────
export const referralApi = {
  getCode: () =>
    apiRequest("/referral/code"),

  getStats: () =>
    apiRequest("/referral/stats"),

  getBalance: () =>
    apiRequest("/referral/balance"),

  getHistory: () =>
    apiRequest("/referral/history"),

  getLeaderboard: () =>
    apiRequest("/referral/leaderboard"),

  trackClick: (code: string) =>
    apiRequest("/referral/track-click", {
      method: "POST",
      body: { code },
    }),

  trackRegistration: (code: string, newUserId: string) =>
    apiRequest("/referral/track-registration", {
      method: "POST",
      body: { code, newUserId },
    }),

  withdraw: (data: {
    pointsAmount:   number;
    paymentMethod:  string;
    paymentDetails: Record<string, string>;
  }) =>
    apiRequest("/referral/withdraw", { method: "POST", body: data }),

  getWithdrawals: () =>
    apiRequest("/referral/withdrawals"),

  usePointsForVideo: (videoId: string, pointsCost: number) =>
    apiRequest("/referral/use-points", {
      method: "POST",
      body: { videoId, pointsCost },
    }),
};