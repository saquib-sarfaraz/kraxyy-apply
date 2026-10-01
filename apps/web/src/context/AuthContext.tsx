import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '@kraxyy/types';
import { api } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  login: (token: string, user: IUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: IUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.get<IUser>('/auth/me');
        setUser(userData);
      } catch {
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = (token: string, userData: IUser) => {
    api.setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      api.setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: IUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
