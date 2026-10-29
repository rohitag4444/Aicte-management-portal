import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, setToken, getToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoAccounts: any[];
  login: (identifier: string, pass: string, loginType?: 'INSTITUTE' | 'AICTE_DEPT') => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  const loadInitialSession = async () => {
    try {
      const demoRes = await api.getDemoAccounts();
      setDemoAccounts(demoRes.demoAccounts || []);

      const existingToken = getToken();
      if (existingToken) {
        try {
          const meRes = await api.getMe();
          setUser(meRes.user);
          return;
        } catch {
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialSession();
  }, []);

  const login = async (identifier: string, pass: string, loginType: 'INSTITUTE' | 'AICTE_DEPT' = 'INSTITUTE') => {
    const res = await api.login(identifier, pass, loginType);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const switchRole = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.switchDemoAccount(userId);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!getToken()) return;
    try {
      const meRes = await api.getMe();
      setUser(meRes.user);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoAccounts,
        login,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
