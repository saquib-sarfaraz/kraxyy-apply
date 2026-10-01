import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/brand/BrandLogo';
import { ConnectWidget } from '../components/connect/ConnectWidget';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col font-sans selection:bg-mustard selection:text-white bg-paper-grain relative overflow-x-hidden">
      {/* Floating Modern Header Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center px-4 sm:px-6 pt-4 ${
          scrolled ? 'translate-y-0' : 'translate-y-0'
        }`}
      >
        <div
          className={`w-full max-w-5xl transition-all duration-500 rounded-2xl flex items-center justify-between px-5 sm:px-7 ${
            scrolled
              ? 'h-14 bg-cream/80 backdrop-blur-xl border border-beige shadow-soft'
              : 'h-16 bg-transparent border border-transparent'
          }`}
        >
          {/* Left: Brand Mark */}
          <Link to="/" className="flex items-center group">
            <BrandLogo size="sm" />
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-charcoal/80 tracking-normal">
            <a
              href="#autofill"
              className="hover:text-olive transition-colors duration-200 py-1"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="hover:text-olive transition-colors duration-200 py-1"
            >
              How It Works
            </a>
            <a
              href="#extension"
              className="hover:text-olive transition-colors duration-200 py-1"
            >
              Extension
            </a>
            <a
              href="#pipeline"
              className="hover:text-olive transition-colors duration-200 py-1"
            >
              Applications
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-tactile px-4 py-2 rounded-xl bg-olive text-cream font-semibold text-xs shadow-soft flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <span className="text-mustard-light">→</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-charcoal/80 hover:text-olive px-2.5 py-1.5 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-tactile px-4 py-2 rounded-xl bg-olive text-cream font-semibold text-xs shadow-soft hover:bg-olive-hover transition flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <span className="text-mustard-light">→</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-charcoal hover:text-olive focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-4 right-4 sm:hidden bg-cream/95 backdrop-blur-xl border border-beige rounded-2xl p-5 space-y-3 shadow-modal">
            <a
              href="#autofill"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-charcoal py-1.5"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-charcoal py-1.5"
            >
              How It Works
            </a>
            <a
              href="#extension"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-charcoal py-1.5"
            >
              Extension
            </a>
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-charcoal py-1.5"
            >
              Applications
            </a>
            <div className="pt-3 border-t border-beige flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-semibold text-charcoal border border-beige rounded-xl"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-semibold bg-olive text-cream rounded-xl shadow-soft"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-beige/60 mt-32 py-16 bg-cream/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-beige/60">
            <div className="space-y-2">
              <div className="font-display font-extrabold text-2xl tracking-tighter text-olive uppercase">
                KRAXYY
              </div>
              <p className="text-xs text-charcoal-muted font-medium">
                Apply smarter. Go further.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-6 text-xs text-charcoal-muted font-medium">
              <a href="#autofill" className="hover:text-olive transition">
                Product
              </a>
              <a href="#how-it-works" className="hover:text-olive transition">
                How It Works
              </a>
              <a href="#extension" className="hover:text-olive transition">
                Extension
              </a>
              <a href="#pipeline" className="hover:text-olive transition">
                Applications
              </a>
              <Link to="/privacy" className="hover:text-olive transition">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-olive transition">
                Terms
              </Link>
            </nav>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-charcoal-muted gap-4">
            <p>© {new Date().getFullYear()} Kraxyy Apply Inc. All rights reserved.</p>
            <p className="tracking-wide">Designed for modern career ambition.</p>
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Right Connect Widget */}
      <ConnectWidget source="website" />
    </div>
  );
};

