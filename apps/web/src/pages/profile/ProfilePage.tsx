import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  IUserProfile,
  IPersonalInfo,
  IProfessionalInfo,
  IEducation,
  IExperience,
  IProject,
  ICertification,
  ILanguage,
  IWorkAuthorization
} from '@kraxyy/types';
import {
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Globe,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isFromUpload = searchParams.get('from') === 'resume-upload';
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'personal' | 'professional' | 'experience' | 'education' | 'projects' | 'certifications' | 'languages' | 'workAuth'
  >('personal');

  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<IUserProfile>('/profile');
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.put<IUserProfile>('/profile', profile);
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert((err as Error).message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-8 text-center animate-pulse space-y-4">
        <div className="h-10 bg-white/60 rounded-card w-48 mx-auto"></div>
        <div className="h-96 bg-white/60 rounded-card"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-beige shadow-soft">
        <div>
          <h1 className="text-2xl font-editorial font-bold text-olive">Universal Candidate Profile</h1>
          <p className="text-xs text-charcoal-muted mt-1">
            This information powers instant field detection and filling in the Chrome Extension.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-olive text-white rounded-subtle font-semibold text-xs hover:bg-olive-hover transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-mustard" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Resume Ingestion Ready Banner */}
      {isFromUpload && !dismissedBanner && (
        <div className="bg-white rounded-card border border-olive/30 p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-olive text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-mustard" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-editorial text-olive">
                  Your profile is ready.
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-olive-50 text-olive text-[10px] font-bold">
                  Synced from Resume
                </span>
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5 leading-relaxed">
                We created it from your resume. Review anything you want to change.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/match')}
              className="px-4 py-2 bg-olive text-white text-xs font-semibold rounded-subtle hover:bg-olive-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-mustard" />
              <span>View Job Matches</span>
            </button>
            <button
              onClick={() => setDismissedBanner(true)}
              className="p-1.5 text-charcoal-muted hover:text-charcoal rounded hover:bg-beige-100 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Profile Tabs & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <aside className="bg-white p-3 rounded-card border border-beige shadow-soft space-y-1 h-fit">
          {[
            { key: 'personal', label: 'Personal Information', icon: User },
            { key: 'professional', label: 'Professional & Target', icon: Briefcase },
            { key: 'experience', label: 'Work Experience', icon: Briefcase },
            { key: 'education', label: 'Education History', icon: GraduationCap },
            { key: 'projects', label: 'Projects & Portfolio', icon: FolderGit2 },
            { key: 'certifications', label: 'Certifications', icon: Award },
            { key: 'languages', label: 'Languages', icon: Globe },
            { key: 'workAuth', label: 'Work Authorization', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-subtle text-xs font-semibold transition text-left ${
                  isActive
                    ? 'bg-olive text-white shadow-soft'
                    : 'text-charcoal hover:bg-beige-100 hover:text-olive'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-mustard' : 'text-charcoal-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panes */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-card border border-beige shadow-soft">
          {/* PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-olive font-editorial border-b border-beige pb-3">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.personal.firstName || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, firstName: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.personal.lastName || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, lastName: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.personal.email || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, email: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">Phone</label>
                  <input
                    type="text"
                    value={profile.personal.phone || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, phone: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">City</label>
                  <input
                    type="text"
                    value={profile.personal.city || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, city: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={profile.personal.stateOrProvince || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, stateOrProvince: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">Country</label>
                  <input
                    type="text"
                    value={profile.personal.country || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, country: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={profile.personal.linkedin || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, linkedin: e.target.value }
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={profile.personal.github || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personal: { ...profile.personal, github: e.target.value }
                      })
                    }
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Portfolio / Personal Website
                </label>
                <input
                  type="url"
                  value={profile.personal.portfolio || profile.personal.website || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: {
                        ...profile.personal,
                        portfolio: e.target.value,
                        website: e.target.value
                      }
                    })
                  }
                  placeholder="https://yourportfolio.dev"
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                />
              </div>
            </div>
          )}

          {/* PROFESSIONAL INFO */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-olive font-editorial border-b border-beige pb-3">
                Professional Overview & Preferences
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Current Title
                  </label>
                  <input
                    type="text"
                    value={profile.professional.currentTitle || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        professional: { ...profile.professional, currentTitle: e.target.value }
                      })
                    }
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Total Years of Experience
                  </label>
                  <input
                    type="number"
                    value={profile.professional.yearsOfExperience || 0}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        professional: {
                          ...profile.professional,
                          yearsOfExperience: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={4}
                  value={profile.professional.summary || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      professional: { ...profile.professional, summary: e.target.value }
                    })
                  }
                  placeholder="A concise synopsis of your skills, background, and career accomplishments."
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Core Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={profile.professional.skills.join(', ')}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      professional: {
                        ...profile.professional,
                        skills: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      }
                    })
                  }
                  placeholder="TypeScript, React, Node.js, MongoDB, AWS"
                  className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Remote Preference
                  </label>
                  <select
                    value={profile.professional.remotePreference || 'FLEXIBLE'}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        professional: {
                          ...profile.professional,
                          remotePreference: e.target.value as any
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  >
                    <option value="REMOTE_ONLY">Remote Only</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">On-site</option>
                    <option value="FLEXIBLE">Flexible / Any</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Target Annual Salary (USD)
                  </label>
                  <input
                    type="number"
                    value={profile.professional.salaryExpectations?.expected || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        professional: {
                          ...profile.professional,
                          salaryExpectations: {
                            currency: 'USD',
                            period: 'YEARLY',
                            expected: Number(e.target.value)
                          }
                        }
                      })
                    }
                    placeholder="175000"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* WORK EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-beige pb-3">
                <h2 className="text-lg font-bold text-olive font-editorial">Work Experience</h2>
                <button
                  type="button"
                  onClick={() => {
                    const newExp: IExperience = {
                      id: uuidv4(),
                      company: '',
                      jobTitle: '',
                      startDate: '',
                      isCurrent: false,
                      description: ''
                    };
                    setProfile({
                      ...profile,
                      experiences: [newExp, ...profile.experiences]
                    });
                  }}
                  className="px-3 py-1.5 bg-olive-50 border border-olive-100 text-olive rounded-subtle text-xs font-semibold hover:bg-olive-100 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              {profile.experiences.map((exp, idx) => (
                <div key={exp.id || idx} className="p-4 bg-cream-50 rounded-xl border border-beige space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-olive uppercase tracking-wider">
                      Position #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setProfile({
                          ...profile,
                          experiences: profile.experiences.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-red-700 hover:text-red-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => {
                        const next = [...profile.experiences];
                        next[idx].company = e.target.value;
                        setProfile({ ...profile, experiences: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.jobTitle}
                      onChange={(e) => {
                        const next = [...profile.experiences];
                        next[idx].jobTitle = e.target.value;
                        setProfile({ ...profile, experiences: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Start Date (YYYY-MM)"
                      value={exp.startDate}
                      onChange={(e) => {
                        const next = [...profile.experiences];
                        next[idx].startDate = e.target.value;
                        setProfile({ ...profile, experiences: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                    <input
                      type="text"
                      placeholder="End Date (or Current)"
                      value={exp.endDate || ''}
                      onChange={(e) => {
                        const next = [...profile.experiences];
                        next[idx].endDate = e.target.value;
                        setProfile({ ...profile, experiences: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Key achievements and technologies utilized..."
                    value={exp.description || ''}
                    onChange={(e) => {
                      const next = [...profile.experiences];
                      next[idx].description = e.target.value;
                      setProfile({ ...profile, experiences: next });
                    }}
                    className="w-full px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-beige pb-3">
                <h2 className="text-lg font-bold text-olive font-editorial">Education</h2>
                <button
                  type="button"
                  onClick={() => {
                    const newEdu: IEducation = {
                      id: uuidv4(),
                      institution: '',
                      degree: '',
                      fieldOfStudy: '',
                      startDate: ''
                    };
                    setProfile({ ...profile, educations: [newEdu, ...profile.educations] });
                  }}
                  className="px-3 py-1.5 bg-olive-50 border border-olive-100 text-olive rounded-subtle text-xs font-semibold hover:bg-olive-100 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>

              {profile.educations.map((edu, idx) => (
                <div key={edu.id || idx} className="p-4 bg-cream-50 rounded-xl border border-beige space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-olive uppercase tracking-wider">
                      Degree #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setProfile({
                          ...profile,
                          educations: profile.educations.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-red-700 hover:text-red-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="University / Institution"
                      value={edu.institution}
                      onChange={(e) => {
                        const next = [...profile.educations];
                        next[idx].institution = e.target.value;
                        setProfile({ ...profile, educations: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.S.)"
                      value={edu.degree}
                      onChange={(e) => {
                        const next = [...profile.educations];
                        next[idx].degree = e.target.value;
                        setProfile({ ...profile, educations: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Field of Study"
                      value={edu.fieldOfStudy}
                      onChange={(e) => {
                        const next = [...profile.educations];
                        next[idx].fieldOfStudy = e.target.value;
                        setProfile({ ...profile, educations: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Graduation Year"
                      value={edu.endDate || ''}
                      onChange={(e) => {
                        const next = [...profile.educations];
                        next[idx].endDate = e.target.value;
                        setProfile({ ...profile, educations: next });
                      }}
                      className="px-3 py-2 rounded-subtle bg-white border border-beige text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WORK AUTHORIZATION */}
          {activeTab === 'workAuth' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-olive font-editorial border-b border-beige pb-3">
                Work Authorization & Eligibility
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-cream-50 rounded-xl border border-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.workAuthorization.authorizedToWork}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        workAuthorization: {
                          ...profile.workAuthorization,
                          authorizedToWork: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 rounded text-olive focus:ring-olive"
                  />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">
                      Legally Authorized to Work
                    </span>
                    <span className="text-[11px] text-charcoal-muted">
                      You possess legal entitlement to work in your target country.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-cream-50 rounded-xl border border-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.workAuthorization.sponsorshipRequired}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        workAuthorization: {
                          ...profile.workAuthorization,
                          sponsorshipRequired: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 rounded text-olive focus:ring-olive"
                  />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">
                      Visa Sponsorship Required
                    </span>
                    <span className="text-[11px] text-charcoal-muted">
                      You require visa sponsorship now or in the future (e.g. H-1B, TN, O-1).
                    </span>
                  </div>
                </label>

                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Visa / Citizenship Status Notes
                  </label>
                  <input
                    type="text"
                    value={profile.workAuthorization.visaStatus || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        workAuthorization: {
                          ...profile.workAuthorization,
                          visaStatus: e.target.value
                        }
                      })
                    }
                    placeholder="e.g. US Citizen / Green Card Holder / STEM OPT"
                    className="w-full px-3 py-2 rounded-subtle bg-cream-50 border border-beige text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {['projects', 'certifications', 'languages'].includes(activeTab) && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-olive font-editorial border-b border-beige pb-3 capitalize">
                {activeTab}
              </h2>
              <p className="text-xs text-charcoal-muted">
                Section details saved in your candidate database and synced with extension.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
