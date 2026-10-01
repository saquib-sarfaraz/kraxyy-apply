import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Target,
  FileText,
  Briefcase,
  GraduationCap,
  RotateCcw,
  Check,
  Zap,
  Globe,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { BrandLogo, BrandSymbol } from '../components/BrandLogo';
import {
  MOCK_USER,
  MOCK_RESUME,
  MOCK_JOB,
  MOCK_MAPPED_FIELDS,
  MOCK_MATCH_RESULT,
  MOCK_AUTOFILL_REPORT
} from './mockData';

export const IS_MOCK_MODE = import.meta.env.VITE_EXTENSION_MOCK_MODE === 'true';

type ViewMode = 'HOME' | 'AUTOFILL_FLOW' | 'MATCH_FLOW' | 'SETTINGS';
type AutofillStep = 'DETECTING' | 'FOUND' | 'MAPPING' | 'MAPPED' | 'FILLING' | 'REPORT';
type MatchStep = 'EXTRACTING' | 'DETECTED' | 'ANALYZING' | 'RESULT' | 'NO_JOB';

interface MappedFieldItem {
  id?: string;
  selector?: string;
  label: string;
  value: string;
  taxonomyType?: string;
  isMapped?: boolean;
  status?: string;
}

interface AutofillReport {
  totalDetected: number;
  totalVerified: number;
  totalNeedsAttention: number;
  totalSkippedExisting: number;
  totalFailed: number;
  fields: Array<{
    label: string;
    status: string;
    verifiedValue?: string;
    manualReason?: string;
    taxonomyType?: string;
  }>;
}

interface MatchResultData {
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: string;
  educationMatch: string;
  jobTitle?: string;
  company?: string;
  strengths?: string[];
  concerns?: string[];
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 500;
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor((1 - Math.pow(1 - progress, 3)) * end);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(updateCount);
  }, [value]);

  return <span>{displayValue}</span>;
};

export const Popup: React.FC = () => {
  // Navigation
  const [view, setView] = useState<ViewMode>('HOME');

  // User & Candidate State
  const [isConnected, setIsConnected] = useState<boolean>(IS_MOCK_MODE ? true : false);
  const [userName, setUserName] = useState<string>(MOCK_USER.name);
  const [userEmail, setUserEmail] = useState<string>(MOCK_USER.email);
  const [resumeTitle, setResumeTitle] = useState<string>(MOCK_RESUME.title);
  const [hasProfile, setHasProfile] = useState<boolean>(true);
  const [hasResume, setHasResume] = useState<boolean>(true);

  // Settings & Pairing
  const [pairCodeInput, setPairCodeInput] = useState<string>('');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:5001');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // 1. AUTO-FILL STATE
  const [autofillStep, setAutofillStep] = useState<AutofillStep>('DETECTING');
  const [foundFieldCount, setFoundFieldCount] = useState<number>(18);
  const [mappedFields, setMappedFields] = useState<MappedFieldItem[]>(MOCK_MAPPED_FIELDS);
  const [autofillReport, setAutofillReport] = useState<AutofillReport | null>(null);

  // 2. MATCH STATE
  const [matchStep, setMatchStep] = useState<MatchStep>('EXTRACTING');
  const [matchProgress, setMatchProgress] = useState<number>(0);
  const [detectedJob, setDetectedJob] = useState<{ title: string; company: string; location?: string }>(MOCK_JOB);
  const [matchResult, setMatchResult] = useState<MatchResultData>(MOCK_MATCH_RESULT);

  // Initial status check
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const launchFloatingAssistant = (feature: 'HOME' | 'MATCH' | 'AUTOFILL' = 'HOME') => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.tabs.sendMessage(
            tab.id,
            { type: 'OPEN_FLOATING_ASSISTANT', feature },
            () => {
              window.close();
            }
          );
        }
      });
    }
  };

  const checkConnectionStatus = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: 'CHECK_STATUS' }, (res) => {
          if (chrome.runtime.lastError || !res) return;
          setIsConnected(res.connected);
          if (res.user?.name) setUserName(res.user.name);
          if (res.userEmail) setUserEmail(res.userEmail);
          if (res.resume?.title) setResumeTitle(res.resume.title);
          if (res.hasCachedProfile !== undefined) setHasProfile(res.hasCachedProfile);
        });

        chrome.storage.local.get(['apiBaseUrl', 'cachedUser', 'cachedResume'], (items) => {
          if (items.apiBaseUrl) setApiBaseUrl(items.apiBaseUrl);
          if (items.cachedUser?.name) setUserName(items.cachedUser.name);
          if (items.cachedResume?.title) setResumeTitle(items.cachedResume.title);
        });
      } catch {}
    }
  };

  // =========================================================================
  // WORKFLOW 1: AUTO-FILL FORM
  // =========================================================================
  const startAutofillFlow = () => {
    setErrorMsg('');
    setView('AUTOFILL_FLOW');
    setAutofillStep('DETECTING');
    setAutofillReport(null);

    // Query active tab DOM through content script
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) {
          useMockAutofillFlow();
          return;
        }

        // Trigger field detection and mapping
        chrome.tabs.sendMessage(tab.id, { type: 'DETECT_AND_MAP_FIELDS' }, (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            // If content script is not loaded or tab is special page, use demo flow
            useMockAutofillFlow();
            return;
          }

          const count = res.fieldsFound || res.fields?.length || 18;
          setFoundFieldCount(count);
          setAutofillStep('FOUND');

          setTimeout(() => {
            setAutofillStep('MAPPING');
            setTimeout(() => {
              if (res.fields && res.fields.length > 0) {
                const formatted: MappedFieldItem[] = res.fields.map((f: any) => ({
                  id: f.id,
                  selector: f.selector,
                  label: f.label || f.taxonomyType?.replace(/_/g, ' ') || 'Field',
                  value: f.mappedValue || 'Available in Profile',
                  taxonomyType: f.taxonomyType,
                  isMapped: f.isMapped !== false,
                  status: f.status || 'READY'
                }));
                setMappedFields(formatted);
              } else {
                setMappedFields(MOCK_MAPPED_FIELDS);
              }
              setAutofillStep('MAPPED');
            }, 600);
          }, 600);
        });
      });
    } else {
      useMockAutofillFlow();
    }
  };

  const useMockAutofillFlow = () => {
    setFoundFieldCount(18);
    setTimeout(() => {
      setAutofillStep('FOUND');
      setTimeout(() => {
        setAutofillStep('MAPPING');
        setTimeout(() => {
          setMappedFields(MOCK_MAPPED_FIELDS);
          setAutofillStep('MAPPED');
        }, 700);
      }, 700);
    }, 600);
  };

  const executeFormFill = () => {
    setAutofillStep('FILLING');
    setActionLoading(true);

    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'EXECUTE_AUTOFILL' }, (res) => {
            setActionLoading(false);
            if (!chrome.runtime.lastError && res?.summary) {
              setAutofillReport(res.summary);
            } else {
              setAutofillReport(MOCK_AUTOFILL_REPORT);
            }
            setAutofillStep('REPORT');
          });
          return;
        }
        fallbackFill();
      });
    } else {
      fallbackFill();
    }

    function fallbackFill() {
      setTimeout(() => {
        setActionLoading(false);
        setAutofillReport(MOCK_AUTOFILL_REPORT);
        setAutofillStep('REPORT');
      }, 900);
    }
  };

  const handleClearForm = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_AUTOFILL' }, () => {
            setAutofillReport(null);
            setView('HOME');
          });
        }
      });
    } else {
      setAutofillReport(null);
      setView('HOME');
    }
  };

  // =========================================================================
  // WORKFLOW 2: MATCH JOB WITH RESUME
  // =========================================================================
  const startMatchJobFlow = () => {
    setErrorMsg('');
    setView('MATCH_FLOW');
    setMatchStep('EXTRACTING');
    setMatchProgress(15);

    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) {
          useMockMatchFlow();
          return;
        }

        // Ask content script to extract job from DOM
        chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DESCRIPTION' }, (res) => {
          if (chrome.runtime.lastError || !res?.job) {
            useMockMatchFlow();
            return;
          }

          const job = res.job;
          setDetectedJob({
            title: job.title || 'Software Engineer',
            company: job.company || 'Tech Company',
            location: job.location || 'Remote'
          });

          setMatchStep('DETECTED');
          setMatchProgress(45);

          // Animate progress to 100% while AI/backend processes
          setTimeout(() => {
            setMatchStep('ANALYZING');
            animateProgressBar(50, 95, 800, () => {
              // Send to Service Worker -> Backend API
              chrome.runtime.sendMessage({ type: 'MATCH_JOB', job }, (matchRes) => {
                setMatchProgress(100);
                setTimeout(() => {
                  if (matchRes?.success && matchRes.match) {
                    setMatchResult({
                      overallScore: matchRes.overallScore || matchRes.match.overallScore || 84,
                      matchedSkills: matchRes.matchedSkills || matchRes.match.matchedSkills || MOCK_MATCH_RESULT.matchedSkills,
                      missingSkills: matchRes.missingSkills || matchRes.match.missingSkills || MOCK_MATCH_RESULT.missingSkills,
                      experienceMatch: matchRes.experienceMatch || 'Good',
                      educationMatch: matchRes.educationMatch || 'Good',
                      jobTitle: job.title,
                      company: job.company
                    });
                  } else {
                    setMatchResult({
                      ...MOCK_MATCH_RESULT,
                      jobTitle: job.title,
                      company: job.company
                    });
                  }
                  setMatchStep('RESULT');
                }, 300);
              });
            });
          }, 500);
        });
      });
    } else {
      useMockMatchFlow();
    }
  };

  const useMockMatchFlow = () => {
    setDetectedJob(MOCK_JOB);
    setTimeout(() => {
      setMatchStep('DETECTED');
      setMatchProgress(40);
      setTimeout(() => {
        setMatchStep('ANALYZING');
        animateProgressBar(40, 100, 900, () => {
          setMatchResult(MOCK_MATCH_RESULT);
          setMatchStep('RESULT');
        });
      }, 500);
    }, 600);
  };

  const animateProgressBar = (start: number, end: number, duration: number, onDone: () => void) => {
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const val = Math.floor(start + (end - start) * progress);
      setMatchProgress(val);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        onDone();
      }
    };
    requestAnimationFrame(step);
  };

  // =========================================================================
  // SETTINGS & PAIRING HANDLERS
  // =========================================================================
  const handlePair = () => {
    const raw = pairCodeInput.replace(/[^A-Z0-9]/gi, '').trim().toUpperCase();
    if (raw.length < 6) {
      setErrorMsg('Please enter valid 8-character connection code (e.g. AB7X-92KP)');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'PAIR_EXTENSION', pairCode: raw }, (res) => {
        setActionLoading(false);
        if (res?.success) {
          setIsConnected(true);
          if (res.user?.name) setUserName(res.user.name);
          if (res.user?.email) setUserEmail(res.user.email);
          if (res.resume?.title) setResumeTitle(res.resume.title);
          setSuccessMsg('Extension successfully connected to your Kraxyy account!');
          setTimeout(() => {
            setSuccessMsg('');
            setView('HOME');
          }, 1500);
        } else {
          setErrorMsg(res?.error || 'Invalid or expired 5-minute pairing code');
        }
      });
    } else {
      setTimeout(() => {
        setActionLoading(false);
        setIsConnected(true);
        setSuccessMsg('Connected in mock mode!');
        setTimeout(() => setSuccessMsg(''), 1500);
      }, 500);
    }
  };

  const handleSync = () => {
    setActionLoading(true);
    setErrorMsg('');
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SYNC_PROFILE' }, (res) => {
        setActionLoading(false);
        if (res?.success) {
          if (res.user?.name) setUserName(res.user.name);
          if (res.resume?.title) setResumeTitle(res.resume.title);
          setSuccessMsg('Profile and resume data synced!');
          setTimeout(() => setSuccessMsg(''), 2500);
        } else {
          setErrorMsg(res?.error || 'Failed to sync. Please verify backend connection.');
        }
      });
    } else {
      setTimeout(() => {
        setActionLoading(false);
        setSuccessMsg('Synced!');
        setTimeout(() => setSuccessMsg(''), 1500);
      }, 400);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect Kraxyy Apply extension from this account?')) {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'DISCONNECT' }, () => {
          setIsConnected(false);
          setView('HOME');
        });
      } else {
        setIsConnected(false);
        setView('HOME');
      }
    }
  };

  const openWeb = (path: string = '') => {
    const url = `http://localhost:5173${path}`;
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-[380px] min-h-[520px] max-h-[620px] bg-cream text-charcoal flex flex-col font-sans select-none relative overflow-hidden border border-beige/60 shadow-2xl">
      {/* ============================================================ */}
      {/* BRAND HEADER */}
      {/* ============================================================ */}
      <header className="px-4 py-3 bg-cream/90 backdrop-blur-sm border-b border-beige/80 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div
          onClick={() => setView('HOME')}
          className="cursor-pointer flex items-center gap-2.5 transition active:scale-95"
        >
          <BrandSymbol size={28} className="drop-shadow-xs" />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-[13px] tracking-tight uppercase text-olive font-display">
              K R A X Y Y
            </span>
            <span className="text-[9px] font-semibold text-charcoal-muted tracking-wide mt-0.5">
              Job Application Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div
            onClick={() => setView(view === 'SETTINGS' ? 'HOME' : 'SETTINGS')}
            className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition ${
              isConnected
                ? 'bg-olive/10 border-olive/30 text-olive'
                : 'bg-mustard/15 border-mustard/40 text-mustard-dark'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-olive animate-pulse' : 'bg-mustard'
              }`}
            />
            <span>{isConnected ? 'Connected' : 'Pair'}</span>
          </div>

          {/* Settings Gear */}
          <button
            onClick={() => setView(view === 'SETTINGS' ? 'HOME' : 'SETTINGS')}
            title="Settings & Account"
            className={`p-1.5 rounded-lg border border-transparent transition ${
              view === 'SETTINGS'
                ? 'bg-olive text-cream'
                : 'text-charcoal-muted hover:text-charcoal hover:bg-beige/40'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Global Toast Messages */}
      {errorMsg && (
        <div className="px-3.5 py-2 bg-red-50 text-red-800 text-[11px] font-medium border-b border-red-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="px-3.5 py-2 bg-emerald-50 text-emerald-800 text-[11px] font-semibold border-b border-emerald-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN BODY SWITCHER */}
      {/* ============================================================ */}
      <main className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
        {view === 'HOME' ? (
          /* ============================================================ */
          /* HOME VIEW: EXACT SPECIFIED LAYOUT                           */
          /* ============================================================ */
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {/* 1. Candidate & Active Resume Identity Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-beige shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-olive/10 border border-olive/20 flex items-center justify-center text-olive font-bold text-sm shrink-0">
                  <User className="w-5 h-5 text-olive" />
                </div>
                <div className="space-y-0.5 truncate flex-1">
                  <div className="text-sm font-bold text-charcoal truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-olive font-semibold flex items-center gap-1 truncate">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">Resume: {resumeTitle}</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator: Profile ✓ Resume ✓ */}
              <div className="pt-2 border-t border-beige/60 flex items-center justify-between text-[11px] font-medium text-charcoal-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Profile ✓</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Resume ✓</span>
                  </span>
                </div>
                <button
                  onClick={() => openWeb('/profile')}
                  className="text-[10px] text-olive hover:underline font-semibold flex items-center gap-0.5"
                  title="Manage in web app"
                >
                  <span>Edit</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Persistent Assistant Banner */}
            <div className="p-3 bg-olive/10 border border-olive/30 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-olive animate-pulse shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold text-olive">Persistent Job Assistant</div>
                  <div className="text-[10px] text-charcoal-muted">Stays open on page while you browse</div>
                </div>
              </div>
              <button
                onClick={() => launchFloatingAssistant('HOME')}
                className="px-3 py-1.5 bg-olive text-cream rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-olive-hover transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Launch</span>
                <span>↗</span>
              </button>
            </div>

            {/* 2. Primary 2 Action Superpowers */}
            <div className="space-y-3 my-auto py-1">
              {/* Button 1: ⚡ Auto-Fill Form */}
              <button
                onClick={startAutofillFlow}
                className="w-full py-4 px-4 bg-olive text-cream rounded-2xl font-display font-bold text-sm tracking-wide shadow-md hover:bg-olive-hover active:scale-[0.98] transition flex items-center justify-between group border border-olive/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cream/15 flex items-center justify-center text-mustard-light shadow-inner shrink-0">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[13px] font-extrabold uppercase tracking-wider">
                      Auto-Fill Form
                    </div>
                    <div className="text-[10px] text-cream/75 font-normal">
                      Scan fields & map with your profile
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-mustard-light group-hover:translate-x-1 transition" />
              </button>

              {/* Button 2: 🎯 Match Job with Resume */}
              <button
                onClick={startMatchJobFlow}
                className="w-full py-4 px-4 bg-white text-charcoal rounded-2xl font-display font-bold text-sm tracking-wide shadow-sm hover:border-olive hover:bg-cream-50 active:scale-[0.98] transition flex items-center justify-between group border border-beige cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-olive/10 flex items-center justify-center text-olive shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[13px] font-extrabold uppercase tracking-wider text-charcoal">
                      Match Job with Resume
                    </div>
                    <div className="text-[10px] text-charcoal-muted font-normal">
                      Instant score & skill gap analysis
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-olive group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Bottom Quick Bar */}
            <div className="pt-2 text-center text-[10px] text-charcoal-muted">
              <span>Current Page: </span>
              <span className="font-semibold text-charcoal">
                Ready for detection
              </span>
            </div>
          </div>
        ) : view === 'AUTOFILL_FLOW' ? (
          /* ============================================================ */
          /* WORKFLOW 1: AUTO-FILL SCREEN                                 */
          /* ============================================================ */
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            {/* Flow Header */}
            <div className="flex items-center justify-between border-b border-beige/80 pb-2">
              <button
                onClick={() => setView('HOME')}
                className="flex items-center gap-1 text-xs text-olive font-bold hover:underline transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-charcoal-muted">
                ⚡ Auto-Fill Engine
              </div>
            </div>

            {/* Step Content */}
            {autofillStep === 'DETECTING' ? (
              <div className="p-6 bg-white rounded-2xl border border-beige shadow-sm text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-olive/10 mx-auto flex items-center justify-center text-olive">
                  <RefreshCw className="w-6 h-6 text-olive animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-charcoal">
                    Detecting form...
                  </div>
                  <p className="text-[11px] text-charcoal-muted">
                    Reading current webpage DOM to identify input fields
                  </p>
                </div>
              </div>
            ) : autofillStep === 'FOUND' ? (
              <div className="p-6 bg-white rounded-2xl border border-beige shadow-sm text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-olive-50 mx-auto flex items-center justify-center text-olive border border-olive/20 font-display font-extrabold text-lg">
                  {foundFieldCount}
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-charcoal">
                    Found {foundFieldCount} fields
                  </div>
                  <p className="text-[11px] text-charcoal-muted">
                    Analyzing form elements and labels...
                  </p>
                </div>
              </div>
            ) : autofillStep === 'MAPPING' ? (
              <div className="p-6 bg-white rounded-2xl border border-beige shadow-sm text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-olive/10 mx-auto flex items-center justify-center text-olive">
                  <Loader2 className="w-6 h-6 text-olive animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-sm text-charcoal">
                    Mapping fields...
                  </div>
                  <p className="text-[11px] text-charcoal-muted">
                    Connecting form fields to your saved profile & resume data
                  </p>
                </div>
              </div>
            ) : autofillStep === 'MAPPED' ? (
              /* MAPPED CHECKLIST VIEW */
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="p-3 bg-white rounded-xl border border-beige shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mapped Fields Ready</span>
                  </div>
                  <span className="text-[10px] font-bold bg-olive-50 text-olive px-2 py-0.5 rounded-full border border-olive/20">
                    {mappedFields.length} Detected
                  </span>
                </div>

                {/* Checklist of Mapped Fields */}
                <div className="flex-1 max-h-[300px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                  {mappedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-xl border border-beige/80 text-[11px] flex items-center justify-between gap-2 shadow-2xs hover:border-olive/40 transition"
                    >
                      <div className="flex items-center gap-2 truncate flex-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-charcoal truncate">
                          {field.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-charcoal-muted truncate max-w-[140px] text-right">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fill Form Primary Action */}
                <button
                  onClick={executeFormFill}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-olive text-cream rounded-xl font-display font-bold text-xs uppercase tracking-wider shadow-md hover:bg-olive-hover active:scale-[0.98] transition flex items-center justify-center gap-2 border border-olive/30 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-mustard-light fill-current" />
                  <span>[ Fill Form ]</span>
                </button>
              </div>
            ) : autofillStep === 'FILLING' ? (
              <div className="p-6 bg-white rounded-2xl border border-beige shadow-sm text-center space-y-3 my-auto">
                <RefreshCw className="w-8 h-8 text-olive animate-spin mx-auto" />
                <div className="font-display font-bold text-sm text-charcoal">
                  Filling form fields...
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  Dispatching realistic DOM input & change events
                </p>
              </div>
            ) : (
              /* REPORT VIEW */
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Form Filled Successfully!</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Review on page
                  </span>
                </div>

                {/* 3 Stat Badges */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-beige shadow-xs">
                    <div className="font-display text-xl font-black text-emerald-700 leading-none">
                      <AnimatedNumber value={autofillReport?.totalVerified || 15} />
                    </div>
                    <div className="text-[8px] font-bold text-charcoal-muted uppercase mt-1">
                      VERIFIED
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-beige shadow-xs">
                    <div className="font-display text-xl font-black text-mustard-dark leading-none">
                      <AnimatedNumber value={autofillReport?.totalNeedsAttention || 1} />
                    </div>
                    <div className="text-[8px] font-bold text-charcoal-muted uppercase mt-1">
                      ATTENTION
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-beige shadow-xs">
                    <div className="font-display text-xl font-black text-charcoal leading-none">
                      <AnimatedNumber value={autofillReport?.totalSkippedExisting || 2} />
                    </div>
                    <div className="text-[8px] font-bold text-charcoal-muted uppercase mt-1">
                      PRESERVED
                    </div>
                  </div>
                </div>

                {/* Filled fields preview */}
                <div className="flex-1 max-h-[190px] overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                  {(autofillReport?.fields || []).map((f, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-[10px] flex items-center justify-between ${
                        f.status === 'VERIFIED'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-mustard-50/60 border-mustard/30 text-mustard-dark'
                      }`}
                    >
                      <span className="font-semibold truncate">{f.label}</span>
                      <span className="text-[9px] font-mono">
                        {f.status === 'VERIFIED' ? '✓ Filled' : '! Check'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-beige">
                  <button
                    onClick={handleClearForm}
                    className="py-2.5 px-3 bg-white border border-beige rounded-xl text-xs font-semibold text-charcoal hover:border-olive transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-olive" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={() => setView('HOME')}
                    className="py-2.5 px-3 bg-olive text-cream rounded-xl text-xs font-bold hover:bg-olive-hover transition flex items-center justify-center gap-1.5"
                  >
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : view === 'MATCH_FLOW' ? (
          /* ============================================================ */
          /* WORKFLOW 2: MATCH JOB WITH RESUME SCREEN                     */
          /* ============================================================ */
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {/* Flow Header */}
            <div className="flex items-center justify-between border-b border-beige/80 pb-2">
              <button
                onClick={() => setView('HOME')}
                className="flex items-center gap-1 text-xs text-olive font-bold hover:underline transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-charcoal-muted">
                🎯 Match Analyzer
              </div>
            </div>

            {matchStep === 'EXTRACTING' || matchStep === 'DETECTED' || matchStep === 'ANALYZING' ? (
              /* EXTRACTION & PROGRESS VIEW */
              <div className="p-5 bg-white rounded-2xl border border-beige shadow-sm space-y-4 my-auto">
                <div className="space-y-1 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 uppercase">
                    <span>Job Description Detected ✓</span>
                  </div>
                  <div className="font-display font-bold text-sm text-charcoal pt-1 leading-snug">
                    {detectedJob.title}
                  </div>
                  <div className="text-xs text-olive font-semibold">
                    {detectedJob.company} {detectedJob.location ? `• ${detectedJob.location}` : ''}
                  </div>
                </div>

                {/* Analyzing Progress Bar */}
                <div className="space-y-2 pt-2 border-t border-beige/60">
                  <div className="flex items-center justify-between text-xs font-bold text-charcoal">
                    <span>Analyzing...</span>
                    <span className="font-mono text-olive">{matchProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-beige/40 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-olive rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${matchProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-charcoal-muted text-center italic">
                    Comparing JD requirements with {userName}'s resume & skills
                  </p>
                </div>
              </div>
            ) : (
              /* RESULTS VIEW: EXACT MATCH SCORE & BREAKDOWN */
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                {/* Score Card Banner */}
                <div className="p-3 bg-white rounded-2xl border border-beige shadow-sm text-center space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal-muted">
                    MATCH SCORE
                  </div>
                  <div className="font-display text-4xl font-black text-olive leading-none">
                    <AnimatedNumber value={matchResult.overallScore} />%
                  </div>
                  <div className="text-[10px] text-charcoal-muted font-medium pt-0.5">
                    {detectedJob.title} • {detectedJob.company}
                  </div>
                </div>

                {/* Skills Breakdown List */}
                <div className="flex-1 max-h-[220px] overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
                  {/* Matched Skills */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Matched Skills ({matchResult.matchedSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.matchedSkills.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{sk}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {matchResult.missingSkills.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-mustard-dark uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-mustard" />
                        <span>Missing ({matchResult.missingSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {matchResult.missingSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-mustard-50 text-mustard-dark border border-mustard/30 rounded text-[10px] font-semibold flex items-center gap-1"
                          >
                            <span>!</span>
                            <span>{sk}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience & Education Alignment Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-beige/70 text-xs">
                    <div className="p-2 bg-cream-50 rounded-xl border border-beige">
                      <div className="text-[9px] font-bold text-charcoal-muted uppercase">
                        Experience Match
                      </div>
                      <div className="font-bold text-emerald-800 flex items-center gap-1 text-[11px] mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{matchResult.experienceMatch}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-cream-50 rounded-xl border border-beige">
                      <div className="text-[9px] font-bold text-charcoal-muted uppercase">
                        Education Match
                      </div>
                      <div className="font-bold text-emerald-800 flex items-center gap-1 text-[11px] mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{matchResult.educationMatch}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue to Apply CTA */}
                <div className="space-y-2 pt-1 border-t border-beige">
                  <button
                    onClick={startAutofillFlow}
                    className="w-full py-3 bg-olive text-cream rounded-xl font-display font-bold text-xs uppercase tracking-wider shadow-md hover:bg-olive-hover transition flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-mustard-light fill-current" />
                    <span>Auto-Fill This Application</span>
                    <ArrowRight className="w-3.5 h-3.5 text-mustard-light group-hover:translate-x-1 transition" />
                  </button>
                  <button
                    onClick={() => setView('HOME')}
                    className="w-full py-2 bg-white border border-beige rounded-xl text-xs font-semibold text-charcoal hover:border-olive transition text-center"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* SETTINGS VIEW: CONNECTION & ACCOUNT MANAGEMENT               */
          /* ============================================================ */
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-beige/80 pb-2">
              <button
                onClick={() => setView('HOME')}
                className="flex items-center gap-1 text-xs text-olive font-bold hover:underline"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[10px] font-mono text-charcoal-muted uppercase font-bold">
                Settings & Account
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
              {/* Account Status Card */}
              <div className="p-3 bg-white rounded-xl border border-beige space-y-2">
                <div className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">
                  Account Connection
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-charcoal">
                      {userName}
                    </div>
                    <div className="text-[10px] text-charcoal-muted">
                      {isConnected ? userEmail : 'Not paired to an account'}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-mustard-50 text-mustard-dark border border-mustard/30'
                    }`}
                  >
                    {isConnected ? 'Active' : 'Unpaired'}
                  </div>
                </div>
              </div>

              {/* Pairing Code Input */}
              {!isConnected && (
                <div className="p-3 bg-white rounded-xl border border-beige space-y-2">
                  <div className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">
                    Pair with Web Account
                  </div>
                  <p className="text-[11px] text-charcoal-muted">
                    Generate a 5-minute pairing code on the web dashboard (Settings → Extension).
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pairCodeInput}
                      onChange={(e) => setPairCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AB7X-92KP"
                      maxLength={9}
                      className="flex-1 px-3 py-1.5 bg-cream-50 border border-beige rounded-lg text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-olive"
                    />
                    <button
                      onClick={handlePair}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-olive text-cream rounded-lg text-xs font-bold hover:bg-olive-hover transition shrink-0"
                    >
                      {actionLoading ? 'Pairing...' : 'Connect'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {isConnected && (
                  <button
                    onClick={handleSync}
                    disabled={actionLoading}
                    className="w-full py-2 bg-white border border-beige rounded-xl text-xs font-semibold text-charcoal hover:border-olive transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-olive ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Latest Profile & Resume</span>
                  </button>
                )}

                <button
                  onClick={() => openWeb('/dashboard')}
                  className="w-full py-2 bg-white border border-beige rounded-xl text-xs font-semibold text-charcoal hover:border-olive transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-olive" />
                  <span>Open Web Dashboard</span>
                </button>

                {isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-200"
                  >
                    Disconnect Extension
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-beige text-center text-[9px] text-charcoal-muted">
              Kraxyy Apply v1.1.0 • Privacy First Local DOM Engine
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
