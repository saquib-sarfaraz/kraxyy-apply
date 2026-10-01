import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { IUser } from '@kraxyy/types';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

import { BrandLogo } from '../../components/brand/BrandLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<{ user: IUser; accessToken: string }>('/auth/login', {
        email,
        password
      });

      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@kraxyy.com');
    setPassword('DemoPass123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32 sm:pt-36 pb-20">
      <div className="w-full max-w-md bg-white rounded-2xl border border-beige shadow-elevated p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="md" showTagline={true} />
          </div>
          <h1 className="text-xl font-display font-bold text-olive pt-1">Welcome Back</h1>
          <p className="text-xs text-charcoal-muted">Sign in to your Kraxyy Apply account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-subtle border border-red-200">
            {error}
          </div>
        )}

        {/* Demo login shortcuts */}
        <div className="p-3 bg-cream rounded-subtle border border-beige flex items-center justify-between text-xs">
          <span className="text-charcoal-muted font-medium">Quick Demo Fill:</span>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-2.5 py-1 bg-white border border-beige rounded text-olive font-semibold hover:border-olive transition"
          >
            Candidate Demo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.morgan@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-charcoal">Password</label>
              <Link to="/forgot-password" className="text-xs text-olive hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-beige/60">
          <p className="text-xs text-charcoal-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-olive font-bold hover:underline">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
