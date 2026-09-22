import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RoleSlug } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<string>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('scp_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const res = await api.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('scp_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      localStorage.removeItem('scp_token');
      localStorage.removeItem('scp_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const merged = { ...prev, ...userData };
      localStorage.setItem('scp_user', JSON.stringify(merged));
      return merged;
    });
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('scp_token');
    const savedUser = localStorage.getItem('scp_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        refreshMe();
      } catch {
        localStorage.removeItem('scp_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      const { user: userData, token: accessToken, refreshToken } = res.data;
      localStorage.setItem('scp_token', accessToken);
      localStorage.setItem('scp_refresh_token', refreshToken);
      localStorage.setItem('scp_user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res.data?.token) {
        localStorage.setItem('scp_token', res.data.token);
        localStorage.setItem('scp_refresh_token', res.data.refreshToken);
        localStorage.setItem('scp_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }
      return res.message;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('scp_token');
    localStorage.removeItem('scp_refresh_token');
    localStorage.removeItem('scp_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshMe, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
