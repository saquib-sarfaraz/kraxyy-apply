import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { IUser } from '@kraxyy/types';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { PRIMARY_ADMIN_EMAIL } from '../../components/admin/ProtectedAdminRoute';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<{ user: IUser; accessToken: string }>('/auth/login', {
        email,
        password
      });

      const userEmail = (data.user?.email || '').toLowerCase().trim();
      if (userEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
        throw new Error('Access denied. Administrator privileges restricted to authorized account.');
      }

      login(data.accessToken, data.user);
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 font-sans selection:bg-mustard selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl border border-beige p-8 shadow-elevated space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-olive-50 border border-olive-200 rounded-pill text-[11px] font-bold text-olive uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-mustard" />
            <span>Admin Console</span>
          </div>
          <p className="text-xs text-charcoal-muted">System administration and telemetry</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-subtle border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-subtle bg-cream-50 border border-beige text-charcoal focus:outline-none focus:border-olive"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-subtle bg-cream-50 border border-beige text-charcoal focus:outline-none focus:border-olive"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-olive text-white rounded-subtle font-semibold hover:bg-olive-hover transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
