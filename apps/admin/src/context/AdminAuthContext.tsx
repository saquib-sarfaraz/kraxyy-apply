import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '@kraxyy/types';
import { adminApi } from '../services/api';

interface AdminAuthContextType {
  admin: IUser | null;
  loading: boolean;
  login: (token: string, adminUser: IUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAdmin() {
      const token = adminApi.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const user = await adminApi.get<IUser>('/auth/me');
        if (
          user.email.toLowerCase() === 'saquibsarfaraz47@gmail.com' &&
          (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdminAuthorized)
        ) {
          setAdmin(user);
        } else {
          adminApi.setToken(null);
        }
      } catch {
        adminApi.setToken(null);
      } finally {
        setLoading(false);
      }
    }
    verifyAdmin();
  }, []);

  const login = (token: string, adminUser: IUser) => {
    adminApi.setToken(token);
    setAdmin(adminUser);
  };

  const logout = () => {
    adminApi.setToken(null);
    setAdmin(null);
    window.location.href = '/login';
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
