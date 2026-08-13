import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from './api';
import type { AuthResult, UserDto } from './types';

interface AuthContextValue {
  user: UserDto | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<UserDto>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);
  const initialToken = useRef(getToken());

  useEffect(() => {
    // On reload/direct link the token persists — restore the user from it so protected routes don't bounce to login.
    if (!initialToken.current) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get<UserDto>('/auth/me')
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // Token منتهي أو غير صالح — امسحه وخلّي الوجين يشتغل.
        if (!cancelled) {
          clearToken();
          setTokenState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await api.post<AuthResult>('/auth/login', { username, password });
      setToken(result.token);
      setTokenState(result.token);
      setUser(result.user);
      return result.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
