import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { IJob } from '@kraxyy/types';
import {
  Search,
  MapPin,
  Bookmark,
  ExternalLink,
  Briefcase,
  DollarSign,
  Sparkles,
  Check
} from 'lucide-react';

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteFilter, setRemoteFilter] = useState('ALL');
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (remoteFilter !== 'ALL') params.append('remoteType', remoteFilter);

      const [jobsData, savedData] = await Promise.all([
        api.get<IJob[]>(`/jobs?${params.toString()}`),
        api.get<any[]>('/jobs/saved')
      ]);

      setJobs(jobsData);
      setSavedJobIds(new Set(savedData.map((s) => s.jobId)));
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [remoteFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleToggleSave = async (jobId: string) => {
    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        await api.delete(`/jobs/${jobId}/save`);
        const next = new Set(savedJobIds);
        next.delete(jobId);
        setSavedJobIds(next);
      } else {
        await api.post(`/jobs/${jobId}/save`, {});
        const next = new Set(savedJobIds);
        next.add(jobId);
        setSavedJobIds(next);
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to update saved job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-olive">
            Curated Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Discover roles compatible with Kraxyy Apply's instant form filling extension.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, skill (e.g. TypeScript, React), or company..."
              className="w-full pl-9 pr-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-xs sm:text-sm focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive"
            />
          </div>

          <select
            value={remoteFilter}
            onChange={(e) => setRemoteFilter(e.target.value)}
            className="px-4 py-2.5 rounded-subtle bg-cream-50 border border-beige text-xs font-semibold text-charcoal focus:outline-none focus:border-olive"
          >
            <option value="ALL">All Work Models</option>
            <option value="REMOTE">Remote Only</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Jobs Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-48 bg-white/60 rounded-card animate-pulse border border-beige"></div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-card border border-beige p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-charcoal">No jobs found matching criteria</p>
            <p className="text-xs text-charcoal-muted">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-card border border-beige p-6 shadow-soft hover:border-olive/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-beige-100 text-olive text-[10px] font-bold uppercase tracking-wider">
                        {job.source}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cream-50 text-charcoal-muted text-[10px] font-semibold">
                        {job.remoteType}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-charcoal">{job.title}</h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted">
                      <span className="font-semibold text-charcoal">{job.company}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-mustard" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1 font-semibold text-olive">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${job.salary.min?.toLocaleString()} - ${job.salary.max?.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-charcoal-muted line-clamp-2 max-w-2xl leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-cream-50 border border-beige/60 text-[10px] font-medium text-charcoal"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSave(job.id)}
                        title={isSaved ? 'Saved' : 'Save Job'}
                        className={`p-2 rounded-subtle border transition ${
                          isSaved
                            ? 'bg-mustard text-white border-mustard'
                            : 'bg-white border-beige text-charcoal-muted hover:text-mustard'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>

                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-mustard" />
                        <span>Apply & Auto-Fill</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <span className="text-[10px] text-charcoal-muted">
                      Posted {new Date(job.postedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
