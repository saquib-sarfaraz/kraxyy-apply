import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { INSTALL_EXTENSION_URL } from '../../config/extension';
import { ChromeIcon } from '../../components/icons/ChromeIcon';
import {
  Sparkles,
  Key,
  Copy,
  Check,
  RefreshCw,
  Monitor,
  Trash2,
  HelpCircle,
  PlayCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Terminal
} from 'lucide-react';

export const ExtensionCompanionPage: React.FC = () => {
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showDevSetup, setShowDevSetup] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(300);

  // Interactive Test Form state
  const [testFirstName, setTestFirstName] = useState('');
  const [testLastName, setTestLastName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testLinkedin, setTestLinkedin] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testSummary, setTestSummary] = useState('');

  const fetchSessions = async () => {
    try {
      const data = await api.get<any[]>('/extension/sessions');
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleGeneratePairCode = async () => {
    setLoadingCode(true);
    try {
      const data = await api.post<{ pairCode: string; expiresInSeconds?: number }>('/extension/pair-code', {});
      setPairCode(data.pairCode);
      setTimeLeft(data.expiresInSeconds || 300);
    } catch (err) {
      alert((err as Error).message || 'Failed to generate code');
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    handleGeneratePairCode();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleCopyCode = () => {
    if (!pairCode) return;
    navigator.clipboard.writeText(pairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeSession = async (id: string) => {
    if (!confirm('Disconnect this extension session?')) return;
    try {
      await api.delete(`/extension/sessions/${id}`);
      await fetchSessions();
    } catch (err) {
      alert((err as Error).message || 'Failed to revoke session');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-mustard" />
          <span className="text-xs font-bold uppercase tracking-wider text-olive">
            Browser Integration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-olive">
          Kraxyy Apply Chrome Extension
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-2xl leading-relaxed">
          Connect your candidate profile to the browser extension to auto-fill job applications on
          Greenhouse, Lever, Workday, and custom company career pages.
        </p>
      </div>

      {/* Installation & Pairing Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Official Chrome Web Store Installation */}
        <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ChromeIcon className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mustard">
                Step 1
              </span>
            </div>
            <h2 className="text-base font-bold text-charcoal">
              Install Kraxyy Extension
            </h2>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Fill repetitive application fields in seconds. Add the official Kraxyy Apply extension to your Chrome browser from the Chrome Web Store.
            </p>
          </div>

          <div className="p-5 bg-cream rounded-xl border border-beige space-y-3">
            <div className="flex items-center justify-between text-xs text-charcoal">
              <span className="font-semibold">Chrome Web Store</span>
              <span className="text-[11px] font-mono text-olive font-bold">Official Release</span>
            </div>
            <a
              href={INSTALL_EXTENSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile w-full py-3 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center justify-center gap-2 shadow-sm group"
            >
              <ChromeIcon className="w-4 h-4" />
              <span>Install Chrome Extension</span>
              <ArrowRight className="w-3.5 h-3.5 text-mustard transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Collapsible Local Development Option */}
          <div className="border-t border-beige/60 pt-3">
            <button
              onClick={() => setShowDevSetup(!showDevSetup)}
              className="w-full flex items-center justify-between text-[11px] font-medium text-charcoal-muted hover:text-charcoal transition"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-olive" />
                <span>Install for local development</span>
              </span>
              {showDevSetup ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showDevSetup && (
              <div className="mt-3 p-3 bg-cream-50 rounded-subtle border border-beige/60 space-y-2 text-[11px] text-charcoal-muted">
                <p className="font-semibold text-charcoal">Load Unpacked in Chrome:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Navigate to <code className="font-mono text-olive font-bold">chrome://extensions</code></li>
                  <li>Enable <strong className="text-charcoal">Developer mode</strong> (top-right toggle).</li>
                  <li>Click <strong className="text-charcoal">Load unpacked</strong> and select directory:
                    <span className="font-mono text-[10px] text-olive block mt-0.5 select-all">/apps/extension/dist</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Pairing Code Generator */}
        <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-mustard" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mustard">
                Step 2
              </span>
            </div>
            <h2 className="text-base font-bold text-charcoal">
              Connect Your Account
            </h2>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Open the Kraxyy extension in your browser toolbar, enter this temporary connection code, and your profile will pair securely.
            </p>
          </div>

          <div className="p-5 bg-cream rounded-xl border border-beige text-center space-y-3">
            <div className="flex items-center justify-between px-2 text-[11px] font-bold text-olive uppercase tracking-wider">
              <span>Pairing Code</span>
              <span className={`font-mono ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-olive'}`}>
                {timeLeft > 0
                  ? `Expires in ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
                  : 'Code Expired'}
              </span>
            </div>
            <div className="text-4xl font-mono font-bold tracking-widest text-olive select-all">
              {loadingCode ? '••••-••••' : pairCode || '---- ----'}
            </div>

            <div className="flex justify-center gap-3 pt-1">
              <button
                onClick={handleCopyCode}
                disabled={timeLeft <= 0}
                className="px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleGeneratePairCode}
                className="px-3 py-2 bg-white border border-beige rounded-subtle text-xs font-semibold text-charcoal hover:border-olive transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-charcoal-muted" />
                <span>New Code</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-charcoal-muted text-center">
            🔒 Code expires in strictly 5 minutes. Creates a scoped, revocable session token.
          </p>
        </div>
      </div>

      {/* Connected Devices Table */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4">
        <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
          <Monitor className="w-4 h-4 text-olive" />
          <span>Connected Extension Sessions</span>
        </h2>

        {sessions.length === 0 ? (
          <p className="text-xs text-charcoal-muted py-3">
            No active extensions connected. Enter the 5-minute pairing code above in your browser extension to pair.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-beige text-charcoal-muted uppercase text-[10px]">
                  <th className="py-2.5">Device & Browser</th>
                  <th className="py-2.5">IP Address</th>
                  <th className="py-2.5">Last Active</th>
                  <th className="py-2.5">Session Validity</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/40">
                {sessions.map((sess) => {
                  const diffMs = sess.expiresAt ? new Date(sess.expiresAt).getTime() - Date.now() : 0;
                  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                  const expiryDisplay = diffMs > 0
                    ? `Expires in ${days > 0 ? `${days}d ${hours}h` : `${hours}h`}`
                    : '7 days session';

                  return (
                    <tr key={sess.id}>
                      <td className="py-3 font-semibold text-charcoal">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span>{sess.browser}</span>
                          <span className="text-[10px] font-normal text-charcoal-muted">v{sess.extensionVersion}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-charcoal-muted">
                        {sess.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3 text-charcoal-muted">
                        {new Date(sess.lastActive).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {expiryDisplay}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition"
                        >
                          Revoke Session
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive In-Browser Form Playground */}
      <div className="bg-cream-dark p-6 sm:p-8 rounded-2xl border border-beige space-y-6">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-olive" />
          <h2 className="text-xl font-editorial font-bold text-olive">
            Live Autofill Playground
          </h2>
        </div>
        <p className="text-xs text-charcoal-muted max-w-xl">
          Test the Chrome Extension directly on this page! When you have the extension installed,
          click the floating Kraxyy pill in the bottom right corner or open the extension popup to
          auto-fill this standard application form.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Application submitted in playground!');
          }}
          className="bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft space-y-4 max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">
                Candidate First Name
              </label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                autoComplete="given-name"
                value={testFirstName}
                onChange={(e) => setTestFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">
                Candidate Last Name
              </label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                autoComplete="family-name"
                value={testLastName}
                onChange={(e) => setTestLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                autoComplete="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1">LinkedIn Profile</label>
            <input
              type="url"
              name="linkedin_url"
              id="linkedin_url"
              value={testLinkedin}
              onChange={(e) => setTestLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1">Current Job Title</label>
            <input
              type="text"
              name="current_title"
              id="current_title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1">About You / Summary</label>
            <textarea
              name="summary"
              id="summary"
              rows={3}
              value={testSummary}
              onChange={(e) => setTestSummary(e.target.value)}
              placeholder="Brief professional summary..."
              className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
