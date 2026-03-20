// client/src/contexts/AuthContext.tsx
// Global auth context so login state updates header immediately

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "consumer" | "creator" | "admin";
  bio?: string;
  profileImage?: string;
  creator?: {
    id: string;
    subscriptionPrice: string;
    bannerImage?: string;
    totalSubscribers: number;
    totalEarnings: string;
  };
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string, role: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authApi.getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await authApi.getMe();
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
      setUser(null);
      authApi.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login(email, password);
      authApi.setToken(response.token);

      // FIX 1: Login response only returns {id, username, email, role} — no profileImage.
      // Fetch full profile immediately so avatar appears right away, no delay.
      const fullUser = await authApi.getMe();
      setUser(fullUser);

      setError(null);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, role: string) => {
    try {
      setLoading(true);
      const response = await authApi.register(username, email, password, role);
      authApi.setToken(response.token);

      // Same fix: fetch full profile after register so all fields are present
      const fullUser = await authApi.getMe();
      setUser(fullUser);

      setError(null);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // FIX 2: Clear token and user state
    authApi.clearToken();
    setUser(null);
    setError(null);

    // Clear ALL React Query cached data so every component re-renders
    // immediately with logged-out state — no refresh needed
    queryClient.clear();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated: !!user,
      isCreator: user?.role === "creator",
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}