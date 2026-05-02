import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser, UserRole } from '../types/api';
import { loginRequest, setApiToken } from '../services/api';

const TOKEN_KEY = 'billing_jwt';
const USER_KEY = 'billing_user';
const ROLE_KEY = 'billing_role';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u, r] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
          SecureStore.getItemAsync(ROLE_KEY),
        ]);
        if (t && u && r) {
          setToken(t);
          setApiToken(t);
          setUser(JSON.parse(u) as AuthUser);
          setRole(r as UserRole);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await loginRequest(email, password);
    if (!res.status || !res.data || !res.role) {
      return { ok: false, error: res.message ?? 'Login failed' };
    }
    // Backend currently has no token issuance; keep a session key
    // so app auth state survives restarts and is forward-compatible.
    const sessionToken = res.token ?? `session-${res.data.id}-${Date.now()}`;
    await SecureStore.setItemAsync(TOKEN_KEY, sessionToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.data));
    await SecureStore.setItemAsync(ROLE_KEY, res.role);
    setToken(sessionToken);
    setApiToken(sessionToken);
    setUser(res.data);
    setRole(res.role);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(ROLE_KEY);
    setToken(null);
    setApiToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      role,
      loading,
      signIn,
      signOut,
    }),
    [token, user, role, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
