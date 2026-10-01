import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IApplication, ApplicationStatus } from '@kraxyy/types';
import {
  FolderArchive,
  Plus,
  ExternalLink,
  Trash2,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  MessageSquare,
  Award,
  XCircle,
  X
} from 'lucide-react';

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'All Applications' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SCREENING', label: 'Screening' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'OFFER', label: 'Offer' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SAVED', label: 'Saved' }
];

export const ApplicationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null);

  // New Application Form State
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formJobUrl, setFormJobUrl] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formStatus, setFormStatus] = useState<ApplicationStatus>('APPLIED');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      const query = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
      const data = await api.get<IApplication[]>(`/applications${query}`);
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/applications', {
        jobTitle: formJobTitle,
        company: formCompany,
        jobUrl: formJobUrl,
        location: formLocation,
        salary: formSalary,
        status: formStatus,
        appliedDate: new Date().toISOString(),
        notes: formNotes,
        source: 'MANUAL'
      });

      setIsDrawerOpen(false);
      setFormJobTitle('');
      setFormCompany('');
      setFormJobUrl('');
      setFormLocation('');
      setFormSalary('');
      setFormNotes('');
      await fetchApplications();
    } catch (err) {
      alert((err as Error).message || 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await api.patch(`/applications/${id}`, { status: newStatus });
      await fetchApplications();
      if (selectedApp && selectedApp.id === id) {
        const updated = await api.get<IApplication>(`/applications/${id}`);
        setSelectedApp(updated);
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      setSelectedApp(null);
      await fetchApplications();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-beige shadow-soft">
        <div>
          <h1 className="text-2xl font-editorial font-bold text-olive">Application Pipeline</h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Track every role from initial form submission to final decision.
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="px-5 py-2.5 bg-olive text-white rounded-subtle font-semibold text-xs hover:bg-olive-hover transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-beige">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-subtle text-xs font-semibold whitespace-nowrap transition ${
              activeTab === tab.key
                ? 'bg-olive text-white shadow-soft'
                : 'bg-white border border-beige text-charcoal hover:border-olive'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="h-48 bg-white/60 rounded-card animate-pulse border border-beige"></div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-card border border-beige p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center text-charcoal-muted">
              <FolderArchive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-charcoal">No applications in this view</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              Applications logged via the Chrome Extension or added manually will appear in this
              tracker.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-card border border-beige p-5 shadow-soft hover:border-olive/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-charcoal">{app.jobTitle}</h3>
                    {app.jobUrl && (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-charcoal-muted hover:text-olive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-charcoal-muted flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-mustard" />
                    <span className="font-semibold text-charcoal">{app.company}</span>
                    {app.location && <span>• {app.location}</span>}
                    {app.salary && <span>• {app.salary}</span>}
                  </p>

                  <p className="text-[11px] text-charcoal-muted flex items-center gap-1.5 pt-0.5">
                    <Calendar className="w-3 h-3 text-olive" />
                    <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                    <span>• via {app.source}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Status Dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                    className="px-3 py-1.5 rounded-subtle bg-cream-50 border border-beige text-xs font-bold text-olive focus:outline-none focus:border-olive"
                  >
                    <option value="SAVED">Saved</option>
                    <option value="APPLIED">Applied</option>
                    <option value="SCREENING">Screening</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>

                  <button
                    onClick={() => setSelectedApp(app)}
                    className="px-3 py-1.5 bg-white border border-beige text-xs font-semibold text-charcoal rounded-subtle hover:border-olive transition"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => handleDelete(app.id)}
                    title="Delete"
                    className="p-1.5 text-charcoal-muted hover:text-red-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Application Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 sm:p-8 space-y-6 overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between border-b border-beige pb-4">
              <h2 className="text-xl font-editorial font-bold text-olive">Add Application</h2>
              <button onClick={() => setIsDrawerOpen(false)}>
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formJobTitle}
                  onChange={(e) => setFormJobTitle(e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Stripe, Vercel, Linear"
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Job URL</label>
                <input
                  type="url"
                  value={formJobUrl}
                  onChange={(e) => setFormJobUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Remote / New York"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    placeholder="$160k - $185k"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Initial Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                >
                  <option value="APPLIED">Applied</option>
                  <option value="SCREENING">Screening</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="SAVED">Saved for Later</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Notes & Follow-ups</label>
                <textarea
                  rows={4}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Details about recruiter call, interview rounds, questions asked..."
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-1/2 py-2.5 border border-beige rounded-subtle font-semibold text-charcoal-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-olive text-white rounded-subtle font-semibold hover:bg-olive-hover transition"
                >
                  {submitting ? 'Saving...' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-beige max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-modal">
            <div className="flex items-start justify-between border-b border-beige pb-4">
              <div>
                <h3 className="text-xl font-editorial font-bold text-olive">
                  {selectedApp.jobTitle}
                </h3>
                <p className="text-xs text-charcoal font-semibold">{selectedApp.company}</p>
              </div>
              <button onClick={() => setSelectedApp(null)}>
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Current Status:</span>
                <span className="font-bold text-olive">{selectedApp.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Applied Date:</span>
                <span className="font-semibold">
                  {new Date(selectedApp.appliedDate).toLocaleDateString()}
                </span>
              </div>
              {selectedApp.salary && (
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Salary:</span>
                  <span className="font-semibold">{selectedApp.salary}</span>
                </div>
              )}
            </div>

            {/* Timeline Events */}
            <div className="space-y-3 pt-2 border-t border-beige/60">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Status History
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedApp.timeline.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-2.5 bg-cream-50 rounded-subtle border border-beige/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-olive block">{t.status}</span>
                      <span className="text-[10px] text-charcoal-muted">{t.note}</span>
                    </div>
                    <span className="text-[10px] text-charcoal-muted">
                      {new Date(t.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
