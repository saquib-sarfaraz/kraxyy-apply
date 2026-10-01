import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { IApplication, IUserProfile } from '@kraxyy/types';
import {
  FolderArchive,
  Clock,
  MessageSquare,
  Award,
  Sparkles,
  ArrowUpRight,
  Plus,
  FileText,
  Briefcase,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';
import { ResumeUploadModal } from '../../components/resume/ResumeUploadModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<{
    total: number;
    thisMonth: number;
    inProgress: number;
    interviews: number;
    offers: number;
    recentApplications: IApplication[];
  }>({
    total: 0,
    thisMonth: 0,
    inProgress: 0,
    interviews: 0,
    offers: 0,
    recentApplications: []
  });
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, profileData] = await Promise.all([
          api.get<any>('/applications/metrics'),
          api.get<IUserProfile>('/profile')
        ]);
        setMetrics(metricsData);
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white/60 rounded-card border border-beige"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-white/60 rounded-card border border-beige"></div>
          <div className="h-24 bg-white/60 rounded-card border border-beige"></div>
          <div className="h-24 bg-white/60 rounded-card border border-beige"></div>
          <div className="h-24 bg-white/60 rounded-card border border-beige"></div>
        </div>
      </div>
    );
  }

  const completionPct = profile?.completionPercentage || 0;

  return (
    <div className="space-y-8">
      {/* Welcome & Profile Completion Banner */}
      <div className="bg-white rounded-card border border-beige p-6 sm:p-8 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-olive">
            Good day, {user?.firstName}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl leading-relaxed">
            Your unified profile is ready for fast form filling on supported job boards. Review your
            application pipeline below.
          </p>
        </div>

        <div className="w-full md:w-72 bg-cream p-4 rounded-xl border border-beige shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal">Profile Strength</span>
            <span className="font-bold text-olive">{completionPct}%</span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-olive transition-all duration-500 rounded-full"
              style={{ width: `${completionPct}%` }}
            ></div>
          </div>
          <Link
            to="/profile"
            className="text-[11px] text-mustard font-bold hover:underline block text-right pt-0.5"
          >
            {completionPct === 100 ? 'Review Profile' : 'Complete Profile →'}
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-card border border-beige shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Applications
            </span>
            <FolderArchive className="w-4 h-4 text-olive" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-editorial text-charcoal">
            {metrics.total}
          </p>
          <span className="text-[11px] text-olive font-medium block">
            +{metrics.thisMonth} this month
          </span>
        </div>

        <div className="bg-white p-5 rounded-card border border-beige shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-mustard" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-editorial text-charcoal">
            {metrics.inProgress}
          </p>
          <span className="text-[11px] text-charcoal-muted block">Awaiting response</span>
        </div>

        <div className="bg-white p-5 rounded-card border border-beige shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Interviews
            </span>
            <MessageSquare className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-editorial text-charcoal">
            {metrics.interviews}
          </p>
          <span className="text-[11px] text-blue-700 font-medium block">Active conversation</span>
        </div>

        <div className="bg-white p-5 rounded-card border border-beige shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Offers
            </span>
            <Award className="w-4 h-4 text-green-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-editorial text-charcoal">
            {metrics.offers}
          </p>
          <span className="text-[11px] text-green-700 font-medium block">Received</span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center gap-1.5 shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5 text-mustard" />
          <span>Upload Resume</span>
        </button>
        <Link
          to="/applications"
          className="px-4 py-2 bg-white border border-beige text-charcoal rounded-subtle text-xs font-semibold hover:border-olive transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-olive" />
          <span>Add Application</span>
        </Link>
        <Link
          to="/resumes"
          className="px-4 py-2 bg-white border border-beige text-charcoal rounded-subtle text-xs font-semibold hover:border-olive transition flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-mustard" />
          <span>Manage Resumes</span>
        </Link>
        <Link
          to="/match"
          className="px-4 py-2 bg-white border border-beige text-charcoal rounded-subtle text-xs font-semibold hover:border-olive transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-mustard" />
          <span>Job Matches</span>
        </Link>
        <Link
          to="/extension"
          className="px-4 py-2 bg-beige-100 border border-beige text-olive rounded-subtle text-xs font-semibold hover:bg-beige transition flex items-center gap-1.5 ml-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-mustard" />
          <span>Pair Chrome Extension</span>
        </Link>
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white rounded-card border border-beige shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-beige/60">
          <div>
            <h2 className="text-base font-bold text-charcoal">Recent Applications</h2>
            <p className="text-xs text-charcoal-muted">Tracked candidates across all sources</p>
          </div>
          <Link
            to="/applications"
            className="text-xs font-semibold text-olive hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {metrics.recentApplications.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center text-charcoal-muted">
              <FolderArchive className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-charcoal">No applications recorded yet</p>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              Applications you fill using the Kraxyy Chrome Extension or add manually will appear
              here.
            </p>
            <Link
              to="/applications"
              className="inline-block px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition"
            >
              Add First Application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-beige text-charcoal-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-semibold">Job Title & Company</th>
                  <th className="py-2.5 font-semibold">Source</th>
                  <th className="py-2.5 font-semibold">Applied Date</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/50">
                {metrics.recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-cream-50/50 transition">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-charcoal text-sm">{app.jobTitle}</p>
                      <p className="text-charcoal-muted">{app.company}</p>
                    </td>
                    <td className="py-3 pr-4 text-charcoal-muted">{app.source}</td>
                    <td className="py-3 pr-4 text-charcoal">
                      {new Date(app.appliedDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'OFFER'
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'INTERVIEW'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'SCREENING'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-olive-50 text-olive'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to="/applications"
                        className="text-olive hover:underline font-semibold"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ResumeUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={async () => {
          try {
            const [metricsData, profileData] = await Promise.all([
              api.get<any>('/applications/metrics'),
              api.get<IUserProfile>('/profile')
            ]);
            setMetrics(metricsData);
            setProfile(profileData);
          } catch (err) {
            console.error('Failed to reload dashboard after upload:', err);
          }
        }}
      />
    </div>
  );
};
