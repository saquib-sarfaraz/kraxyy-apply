import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

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
              to="/admin"
              end
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
              to="/admin/users"
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
              to="/admin/contact-requests"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-subtle text-xs font-semibold transition ${
                  isActive ? 'bg-olive text-white shadow-soft' : 'text-charcoal hover:bg-beige-100'
                }`
              }
            >
              <MessageSquare className="w-4 h-4 text-mustard" />
              <span>Contact Requests</span>
            </NavLink>

            <div className="pt-4 border-t border-beige/60 mt-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-subtle text-xs font-semibold text-charcoal-muted hover:text-charcoal hover:bg-beige-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to App</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Admin Card */}
        <div className="p-4 border-t border-beige flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-charcoal truncate">{user?.email}</p>
            <span className="text-[10px] text-olive font-semibold">{user?.role || 'ADMIN'}</span>
          </div>
          <button
            onClick={() => logout()}
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
