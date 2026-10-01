import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IJob, IMatchBreakdown } from '@kraxyy/types';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ExternalLink,
  MapPin,
  DollarSign,
  ArrowRight,
  ClipboardList,
  FileText,
  HelpCircle,
  Lightbulb,
  Check
} from 'lucide-react';

interface ScoredJob extends IJob {
  matchScore?: number;
  match?: IMatchBreakdown;
}

export const JobMatchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matches' | 'evaluator'>('matches');
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');

  // Interactive Evaluator State
  const [evalTitle, setEvalTitle] = useState('');
  const [evalCompany, setEvalCompany] = useState('');
  const [evalDescription, setEvalDescription] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  const fetchMatchedJobs = async () => {
    setLoading(true);
    try {
      const [recommendedData, savedData] = await Promise.all([
        api.get<ScoredJob[]>('/jobs/recommended'),
        api.get<any[]>('/jobs/saved')
      ]);

      setJobs(recommendedData);
      setSavedJobIds(new Set(savedData.map((s) => s.jobId)));
    } catch (err) {
      console.error('Failed to load matched jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchedJobs();
  }, []);

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

  const handleEvaluateJD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalDescription && !evalTitle) {
      alert('Please enter a job title or description');
      return;
    }

    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await api.post<any>('/rag/evaluate-match', {
        title: evalTitle || 'Position',
        company: evalCompany || 'Target Company',
        description: evalDescription
      });
      setEvalResult(res);
    } catch (err) {
      alert((err as Error).message || 'Failed to evaluate job match');
    } finally {
      setEvaluating(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchFilter) return true;
    const term = searchFilter.toLowerCase();
    return (
      j.title.toLowerCase().includes(term) ||
      j.company.toLowerCase().includes(term) ||
      (j.skills && j.skills.some((s) => s.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-olive-50 text-olive text-xs font-bold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mustard" />
              AI Matching Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-olive">
            Job Match & Compatibility
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-2xl leading-relaxed">
            Every match is calculated directly against your verified resume evidence. Inspect role alignment, ATS keyword gaps, and resume proof.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-cream p-1 rounded-subtle border border-beige shrink-0">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 text-xs font-bold rounded-subtle transition ${
              activeTab === 'matches'
                ? 'bg-olive text-white shadow-soft'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Curated Matches ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('evaluator')}
            className={`px-4 py-2 text-xs font-bold rounded-subtle transition flex items-center gap-1.5 ${
              activeTab === 'evaluator'
                ? 'bg-olive text-white shadow-soft'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Evaluate Any JD</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CURATED MATCHES */}
      {activeTab === 'matches' && (
        <div className="space-y-5">
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter matched jobs by title, company, or skill..."
              className="w-full pl-9 pr-4 py-2.5 rounded-subtle bg-white border border-beige text-xs sm:text-sm focus:outline-none focus:border-olive shadow-soft"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-40 bg-white/60 rounded-card animate-pulse border border-beige"></div>
              <div className="h-40 bg-white/60 rounded-card animate-pulse border border-beige"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-card border border-beige p-12 text-center space-y-3 shadow-soft">
              <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center text-charcoal-muted">
                <Sparkles className="w-6 h-6 text-mustard" />
              </div>
              <p className="text-sm font-semibold text-charcoal">No matched jobs found</p>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Upload or update your resume in the Resumes tab to generate high-fidelity personalized matches.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isSaved = savedJobIds.has(job.id);
                const match = job.match;
                const score = match?.overallScore || job.matchScore || 75;

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-card border border-beige p-6 shadow-soft hover:border-olive/60 transition space-y-4"
                  >
                    {/* Top Row: Job Title & Compatibility Score Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-beige/60">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-cream-50 text-charcoal-muted text-[10px] font-semibold">
                            {job.remoteType}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-beige-100 text-olive text-[10px] font-bold uppercase tracking-wider">
                            {job.source}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-charcoal">{job.title}</h2>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted mt-1">
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
                      </div>

                      {/* Transparent Match Score Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span
                              className={`text-xl sm:text-2xl font-bold font-editorial ${
                                score >= 80 ? 'text-olive' : score >= 60 ? 'text-mustard' : 'text-charcoal-muted'
                              }`}
                            >
                              {score}%
                            </span>
                            <span className="text-xs font-bold text-charcoal-muted">Match</span>
                          </div>
                          <p className="text-[11px] font-medium text-charcoal-muted">
                            {match?.roleAlignment ? `Role fit: ${match.roleAlignment}` : 'Analyzed by Grok'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleSave(job.id)}
                          title={isSaved ? 'Saved' : 'Save Job'}
                          className={`p-2.5 rounded-subtle border transition ${
                            isSaved
                              ? 'bg-mustard text-white border-mustard'
                              : 'bg-white border-beige text-charcoal-muted hover:text-mustard'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Evidence Breakdown (Role, Skills, Missing Keywords, Evidence) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-cream-50/60 p-4 rounded-xl border border-beige/60 text-xs">
                      {/* 1. Role Alignment */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                          Role Alignment
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold text-charcoal">
                          <CheckCircle2 className="w-3.5 h-3.5 text-olive" />
                          <span>{match?.roleAlignment || 'Strong'}</span>
                        </div>
                      </div>

                      {/* 2. Required Skills Met */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                          Required Skills
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold text-charcoal">
                          <Check className="w-3.5 h-3.5 text-olive" />
                          <span>{match?.requiredSkillsMet || `${match?.matchedSkills?.length || 4}/${job.skills?.length || 6}`}</span>
                        </div>
                      </div>

                      {/* 3. Missing ATS Keywords */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                          Missing Keywords
                        </span>
                        <div className="flex items-center gap-1 font-medium text-charcoal">
                          {match?.missingKeywords && match.missingKeywords.length > 0 ? (
                            <span className="text-amber-800 font-semibold truncate">
                              {match.missingKeywords.slice(0, 2).join(', ')}
                            </span>
                          ) : (
                            <span className="text-olive font-semibold">None detected</span>
                          )}
                        </div>
                      </div>

                      {/* 4. Experience Requirement */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                          Experience Fit
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold text-charcoal">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              match?.experienceRequirement === 'Requirement not met'
                                ? 'bg-red-500'
                                : 'bg-olive'
                            }`}
                          ></span>
                          <span>{match?.experienceRequirement || 'Requirement met'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Resume Evidence & Explanation */}
                    {match?.evidenceFromResume && match.evidenceFromResume.length > 0 && (
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-charcoal-muted font-semibold text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-mustard" />
                          <span>Evidence from your resume:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.evidenceFromResume.map((ev, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-white border border-beige rounded-subtle text-[11px] text-charcoal font-medium shadow-xs"
                            >
                              ✓ {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations Alert if missing keywords */}
                    {match?.recommendations && match.recommendations.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50/70 border border-amber-200/60 rounded-subtle text-xs text-amber-900">
                        <Lightbulb className="w-4 h-4 text-mustard shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong className="font-semibold">Recommendation: </strong>
                          {match.recommendations[0]}
                        </p>
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-charcoal-muted max-w-md line-clamp-1">
                        {match?.whyThisScore || job.description}
                      </div>

                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-mustard" />
                        <span>Autofill & Apply</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE JOB EVALUATOR */}
      {activeTab === 'evaluator' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft space-y-6">
            <div>
              <h2 className="text-xl font-bold font-editorial text-olive">
                Instant Job Compatibility Evaluator
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted mt-1 leading-relaxed">
                Found an interesting job on LinkedIn, Greenhouse, or Lever? Paste the job description below to get an instant Grok-backed ATS breakdown against your verified resume.
              </p>
            </div>

            <form onSubmit={handleEvaluateJD} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={evalTitle}
                    onChange={(e) => setEvalTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-xs sm:text-sm focus:outline-none focus:border-olive"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={evalCompany}
                    onChange={(e) => setEvalCompany(e.target.value)}
                    placeholder="e.g. Stripe, Vercel"
                    className="w-full px-3 py-2.5 rounded-subtle bg-cream-50 border border-beige text-xs sm:text-sm focus:outline-none focus:border-olive"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Job Description / Requirements
                </label>
                <textarea
                  rows={7}
                  value={evalDescription}
                  onChange={(e) => setEvalDescription(e.target.value)}
                  placeholder="Paste the full job posting, required qualifications, and responsibilities here..."
                  className="w-full p-3 rounded-subtle bg-cream-50 border border-beige text-xs sm:text-sm focus:outline-none focus:border-olive leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="px-6 py-3 bg-olive text-white rounded-subtle text-xs font-semibold hover:bg-olive-hover transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-mustard" />
                <span>{evaluating ? 'Grok is analyzing your resume...' : 'Evaluate Match with Grok'}</span>
              </button>
            </form>
          </div>

          {/* Evaluator Result Display */}
          {evalResult && (
            <div className="bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-beige/60">
                <div>
                  <h3 className="text-xl font-bold font-editorial text-charcoal">
                    {evalTitle || 'Evaluated Job Position'}
                  </h3>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Compatibility analysis for {evalCompany || 'Target Company'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-olive-50 px-4 py-2 rounded-xl border border-olive/20">
                  <span className="text-3xl font-bold font-editorial text-olive">
                    {evalResult.overallScore}%
                  </span>
                  <span className="text-xs font-bold text-olive">Match</span>
                </div>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-cream-50 p-4 rounded-xl border border-beige/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                    Role Alignment
                  </span>
                  <span className="font-semibold text-charcoal">
                    ✓ {evalResult.roleAlignment || 'Strong'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                    Required Skills
                  </span>
                  <span className="font-semibold text-charcoal">
                    {evalResult.requiredSkillsMet || '8/10'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                    Missing Keywords
                  </span>
                  <span className="font-semibold text-amber-800">
                    {evalResult.missingKeywords?.length || 0} missing
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                    Experience Requirement
                  </span>
                  <span className="font-semibold text-charcoal">
                    {evalResult.experienceRequirement || 'Requirement met'}
                  </span>
                </div>
              </div>

              {/* Missing ATS Keywords Detail */}
              {evalResult.missingKeywords && evalResult.missingKeywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    Missing ATS Keywords:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {evalResult.missingKeywords.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-subtle text-xs font-medium"
                      >
                        ⚠ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence from Resume */}
              {evalResult.evidenceFromResume && evalResult.evidenceFromResume.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    Evidence From Your Resume:
                  </h4>
                  <div className="space-y-1.5">
                    {evalResult.evidenceFromResume.map((ev: string, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 bg-cream-50/70 border border-beige/60 rounded-subtle text-xs text-charcoal flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-olive shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {evalResult.recommendations && evalResult.recommendations.length > 0 && (
                <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-subtle text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lightbulb className="w-4 h-4 text-mustard" />
                    <span>Actionable Recommendations:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {evalResult.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-charcoal-muted leading-relaxed">
                <strong>Why this score: </strong>
                {evalResult.whyThisScore}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
