import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Shield, KeyRound, AlertTriangle, CheckCircle2, Monitor, RefreshCw, Clock } from 'lucide-react';

interface ExtensionSession {
  id: string;
  browser: string;
  extensionVersion: string;
  ipAddress: string;
  lastActive: string;
  expiresAt?: string;
  createdAt: string;
}

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  // Extension Sessions
  const [sessions, setSessions] = useState<ExtensionSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res: any = await api.get('/extension/sessions');
      if (res.data?.success) {
        setSessions(res.data.data);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm('Revoke access for this extension session? The extension will be immediately disconnected.')) {
      try {
        await api.delete(`/extension/sessions/${sessionId}`);
        fetchSessions();
      } catch (err) {
        alert((err as Error).message || 'Failed to revoke session');
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);
    setChangingPass(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err) {
      setPassError((err as Error).message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('To confirm account deletion, please type "DELETE" below:');
    if (confirmation === 'DELETE') {
      try {
        await api.delete('/users/me');
        alert('Your account and profile have been removed.');
        logout();
      } catch (err) {
        alert((err as Error).message || 'Failed to delete account');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft">
        <h1 className="text-2xl font-editorial font-bold text-olive">Settings & Preferences</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Manage your account credentials, security preferences, and privacy controls.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4">
        <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
          <Shield className="w-4 h-4 text-olive" />
          <span>Account Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-charcoal-muted block mb-1">Full Name</label>
            <input
              readOnly
              value={`${user?.firstName} ${user?.lastName}`}
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-charcoal font-semibold"
            />
          </div>
          <div>
            <label className="text-charcoal-muted block mb-1">Email Address</label>
            <input
              readOnly
              value={user?.email}
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-charcoal font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Security - Password Change */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4">
        <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-mustard" />
          <span>Change Password</span>
        </h2>

        {passSuccess && (
          <div className="p-3 bg-green-50 text-green-800 text-xs rounded-subtle border border-green-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Password changed successfully</span>
          </div>
        )}

        {passError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-subtle border border-red-200">
            {passError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
            />
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars with uppercase & number"
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
            />
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-5 py-2.5 bg-olive text-white rounded-subtle font-semibold hover:bg-olive-hover transition disabled:opacity-50"
          >
            {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Connected Extension Sessions */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-olive" />
            <h2 className="text-base font-bold text-charcoal">Connected Chrome Extension</h2>
          </div>
          <button
            onClick={fetchSessions}
            disabled={loadingSessions}
            className="text-xs text-olive font-semibold flex items-center gap-1 hover:underline"
          >
            <RefreshCw className={`w-3 h-3 ${loadingSessions ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <p className="text-xs text-charcoal-muted leading-relaxed">
          Manage paired browser extensions. When paired via a 5-minute code, an active extension session remains securely connected for <strong>7 days</strong> with automatic renewal while active.
        </p>

        {sessions.length === 0 ? (
          <div className="p-4 bg-cream-50 rounded-subtle border border-beige text-xs text-charcoal-muted">
            No active browser extensions connected. Visit the <a href="/extension" className="text-olive font-bold underline">Extension Page</a> to generate a pairing code.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const diffMs = sess.expiresAt ? new Date(sess.expiresAt).getTime() - Date.now() : 0;
              const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
              const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
              const expiryLabel = diffMs > 0
                ? `Expires in ${days > 0 ? `${days} days ${hours} hours` : `${hours} hours`}`
                : 'Session expired';

              return (
                <div
                  key={sess.id}
                  className="p-4 bg-cream-50 rounded-xl border border-beige flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      <span className="font-bold text-charcoal">{sess.browser}</span>
                      <span className="text-[10px] text-charcoal-muted">v{sess.extensionVersion}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Connected
                      </span>
                    </div>
                    <div className="text-charcoal-muted flex items-center gap-2 text-[11px]">
                      <span>IP: {sess.ipAddress || '127.0.0.1'}</span>
                      <span>•</span>
                      <span>Last active: {new Date(sess.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-olive font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-olive" />
                      <span>{expiryLabel}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-subtle font-semibold transition self-start sm:self-center"
                  >
                    Revoke Session
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-card border border-red-200 shadow-soft space-y-3">
        <h2 className="text-base font-bold text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Danger Zone</span>
        </h2>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          Permanently delete your Kraxyy Apply candidate account, stored resumes, and application
          records. This action is immediate and non-reversible.
        </p>

        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded-subtle text-xs font-bold hover:bg-red-100 transition"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};
