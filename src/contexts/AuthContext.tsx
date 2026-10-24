// src/contexts/AuthContext.tsx
// Manages JWT-based authentication state.
// Token is stored in localStorage under 'trackify_token'.
// On mount, the token is validated against GET /api/auth/me.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    businessName?: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'trackify_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Inner provider ──────────────────────────────────────────────────────────
const AuthProviderInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  const {
    setName,
    setBusinessName,
    setPhone,
    resetPreferences,
  } = usePreferences();

  // Sync the authenticated user's profile into preferences.
  const syncUserToPrefs = useCallback(
    (u: AuthUser) => {
      if (u.name) setName(u.name);
      if (u.businessName) setBusinessName(u.businessName);
      if (u.phone) setPhone(u.phone);
    },
    [setName, setBusinessName, setPhone]
  );

  // Keep the API authorization header and stored token synchronized.
  useEffect(() => {
    if (token) {
      const cleanToken = token.trim();
      localStorage.setItem(TOKEN_KEY, cleanToken);
      localStorage.setItem('token', cleanToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Restore and validate an existing session.
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      const storedToken =
        localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');

      if (!storedToken) {
        if (active) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      // Set the header before requesting the current user.
      api.defaults.headers.common['Authorization'] =
        `Bearer ${storedToken.trim()}`;

      try {
        const { data } = await api.get<{ user: AuthUser }>(
          '/api/auth/me'
        );

        if (!active) return;

        if (!data?.user) {
          throw new Error('The session response did not contain a user.');
        }

        setUser(data.user);
        setToken(storedToken);
        syncUserToPrefs(data.user);
      } catch (error: unknown) {
        if (!active) return;

        const status = (
          error as { response?: { status?: number } }
        )?.response?.status;

        if (status === 401 || status === 403) {
          // Clear the session only when the server explicitly rejects it.
          localStorage.removeItem(TOKEN_KEY);
          delete api.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
          resetPreferences();
        } else {
          // Network/server failures do not prove the token is invalid.
          // Keep the token, but do not mark the user as authenticated
          // without a verified user object.
          console.error(
            'Could not verify the existing session. Please retry:',
            error
          );
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      active = false;
    };
  }, [resetPreferences, syncUserToPrefs]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { data } = await api.post<{
        user: AuthUser;
        token: string;
      }>('/api/auth/login', { email, password });

      if (!data?.token || !data?.user) {
        throw new Error(
          'Login response is missing the user or authentication token.'
        );
      }

      // Persist the token before updating authenticated state.
      const cleanToken = data.token.trim();
      localStorage.setItem(TOKEN_KEY, cleanToken);
      localStorage.setItem('token', cleanToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;

      setToken(cleanToken);
      setUser(data.user);
      syncUserToPrefs(data.user);
      setLoading(false);
    },
    [syncUserToPrefs]
  );

  // ── Registration ─────────────────────────────────────────────────────────
  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      businessName = '',
      phone = ''
    ): Promise<void> => {
      const { data } = await api.post<{
        user: AuthUser;
        token: string;
      }>('/api/auth/register', {
        name,
        email,
        password,
        businessName,
        phone,
      });

      if (!data?.token || !data?.user) {
        throw new Error(
          'Registration response is missing the user or authentication token.'
        );
      }

      const cleanToken = data.token.trim();
      localStorage.setItem(TOKEN_KEY, cleanToken);
      localStorage.setItem('token', cleanToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;

      setToken(cleanToken);
      setUser(data.user);
      syncUserToPrefs(data.user);
      setLoading(false);
    },
    [syncUserToPrefs]
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];

    setUser(null);
    setToken(null);
    setLoading(false);
    resetPreferences();
  }, [resetPreferences]);

  // Handle session expiration reported by the API interceptor.
  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];

      setUser(null);
      setToken(null);
      setLoading(false);
      resetPreferences();
    };

    window.addEventListener(
      'trackify:session-expired',
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        'trackify:session-expired',
        handleSessionExpired
      );
    };
  }, [resetPreferences]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// AuthProvider must be inside PreferencesProvider.
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <AuthProviderInner>{children}</AuthProviderInner>
);

// ── Hook ────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
