// src/contexts/AuthContext.tsx
// Manages JWT-based authentication state.
// Token is stored in localStorage under 'trackify_token'.
// On mount, the token is validated against GET /api/auth/me.

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  businessName: string;
  phone: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  /** true while the initial /me check is running */
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, businessName?: string, phone?: string) => Promise<void>;
  logout:   () => void;
}

const TOKEN_KEY = 'trackify_token';

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Attach / remove Authorization header whenever the token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // On mount, verify any stored token with the backend
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }

    api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
    api.get<{ user: AuthUser }>('/api/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setToken(stored);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ user: AuthUser; token: string }>(
      '/api/auth/login', { email, password }
    );
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (
    name: string, email: string, password: string,
    businessName = '', phone = ''
  ) => {
    const { data } = await api.post<{ user: AuthUser; token: string }>(
      '/api/auth/register', { name, email, password, businessName, phone }
    );
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    // Header cleared by the token effect above
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, token, loading,
    isAuthenticated: !!user,
    login, register, logout,
  }), [user, token, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
