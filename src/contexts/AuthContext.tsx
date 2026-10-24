// src/contexts/AuthContext.tsx
// Manages JWT-based authentication state.
// Token is stored in localStorage under 'trackify_token'.
// On mount, the token is validated against GET /api/auth/me.
//
// IMPORTANT: This context is the single source of truth for the authenticated user's
// profile (name, email, businessName, phone). It populates PreferencesContext on
// login/register and clears it on logout to prevent stale data across account switches.

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import api from '@/lib/api';
import { usePreferences } from './PreferencesContext';

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

// ── Inner provider that has access to PreferencesContext ─────────────────────
const AuthProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const { setName, setBusinessName, setPhone, resetPreferences, language, setLanguage } = usePreferences();

  // Helper: sync user profile into PreferencesContext
  // Only overwrites fields that have a real value from the server —
  // never overwrites with empty string or undefined.
  const syncUserToPrefs = useCallback((u: AuthUser) => {
    if (u.name)         setName(u.name);
    if (u.businessName) setBusinessName(u.businessName);
    if (u.phone)        setPhone(u.phone);
    // Language is NOT overwritten from the server — the user chose it on the auth form.
  }, [setName, setBusinessName, setPhone]);

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
        // Sync the verified user's profile into PreferencesContext so
        // Settings always shows the correct user's data after a refresh.
        syncUserToPrefs(data.user);
      })
      .catch(() => {
        // Token expired or invalid — clear everything
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        resetPreferences();
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ user: AuthUser; token: string }>(
      '/api/auth/login', { email, password }
    );
    setToken(data.token);
    setUser(data.user);
    // ── BUG 1 FIX: Populate PreferencesContext from the server response ──
    // This replaces any stale data from the previous account.
    syncUserToPrefs(data.user);
  }, [syncUserToPrefs]);

  const register = useCallback(async (
    name: string, email: string, password: string,
    businessName = '', phone = ''
  ) => {
    const { data } = await api.post<{ user: AuthUser; token: string }>(
      '/api/auth/register', { name, email, password, businessName, phone }
    );
    setToken(data.token);
    setUser(data.user);
    // Sync newly-created user's server-confirmed profile into prefs
    syncUserToPrefs(data.user);
  }, [syncUserToPrefs]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    // ── BUG 1 FIX: Clear all user-specific preference data on logout ────
    // Without this, the next login shows the previous user's cached name/phone.
    resetPreferences();
    // Header cleared by the token effect above
  }, [resetPreferences]);

  // Listen for session-expired events dispatched by the api interceptor
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setToken(null);
      resetPreferences();
    };
    window.addEventListener('trackify:session-expired', handler);
    return () => window.removeEventListener('trackify:session-expired', handler);
  }, [resetPreferences]);

  const value = useMemo<AuthContextValue>(() => ({
    user, token, loading,
    isAuthenticated: !!user,
    login, register, logout,
  }), [user, token, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Public Provider ───────────────────────────────────────────────────────────
// AuthProvider must be inside PreferencesProvider so it can access usePreferences.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
