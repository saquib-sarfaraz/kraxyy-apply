import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Trash2,
  Check,
  Star,
  Download,
  Edit2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { IResume } from '@kraxyy/types';
import { ResumeUploadModal } from '../../components/resume/ResumeUploadModal';

export const ResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<IResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchResumes = async () => {
    try {
      const data = await api.get<IResume[]>('/resumes');
      setResumes(data);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/resumes/${id}/default`, {});
      await fetchResumes();
    } catch (err) {
      alert((err as Error).message || 'Failed to set default');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      await fetchResumes();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete resume');
    }
  };

  const handleRename = async () => {
    if (!renameId || !renameValue.trim()) return;
    try {
      await api.patch(`/resumes/${renameId}/rename`, { name: renameValue.trim() });
      setRenameId(null);
      await fetchResumes();
    } catch (err) {
      alert((err as Error).message || 'Failed to rename');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-olive-50 text-olive text-[11px] font-bold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mustard" />
              Primary Source of Truth
            </span>
          </div>
          <h1 className="text-2xl font-editorial font-bold text-olive">Resume Vault</h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-xl leading-relaxed">
            Upload your resume to automatically generate your unified candidate profile, power job matching, and enable one-click autofill.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-5 py-3 bg-olive text-white rounded-subtle font-semibold text-xs hover:bg-olive-hover transition flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Resume</span>
        </button>
      </div>

      {/* Resumes Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-48 bg-white/60 rounded-card animate-pulse border border-beige"></div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-card border border-beige p-12 text-center space-y-4 shadow-soft">
            <div className="w-14 h-14 rounded-2xl bg-cream mx-auto flex items-center justify-center text-charcoal-muted">
              <FileText className="w-7 h-7 text-olive" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-charcoal">No resumes in your vault yet</p>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Upload your resume once. Kraxyy will automatically read your background, create your profile, and rank compatible jobs.
              </p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your First Resume</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`bg-white rounded-card border p-6 space-y-4 shadow-soft transition flex flex-col justify-between ${
                  resume.isDefault ? 'border-olive ring-1 ring-olive/20' : 'border-beige hover:border-olive/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-olive-50 flex items-center justify-center text-olive shrink-0 border border-olive-100">
                        <FileText className="w-5 h-5 text-mustard" />
                      </div>
                      <div className="overflow-hidden">
                        {renameId === resume.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="px-2 py-1 rounded bg-cream-50 border border-beige text-xs"
                            />
                            <button
                              onClick={handleRename}
                              className="p-1 bg-olive text-white rounded hover:bg-olive-hover"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h2 className="text-sm font-bold text-charcoal truncate" title={resume.originalName}>
                            {resume.originalName}
                          </h2>
                        )}
                        <p className="text-[11px] text-charcoal-muted mt-0.5">
                          Uploaded {new Date(resume.createdAt).toLocaleDateString()} • {(resume.fileSize / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>

                    {resume.isDefault ? (
                      <span className="px-2.5 py-1 rounded-full bg-olive text-white text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-mustard text-mustard" />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(resume.id)}
                        className="text-[11px] font-semibold text-charcoal-muted hover:text-olive px-2 py-1 rounded hover:bg-beige-100 transition shrink-0"
                      >
                        Make Default
                      </button>
                    )}
                  </div>

                  {/* Highlights from profile generation */}
                  <div className="p-3 bg-cream-50/70 rounded-xl border border-beige/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-charcoal">
                        {resume.parsedData?.suggestedTitle || 'Candidate Profile Synced'}
                      </span>
                      <span className="text-olive font-bold">
                        {resume.parsedData?.skills?.length || 0} skills detected
                      </span>
                    </div>
                    {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resume.parsedData.skills.slice(0, 5).map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-beige rounded text-[10px] font-medium text-charcoal"
                          >
                            {sk}
                          </span>
                        ))}
                        {resume.parsedData.skills.length > 5 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-charcoal-muted">
                            +{resume.parsedData.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-beige/60 text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-olive font-semibold hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <Link
                      to="/profile"
                      className="text-mustard font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Review Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setRenameId(resume.id);
                        setRenameValue(resume.originalName);
                      }}
                      className="p-1.5 text-charcoal-muted hover:text-olive rounded hover:bg-beige-100 transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="p-1.5 text-charcoal-muted hover:text-red-700 rounded hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern 5-Step Animated Resume Upload & Auto-Profile Generation Modal */}
      <ResumeUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => fetchResumes()}
      />
    </div>
  );
};
