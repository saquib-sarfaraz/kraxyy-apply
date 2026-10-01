import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { IUser } from '@kraxyy/types';
import { Sparkles, ArrowRight, User, Mail, Lock } from 'lucide-react';

import { BrandLogo } from '../../components/brand/BrandLogo';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      const data = await api.post<{ user: IUser; accessToken: string }>('/auth/register', {
        firstName,
        lastName,
        email,
        password
      });

      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32 sm:pt-36 pb-20">
      <div className="w-full max-w-md bg-white rounded-2xl border border-beige shadow-elevated p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="md" showTagline={true} />
          </div>
          <h1 className="text-xl font-display font-bold text-olive pt-1">Create Your Account</h1>
          <p className="text-xs text-charcoal-muted">Start applying faster with Kraxyy Apply</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-subtle border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">First Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full pl-9 pr-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Morgan"
                className="w-full px-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive"
              />
            </div>
          </div>

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
            <label className="text-xs font-semibold text-charcoal block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars with 1 number & 1 special"
                className="w-full pl-9 pr-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive"
              />
            </div>
            <p className="text-[10px] text-charcoal-muted mt-1">
              Minimum 8 characters, uppercase, lowercase, number & symbol.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-beige/60">
          <p className="text-xs text-charcoal-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-olive font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
