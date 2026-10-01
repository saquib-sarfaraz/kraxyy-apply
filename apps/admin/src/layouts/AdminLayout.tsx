import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
  Sparkles,
  MessageSquare
} from 'lucide-react';

import { BrandLogo } from '../components/brand/BrandLogo';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-cream flex text-charcoal font-sans selection:bg-mustard selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-cream-light border-r border-beige shrink-0 flex flex-col justify-between">
        <div>
          <div className="h-20 px-5 flex items-center justify-between border-b border-beige">
            <BrandLogo size="sm" />
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-olive text-cream rounded font-bold uppercase">
              Admin
            </span>
          </div>

          <nav className="p-4 space-y-1.5">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-subtle text-xs font-semibold transition ${
                  isActive ? 'bg-olive text-white shadow-soft' : 'text-charcoal hover:bg-beige-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-mustard" />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-subtle text-xs font-semibold transition ${
                  isActive ? 'bg-olive text-white shadow-soft' : 'text-charcoal hover:bg-beige-100'
                }`
              }
            >
              <Users className="w-4 h-4 text-mustard" />
              <span>Users</span>
            </NavLink>

            <NavLink
              to="/contact-requests"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-subtle text-xs font-semibold transition ${
                  isActive ? 'bg-olive text-white shadow-soft' : 'text-charcoal hover:bg-beige-100'
                }`
              }
            >
              <MessageSquare className="w-4 h-4 text-mustard" />
              <span>Contact Requests</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Card */}
        <div className="p-4 border-t border-beige flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-charcoal truncate">{admin?.email}</p>
            <span className="text-[10px] text-olive font-semibold">{admin?.role}</span>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-charcoal-muted hover:text-red-700 rounded hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
