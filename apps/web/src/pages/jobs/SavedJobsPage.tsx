import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IJob } from '@kraxyy/types';
import { Bookmark, ExternalLink, Trash2, MapPin, Sparkles } from 'lucide-react';

export const SavedJobsPage: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<Array<{ id: string; jobId: string; job: IJob }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const data = await api.get<any[]>('/jobs/saved');
      setSavedJobs(data);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (jobId: string) => {
    try {
      await api.delete(`/jobs/${jobId}/save`);
      await fetchSaved();
    } catch (err) {
      alert((err as Error).message || 'Failed to remove saved job');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-card border border-beige shadow-soft">
        <h1 className="text-2xl font-editorial font-bold text-olive">Saved Jobs</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Roles you've bookmarked for later review and application.
        </p>
      </div>

      {loading ? (
        <div className="h-48 bg-white/60 rounded-card animate-pulse border border-beige"></div>
      ) : savedJobs.length === 0 ? (
        <div className="bg-white rounded-card border border-beige p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center text-charcoal-muted">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-charcoal">No saved jobs</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            Bookmark opportunities from the job discovery page to review them later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedJobs.map(({ id, jobId, job }) => (
            <div
              key={id}
              className="bg-white rounded-card border border-beige p-5 shadow-soft flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold text-charcoal">{job.title}</h3>
                <p className="text-xs text-charcoal-muted flex items-center gap-2">
                  <span className="font-semibold text-charcoal">{job.company}</span>
                  <span>•</span>
                  <MapPin className="w-3.5 h-3.5 text-mustard" />
                  <span>{job.location}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-mustard" />
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleRemove(jobId)}
                  title="Remove from saved"
                  className="p-2 text-charcoal-muted hover:text-red-700 rounded-subtle border border-beige hover:border-red-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
