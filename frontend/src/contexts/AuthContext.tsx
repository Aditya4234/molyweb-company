"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  role: string;
  avatar?: string;
  provider?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, type?: "admin" | "employee") => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("molyweb_token");
    if (storedToken) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
        signal: controller.signal,
      })
        .then((res) => {
          clearTimeout(timeout);
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then((data) => {
          setToken(storedToken);
          setUser(data.user);
        })
        .catch(() => {
          clearTimeout(timeout);
          localStorage.removeItem("molyweb_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const currentRefresh = localStorage.getItem("molyweb_refresh");
    if (!currentRefresh) return;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("molyweb_token", data.accessToken);
        setToken(data.accessToken);
      }
    } catch {
      // silently fail
    }
  }, []);

  const login = useCallback(async (email: string, password: string, type: "admin" | "employee" = "admin") => {
    const endpoint = type === "admin" ? "/auth/admin/login" : "/auth/employee/login";
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("molyweb_token", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("molyweb_refresh", data.refreshToken);
    }
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Google login failed" }));
      throw new Error(err.error || "Google login failed");
    }
    const data = await res.json();
    localStorage.setItem("molyweb_token", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("molyweb_refresh", data.refreshToken);
    }
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem("molyweb_token");
      if (currentToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
        });
      }
    } catch {
      // silently fail
    }
    localStorage.removeItem("molyweb_token");
    localStorage.removeItem("molyweb_refresh");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, googleLogin, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}