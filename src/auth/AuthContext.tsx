import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import {
  canAccessAdmin,
  canEditBankDatabase,
  canManageTenants,
  type AuthSession,
  type Role,
} from './types';
import { login as loginService, logout as logoutService, readSession } from './authService';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  role: Role | null;
  canAccessAdmin: boolean;
  canManageTenants: boolean;
  canEditBankDatabase: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setIsBootstrapping(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = loginService(email, password);
    if (result.ok === false) {
      return { ok: false as const, error: result.error };
    }
    setSession(result.session);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = session?.role ?? null;
    return {
      session,
      isAuthenticated: Boolean(session),
      isBootstrapping,
      login,
      logout,
      role,
      canAccessAdmin: role ? canAccessAdmin(role) : false,
      canManageTenants: role ? canManageTenants(role) : false,
      canEditBankDatabase: role ? canEditBankDatabase(role) : false,
    };
  }, [session, isBootstrapping, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
