import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { BrandLogo } from '../../components/brand/BrandLogo';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  // Verification states
  const [tokenStatus, setTokenStatus] = useState<'verifying' | 'valid' | 'invalid' | 'expired'>('verifying');
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      setTokenErrorMessage('No password reset token provided. Please request a new reset link.');
      return;
    }

    let isMounted = true;
    const verifyToken = async () => {
      try {
        await api.get<{ valid: boolean }>(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        if (isMounted) {
          setTokenStatus('valid');
        }
      } catch (err) {
        if (isMounted) {
          const msg = (err as Error).message || '';
          if (msg.toLowerCase().includes('expired')) {
            setTokenStatus('expired');
            setTokenErrorMessage('This password reset link has expired. Reset links are valid for 15 minutes.');
          } else {
            setTokenStatus('invalid');
            setTokenErrorMessage('This password reset link is invalid or has already been used.');
          }
        }
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Validation criteria
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const criteriaMetCount = Object.values(criteria).filter(Boolean).length;
  const isAllCriteriaMet = criteriaMetCount === 5;
  const isMatching = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // Strength score: 0 to 4
  const getStrength = () => {
    if (!password) return { label: 'None', score: 0, color: 'bg-gray-200', text: 'text-charcoal-muted' };
    if (criteriaMetCount <= 2) return { label: 'Weak', score: 1, color: 'bg-red-500', text: 'text-red-600' };
    if (criteriaMetCount <= 4) return { label: 'Medium', score: 2, color: 'bg-mustard', text: 'text-mustard' };
    return { label: 'Strong', score: 3, color: 'bg-olive', text: 'text-olive font-semibold' };
  };

  const strength = getStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isAllCriteriaMet) {
      setFormError('Please ensure your password meets all the security requirements listed below.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please check and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password
      });

      setIsSuccess(true);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to reset password. The link may have expired.';
      setFormError(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setTokenStatus('expired');
      }
    } finally {
      setIsSubmitting(false);
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
            {isSuccess ? 'Password Reset Complete' : 'Create New Password'}
          </h1>
          <p className="text-xs text-charcoal-muted">
            {isSuccess
              ? 'Your password has been successfully updated'
              : 'Choose a strong password to protect your account'}
          </p>
        </div>

        {/* Loading State during token verification */}
        {tokenStatus === 'verifying' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-8 h-8 text-olive animate-spin" />
            <p className="text-xs text-charcoal-muted">Verifying password reset link...</p>
          </div>
        )}

        {/* Invalid or Expired Token State */}
        {(tokenStatus === 'invalid' || tokenStatus === 'expired') && !isSuccess && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-900">
                  {tokenStatus === 'expired' ? 'Link Expired' : 'Invalid Reset Link'}
                </h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  {tokenErrorMessage ||
                    'This password reset link is invalid, has expired, or has already been used.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-charcoal-muted text-center leading-relaxed">
              Reset links expire after 15 minutes for your account security. You can request a fresh link at any time.
            </p>

            <div className="space-y-2 pt-2">
              <Link
                to="/forgot-password"
                className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>Request New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="w-full py-2.5 text-xs text-charcoal-muted hover:text-charcoal font-semibold rounded-subtle transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-4 bg-cream-50 rounded-xl border border-beige/80 text-center space-y-3">
              <div className="w-12 h-12 bg-olive/10 text-olive rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-olive" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-olive">Password reset successfully.</p>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  You can now sign in using your new credentials. Any other active reset links have been invalidated.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Valid Token Form State */}
        {tokenStatus === 'valid' && !isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-subtle border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="text-xs font-semibold text-charcoal block mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" aria-hidden="true" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive transition"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-charcoal-muted hover:text-charcoal p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-charcoal-muted">Password Strength:</span>
                    <span className={strength.text}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-cream-dark rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        strength.score >= 1 ? strength.color : 'bg-transparent'
                      } ${strength.score === 1 ? 'w-1/3' : strength.score === 2 ? 'w-2/3' : 'w-full'}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="text-xs font-semibold text-charcoal block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" aria-hidden="true" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-subtle bg-cream-50 border border-beige text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive transition"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-charcoal-muted hover:text-charcoal p-0.5"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  {isMatching ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-olive" />
                      <span className="text-olive">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-red-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 bg-cream-50 rounded-subtle border border-beige/60 space-y-1.5 text-[11px]">
              <p className="font-semibold text-charcoal flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-olive" />
                Password Requirements:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-charcoal-muted">
                <div className="flex items-center gap-1.5">
                  {criteria.minLength ? (
                    <CheckCircle2 className="w-3 h-3 text-olive shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-beige shrink-0 inline-block" />
                  )}
                  <span className={criteria.minLength ? 'text-charcoal' : ''}>8+ characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {criteria.hasUpper ? (
                    <CheckCircle2 className="w-3 h-3 text-olive shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-beige shrink-0 inline-block" />
                  )}
                  <span className={criteria.hasUpper ? 'text-charcoal' : ''}>Uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {criteria.hasLower ? (
                    <CheckCircle2 className="w-3 h-3 text-olive shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-beige shrink-0 inline-block" />
                  )}
                  <span className={criteria.hasLower ? 'text-charcoal' : ''}>Lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {criteria.hasNumber ? (
                    <CheckCircle2 className="w-3 h-3 text-olive shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-beige shrink-0 inline-block" />
                  )}
                  <span className={criteria.hasNumber ? 'text-charcoal' : ''}>Number (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  {criteria.hasSpecial ? (
                    <CheckCircle2 className="w-3 h-3 text-olive shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-beige shrink-0 inline-block" />
                  )}
                  <span className={criteria.hasSpecial ? 'text-charcoal' : ''}>Special symbol (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isAllCriteriaMet || !isMatching}
              className="w-full py-3 bg-olive text-white font-semibold text-sm rounded-subtle hover:bg-olive-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
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
