import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, fetchCsrfToken } from '../lib/api';
import type { User } from '../types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const hasSessionCookie = document.cookie.split('; ').some((cookie) => cookie.startsWith('designforge_session='));

    if (!hasSessionCookie) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCsrfToken();
    void refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    await fetchCsrfToken();
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    await fetchCsrfToken();
    const { data } = await api.post('/auth/register', { name, email, password });
    setUser(data.user);
  };

  const logout = async () => {
    await fetchCsrfToken();
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
