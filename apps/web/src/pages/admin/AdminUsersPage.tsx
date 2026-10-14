import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const data = await api.get<any>(`/admin/users?${params.toString()}`);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to mark this user as ${nextStatus}?`)) return;

    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      await fetchUsers();
    } catch (err) {
      alert((err as Error).message || 'Failed to update user');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-olive">User Directory</h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Manage candidates, verify statuses, and inspect account activity.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search by name or email..."
              className="pl-9 pr-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs font-semibold text-charcoal cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-card border border-beige shadow-soft overflow-hidden">
        {loading ? (
          <div className="h-48 animate-pulse"></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-50 border-b border-beige text-charcoal-muted uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-50/50 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-charcoal">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-charcoal-muted">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-beige-100 text-olive text-[10px] font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          className="text-xs font-semibold text-olive hover:underline"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
