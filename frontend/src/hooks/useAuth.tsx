import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Admin } from '../types/user';
import { storeSession, clearSession, decodeJwtPayload } from '../adapters/auth.adapter';
import * as authApi from '../api/auth.api';
import * as adminApi from '../api/admin.api';
import { setAccessToken, getAccessToken, clearAccessToken } from '../lib/session';
import { setLastAuthRole } from '../lib/api';

export type AuthStatus = 'anonymous' | 'otp_pending' | 'register_pending' | 'authenticated' | 'expired';

interface AuthState {
  status: AuthStatus;
  user: User | Admin | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | Admin | null) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
  login: (accessToken: string, role?: string) => Promise<User | Admin>;
  restoreSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  setAuthStatus: (status: AuthStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    status: 'anonymous',
    user: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);
  const restoringRef = useRef(false);

  const setToken = useCallback((newToken: string | null) => {
    setState((prev) => ({ ...prev, token: newToken }));
    if (newToken) setAccessToken(newToken);
    else clearAccessToken();
  }, []);

  const setUser = useCallback((newUser: User | Admin | null) => {
    setState((prev) => ({ ...prev, user: newUser }));
  }, []);

  const setAuthStatus = useCallback((status: AuthStatus) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  const login = useCallback(async (accessToken: string, role?: string): Promise<User | Admin> => {
    setAccessToken(accessToken);
    const isAdmin = role === 'ADMIN';
    setLastAuthRole(isAdmin ? 'ADMIN' : 'USER');
    const account = isAdmin ? await adminApi.adminGetProfile() : await authApi.getProfile();
    const user = storeSession(accessToken, account);
    localStorage.setItem('auth_cache', JSON.stringify({ user, token: accessToken }));
    setState({ status: 'authenticated', user, token: accessToken });
    return user;
  }, []);

  const logout = useCallback(async () => {
    const isAdmin = state.user?.role === 'ADMIN';
    try {
      if (isAdmin) {
        await adminApi.adminLogout();
      } else {
        await authApi.logout();
      }
    } catch {
      // Graceful — token may already be invalid
    }
    clearAccessToken();
    clearSession();
    setLastAuthRole(isAdmin ? 'ADMIN' : 'USER');
    localStorage.removeItem('auth_cache');
    setState({ status: 'anonymous', user: null, token: null });
    window.location.href = isAdmin ? '/admin/login' : '/manamaalai/login';
  }, [state.user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authApi.refresh();
      if (result?.accessToken) {
        setAccessToken(result.accessToken);
        setState((prev) => ({ ...prev, token: result.accessToken }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const adminRefreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await adminApi.adminRefresh();
      if (result?.accessToken) {
        setAccessToken(result.accessToken);
        setState((prev) => ({ ...prev, token: result.accessToken }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    if (restoringRef.current) return false;
    restoringRef.current = true;
    setLoading(true);
    try {
      let token = getAccessToken();

      if (!token) {
        let refreshed = await refreshSession();
        if (!refreshed) {
          refreshed = await adminRefreshSession();
        }
        if (!refreshed) {
          setState({ status: 'anonymous', user: null, token: null });
          return false;
        }
        token = getAccessToken()!;
      }

      const payload = decodeJwtPayload(token);
      const isAdmin = payload.roles?.includes('ADMIN');
      setLastAuthRole(isAdmin ? 'ADMIN' : 'USER');

      const cached = localStorage.getItem('auth_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.token === token && parsed.user?.role === (isAdmin ? 'ADMIN' : 'USER')) {
          setState({ status: 'authenticated', user: parsed.user, token });
          return true;
        }
      }

      const account = isAdmin ? await adminApi.adminGetProfile() : await authApi.getProfile();
      const user = storeSession(token, account);
      localStorage.setItem('auth_cache', JSON.stringify({ user, token }));
      setState({ status: 'authenticated', user, token });
      return true;
    } catch {
      let refreshed = await refreshSession();
      if (!refreshed) {
        refreshed = await adminRefreshSession();
      }
      if (refreshed) {
        try {
          const newToken = getAccessToken()!;
          const payload = decodeJwtPayload(newToken);
          const isAdmin = payload.roles?.includes('ADMIN');
          setLastAuthRole(isAdmin ? 'ADMIN' : 'USER');
          const cached = localStorage.getItem('auth_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.token === newToken) {
              setState({ status: 'authenticated', user: parsed.user, token: newToken });
              return true;
            }
          }
          const account = isAdmin ? await adminApi.adminGetProfile() : await authApi.getProfile();
          const user = storeSession(newToken, account);
          localStorage.setItem('auth_cache', JSON.stringify({ user, token: newToken }));
          setState({ status: 'authenticated', user, token: newToken });
          return true;
        } catch {
          clearAccessToken();
          setState({ status: 'expired', user: null, token: null });
          return false;
        }
      }
      clearAccessToken();
      setState({ status: 'expired', user: null, token: null });
      return false;
    } finally {
      restoringRef.current = false;
      setLoading(false);
    }
  }, [refreshSession, adminRefreshSession]);

  useEffect(() => {
    const publicPaths = ['/manamaalai/login', '/manamaalai/signup', '/manamaalai/forgot-password', '/admin/login'];
    if (publicPaths.includes(window.location.pathname)) {
      setLoading(false);
      return;
    }
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuthenticated = state.status === 'authenticated' && !!state.token;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated,
        loading,
        setUser,
        setToken,
        logout,
        login,
        restoreSession,
        refreshSession,
        setAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
