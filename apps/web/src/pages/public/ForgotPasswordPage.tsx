import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      const message = (err as Error).message || 'Failed to send password reset email. Please try again.';
      setError(message);
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
          <h1 className="text-xl font-display font-bold text-olive pt-1">
            {submitted ? 'Check Your Inbox' : 'Forgot Password'}
          </h1>
          <p className="text-xs text-charcoal-muted">
            {submitted
              ? 'Follow the instructions sent to your email'
              : 'Enter your email address to receive a secure password reset link'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-subtle border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-4 bg-cream-50 rounded-xl border border-beige/80 text-center space-y-3">
              <div className="w-12 h-12 bg-olive/10 text-olive rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-olive" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-charcoal">
                  If an account exists with this email, we've sent you a password reset link.
                </p>
                <p className="text-[11px] text-charcoal-muted leading-relaxed">
                  Sent to <span className="font-medium text-charcoal">{email}</span>. The link will expire in 15 minutes.
                </p>
              </div>
            </div>

            <div className="text-xs text-charcoal-muted bg-surface-subtle p-3 rounded-subtle border border-beige/40 leading-relaxed">
              <strong>Tip:</strong> If you don't see the email within a couple of minutes, check your spam or junk folder, or ensure the email address was entered correctly.
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="w-full py-2.5 text-xs text-olive font-semibold hover:bg-cream/60 rounded-subtle border border-beige transition text-center"
              >
                Send another reset link
              </button>

              <Link
                to="/login"
                className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="text-xs font-semibold text-charcoal block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" aria-hidden="true" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive transition"
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-charcoal-muted mt-1.5">
                We'll send a single-use verification link to reset your password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 border-t border-beige/60">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-olive font-semibold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
