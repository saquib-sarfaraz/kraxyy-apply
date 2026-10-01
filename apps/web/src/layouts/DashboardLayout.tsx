import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  BookmarkCheck,
  FolderArchive,
  UserCheck,
  Puzzle,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

import { BrandLogo } from '../components/brand/BrandLogo';
import { ConnectWidget } from '../components/connect/ConnectWidget';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/match', label: 'Job Match', icon: Sparkles },
  { to: '/saved-jobs', label: 'Saved Jobs', icon: BookmarkCheck },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/profile', label: 'Profile', icon: UserCheck },
  { to: '/applications', label: 'Applications', icon: FolderArchive },
  { to: '/extension', label: 'Extension', icon: Puzzle },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-cream flex text-charcoal font-sans selection:bg-mustard selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-cream-light border-r border-beige shrink-0 select-none">
        {/* Brand */}
        <div className="h-20 px-5 flex items-center border-b border-beige">
          <Link to="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-subtle text-sm font-medium transition ${
                  isActive
                    ? 'bg-olive text-white shadow-soft font-semibold'
                    : 'text-charcoal hover:bg-beige-100 hover:text-olive'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-mustard' : 'text-charcoal-muted'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Extension Quick Promo */}
        <div className="px-4 py-3 mx-4 mb-4 bg-beige-50 rounded-card border border-beige/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-mustard" />
            <span className="text-xs font-semibold text-olive">Chrome Extension</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mb-2">
            Auto-fill forms on Greenhouse, Lever & Workday.
          </p>
          <Link
            to="/extension"
            className="block text-center py-1.5 bg-olive text-white text-xs font-semibold rounded-subtle hover:bg-olive-hover transition"
          >
            Pair Extension
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-beige flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-mustard text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-semibold text-charcoal truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-charcoal-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-charcoal-muted hover:text-red-700 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-cream/90 backdrop-blur-md border-b border-beige px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-subtle hover:bg-beige-100 text-charcoal"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold font-editorial text-olive hidden sm:block">
              {NAV_ITEMS.find((n) => n.to === location.pathname)?.label || 'Overview'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/extension"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-olive-50 border border-olive-100 text-xs font-semibold text-olive hover:bg-olive-100 transition"
            >
              <span className="w-2 h-2 rounded-full bg-olive animate-pulse"></span>
              <span>Pair Chrome Extension</span>
            </Link>

            {/* Admin Console Shortcut - Only visible to authorized administrator */}
            {user?.email?.toLowerCase() === 'saquibsarfaraz47@gmail.com' && (
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-olive text-white text-xs font-semibold hover:bg-olive-hover transition shadow-xs"
                title="Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-mustard" />
                <span>Admin</span>
              </a>
            )}

            <button
              title="Notifications"
              className="p-2 rounded-full hover:bg-beige-100 text-charcoal-muted hover:text-olive relative transition"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mustard"></span>
            </button>

            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-mustard text-white font-bold text-xs flex items-center justify-center shadow-sm"
            >
              {user?.firstName?.[0] || 'U'}
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 bg-cream flex flex-col h-full z-10 border-r border-beige p-6">
            <div className="h-16 px-4 flex items-center justify-between border-b border-beige">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <BrandLogo size="sm" />
              </Link>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-subtle text-sm font-medium ${
                      isActive ? 'bg-olive text-white' : 'text-charcoal hover:bg-beige'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {user?.email?.toLowerCase() === 'saquibsarfaraz47@gmail.com' && (
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-subtle text-sm font-semibold bg-olive/10 text-olive hover:bg-olive/20 transition mb-3"
              >
                <ShieldCheck className="w-4 h-4 text-mustard" />
                <span>Admin Console</span>
              </a>
            )}

            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-red-700 font-medium hover:bg-red-50 rounded-subtle"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Connect Widget */}
      <ConnectWidget source="dashboard" />
    </div>
  );
};
