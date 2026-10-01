import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface ContactRequestItem {
  _id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  source: string;
  attachmentUrl?: string;
  status: 'NEW' | 'REPLIED' | 'CLOSED';
  adminNotes?: string;
  createdAt: string;
}

export const AdminContactRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ContactRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ContactRequestItem | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());

      const data = await adminApi.get<ContactRequestItem[]>(
        `/admin/contact-requests?${params.toString()}`
      );
      setRequests(data);
    } catch (err) {
      console.error('Failed to load contact requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, categoryFilter]);

  const handleUpdateStatus = async (id: string, newStatus: 'NEW' | 'REPLIED' | 'CLOSED') => {
    try {
      await adminApi.patch(`/admin/contact-requests/${id}/status`, { status: newStatus });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            NEW
          </span>
        );
      case 'REPLIED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            REPLIED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            CLOSED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-olive" />
            <h1 className="text-2xl font-bold text-olive">Contact & Connect Requests</h1>
          </div>
          <p className="text-xs text-charcoal-muted">
            Incoming inquiries, feedback, bug reports, and partnership proposals from the website and extension.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="px-3 py-2 bg-cream-50 hover:bg-cream border border-beige rounded-subtle text-xs font-semibold text-charcoal flex items-center gap-1.5 self-start md:self-auto transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-charcoal-muted" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-card border border-beige shadow-soft flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
            className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-beige rounded-subtle text-xs text-charcoal focus:outline-none focus:border-olive"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs font-semibold text-charcoal cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="REPLIED">Replied</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs font-semibold text-charcoal cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="Website">Website</option>
          <option value="Chrome Extension">Chrome Extension</option>
          <option value="Application / Auto-fill">Application / Auto-fill</option>
          <option value="Bug / Problem">Bug / Problem</option>
          <option value="Partnership">Partnership</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Main Table & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Requests Table */}
        <div className="lg:col-span-8 bg-white rounded-card border border-beige shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-charcoal-muted">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-xs text-charcoal-muted">
              No contact requests match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-50 border-b border-beige text-charcoal-muted uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/60">
                  {requests.map((req) => (
                    <tr
                      key={req._id}
                      onClick={() => setSelectedRequest(req)}
                      className={`hover:bg-cream/40 cursor-pointer transition ${
                        selectedRequest?._id === req._id ? 'bg-cream-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal">{req.name}</div>
                        <div className="text-[11px] text-charcoal-muted font-mono">{req.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-cream border border-beige text-[10px] font-medium text-charcoal">
                          {req.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono uppercase text-olive font-semibold">
                          {req.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-charcoal-muted text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={req.status}
                          onChange={(e) =>
                            handleUpdateStatus(
                              req._id,
                              e.target.value as 'NEW' | 'REPLIED' | 'CLOSED'
                            )
                          }
                          className="text-[11px] font-semibold border border-beige rounded px-2 py-1 bg-white cursor-pointer"
                        >
                          <option value="NEW">New</option>
                          <option value="REPLIED">Replied</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Request Detail Drawer */}
        <div className="lg:col-span-4 bg-white p-5 rounded-card border border-beige shadow-soft space-y-4">
          {selectedRequest ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-beige">
                <span className="text-[10px] font-mono font-bold uppercase text-mustard tracking-wider">
                  Request Details
                </span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-charcoal-muted block">
                    From
                  </span>
                  <div className="font-bold text-sm text-charcoal">{selectedRequest.name}</div>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-xs text-olive hover:underline font-mono"
                  >
                    {selectedRequest.email}
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted block">
                      Category
                    </span>
                    <span className="font-semibold text-charcoal">{selectedRequest.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted block">
                      Source
                    </span>
                    <span className="font-mono font-bold text-olive">{selectedRequest.source}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-charcoal-muted block">
                    Submitted Date
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="pt-2 border-t border-beige/60">
                <span className="text-[10px] uppercase font-bold text-charcoal-muted block mb-1.5">
                  Message
                </span>
                <div className="p-3 bg-cream-50 rounded-xl border border-beige/60 text-xs text-charcoal leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedRequest.message}
                </div>
              </div>

              {selectedRequest.attachmentUrl && (
                <div className="text-xs text-charcoal-muted">
                  <strong>Attachment:</strong> {selectedRequest.attachmentUrl}
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-3 border-t border-beige flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'REPLIED')}
                  className="flex-1 py-2 bg-cream hover:bg-cream-dark border border-beige text-charcoal font-semibold rounded-subtle text-xs transition"
                >
                  Mark Replied
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'CLOSED')}
                  className="flex-1 py-2 bg-olive text-white hover:bg-olive-hover font-semibold rounded-subtle text-xs transition"
                >
                  Close Request
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-charcoal-muted space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-beige-400 opacity-60" />
              <p>Select any contact request from the list to view its full message and manage status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
