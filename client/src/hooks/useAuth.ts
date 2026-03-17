import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

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

export function useAuth() {
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

  const register = useCallback(
    async (username: string, email: string, password: string, role: string) => {
      try {
        setLoading(true);
        const response = await authApi.register(username, email, password, role);
        authApi.setToken(response.token);
        setUser(response.user);
        setError(null);
        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Registration failed";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const response = await authApi.login(email, password);
        authApi.setToken(response.token);
        setUser(response.user);
        setError(null);
        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Login failed";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authApi.clearToken();
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
    isCreator: user?.role === "creator",
  };
}
