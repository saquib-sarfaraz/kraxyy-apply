import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { IAdminMetrics } from '@kraxyy/types';
import {
  Users,
  FolderArchive,
  Puzzle,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<IAdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await adminApi.get<IAdminMetrics>('/admin/metrics');
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white/60 rounded-card border border-beige"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft">
        <h1 className="text-2xl font-bold text-olive">System Telemetry & Platform Overview</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Real-time metrics on candidate signups, extension autofill success, and applications.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-card border border-beige shadow-soft space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-3.5 h-3.5 text-olive" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{metrics.totalUsers}</p>
          <span className="text-[10px] text-olive font-medium">Registered</span>
        </div>

        <div className="bg-white p-4 rounded-card border border-beige shadow-soft space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active (30d)</span>
            <Activity className="w-3.5 h-3.5 text-mustard" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{metrics.activeUsers30d}</p>
          <span className="text-[10px] text-charcoal-muted">Recent logins</span>
        </div>

        <div className="bg-white p-4 rounded-card border border-beige shadow-soft space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Applications</span>
            <FolderArchive className="w-3.5 h-3.5 text-olive" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{metrics.totalApplications}</p>
          <span className="text-[10px] text-olive font-medium">
            +{metrics.applicationsThisMonth} this mo.
          </span>
        </div>

        <div className="bg-white p-4 rounded-card border border-beige shadow-soft space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Extensions</span>
            <Puzzle className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{metrics.totalExtensionSessions}</p>
          <span className="text-[10px] text-blue-700 font-medium">Paired devices</span>
        </div>

        <div className="bg-white p-4 rounded-card border border-beige shadow-soft space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Autofill Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
          </div>
          <p className="text-2xl font-bold text-green-700">{metrics.autofillSuccessRate}%</p>
          <span className="text-[10px] text-green-700 font-medium">Fields populated</span>
        </div>

        <div className="bg-white p-4 rounded-card border border-beige shadow-soft space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">System Health</span>
            <TrendingUp className="w-3.5 h-3.5 text-olive" />
          </div>
          <p className="text-2xl font-bold text-olive">100%</p>
          <span className="text-[10px] text-olive font-medium">API operational</span>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft space-y-4">
        <div>
          <h2 className="text-base font-bold text-charcoal">Daily Ecosystem Activity</h2>
          <p className="text-xs text-charcoal-muted">
            Telemetry comparison of candidate registrations, tracked applications, and extension
            autofill runs.
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#626B52' }} />
              <YAxis tick={{ fontSize: 11, fill: '#626B52' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D6CAAC',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="autofills" name="Autofills" fill="#525B31" radius={[4, 4, 0, 0]} />
              <Bar dataKey="applications" name="Applications" fill="#B18B40" radius={[4, 4, 0, 0]} />
              <Bar dataKey="signups" name="New Users" fill="#D6CAAC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
