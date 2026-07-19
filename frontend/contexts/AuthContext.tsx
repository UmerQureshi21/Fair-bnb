"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type User = { id: number; email: string };
export type AuthStatus = "loading" | "guest" | "authed";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseErrorDetail(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.detail || "Something went wrong";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applySession = useCallback((token: string, sessionUser: User) => {
    accessTokenRef.current = token;
    setUser(sessionUser);
    setStatus("authed");
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setStatus("guest");
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (!res.ok) {
            clearSession();
            return false;
          }
          const data = await res.json();
          applySession(data.access_token, data.user);
          return true;
        } catch {
          clearSession();
          return false;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();
    }
    return refreshPromiseRef.current;
  }, [applySession, clearSession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await parseErrorDetail(res));
      const data = await res.json();
      applySession(data.access_token, data.user);
    },
    [applySession]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await parseErrorDetail(res));
      const data = await res.json();
      applySession(data.access_token, data.user);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    clearSession();
  }, [clearSession]);

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const withAuth = (): RequestInit => ({
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${accessTokenRef.current ?? ""}` },
      });

      let res = await fetch(`${API_BASE}${path}`, withAuth());
      if (res.status === 401) {
        const refreshed = await refresh();
        if (refreshed) {
          res = await fetch(`${API_BASE}${path}`, withAuth());
        }
      }
      return res;
    },
    [refresh]
  );

  return (
    <AuthContext.Provider value={{ status, user, login, signup, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
