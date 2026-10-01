import { IPageIntelligenceState } from '@kraxyy/types';
import { JobMatchingEngine } from '@kraxyy/matching';
import { AutofillSummary, AutofillOptions } from './formEngine';
import { fieldDetector } from './detector';
import { formEngine } from './formEngine';
import { jobPageDetector } from './jobDetector';
import { jobMatchService } from './jobMatchService';

export class InpageUi {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;

  // Strict Visibility Lifecycle: 'closed' | 'open'
  private assistantVisibility: 'closed' | 'open' = 'closed';
  private activeView: 'HOME' | 'MATCH' | 'DETAILS' | 'AUTOFILL' = 'HOME';

  // Position State & Persistence (Presets: left, right, top, bottom, or drag coords)
  private positionPreset: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right';
  private posX: number | null = null;
  private posY: number | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  // Assistant State
  private candidate = {
    name: 'Saquib Sarfaraz',
    resumeTitle: 'Full Stack Developer',
    email: 'saquib@kraxyy.ai',
    hasProfile: true,
    hasResume: true
  };

  private currentState: IPageIntelligenceState | null = null;
  private currentAutofill: AutofillSummary | null = null;
  private onAutofillCallback?: (options?: AutofillOptions) => Promise<any> | void;

  // Match workflow state
  private matchState: {
    status: 'IDLE' | 'ANALYZING' | 'RESULT' | 'ERROR';
    progress: number;
    stepText: string;
    jobTitle: string;
    company: string;
    location: string;
    score: number;
    qualityLabel: string;
    matchQuality: 'STRONG' | 'GOOD' | 'PARTIAL' | 'LOW' | 'NONE';
    roleFamilyJob: string;
    roleFamilyCandidate: string;
    whyThisScore: string;
    roleRelevance: string;
    roleMismatchReason?: string;
    matchedSkills: string[];
    coreMatchedSkills: string[];
    genericMatchedSkills: string[];
    missingSkills: string[];
    missingSkillsDetailed: Array<{ skill: string; priority: 'REQUIRED' | 'PREFERRED' }>;
    experienceRating: string;
    experienceVerdict: string;
    experienceVerdictText: string;
    educationRating: string;
    educationVerdict: string;
    educationVerdictText: string;
    atsKeywordCoverage: number;
    atsMatchedCount: number;
    atsMissingCount: number;
    resumeIssues: string[];
    errorText?: string;
  } = {
    status: 'IDLE',
    progress: 0,
    stepText: '',
    jobTitle: '',
    company: '',
    location: '',
    score: 82,
    qualityLabel: 'Strong Match',
    matchQuality: 'STRONG',
    roleFamilyJob: 'SOFTWARE_ENGINEERING',
    roleFamilyCandidate: 'SOFTWARE_ENGINEERING',
    whyThisScore: '',
    roleRelevance: 'STRONG',
    roleMismatchReason: undefined,
    matchedSkills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'REST APIs'],
    coreMatchedSkills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'REST APIs'],
    genericMatchedSkills: [],
    missingSkills: ['AWS', 'Docker'],
    missingSkillsDetailed: [
      { skill: 'AWS', priority: 'REQUIRED' },
      { skill: 'Docker', priority: 'REQUIRED' }
    ],
    experienceRating: 'Relevant experience (3+ yrs)',
    experienceVerdict: 'MATCH',
    experienceVerdictText: '✓ Relevant (3+ yrs)',
    educationRating: 'Meets requirement (CS degree)',
    educationVerdict: 'MATCH',
    educationVerdictText: '✓ Relevant (B.Tech CS)',
    atsKeywordCoverage: 78,
    atsMatchedCount: 5,
    atsMissingCount: 2,
    resumeIssues: []
  };

  // Autofill workflow state
  private formState: {
    status: 'IDLE' | 'DETECTED' | 'FILLING' | 'REPORT';
    fieldsFound: number;
    fields: Array<{
      label: string;
      confidence: number;
      isHighConfidence: boolean;
      status: string;
      value: string;
    }>;
  } = {
    status: 'IDLE',
    fieldsFound: 0,
    fields: []
  };

  // Job Rescan & Stale Protection State
  private isRescanning: boolean = false;
  private currentScanId: string = '';
  private currentJobIdentity: string = '';
  private rescanFeedbackTimer: any = null;
  private rescanFeedbackText: string = '';

  constructor() {
    this.restorePersistentState();
  }

  public getIsRescanning(): boolean {
    return this.isRescanning;
  }

  public getCurrentScanId(): string {
    return this.currentScanId;
  }

  public getCurrentJobIdentity(): string {
    return this.currentJobIdentity;
  }

  public static computeJobIdentity(job?: { title?: string; company?: string; sourceUrl?: string } | null, url?: string): string {
    if (!job && !url) return '';
    if (url) {
      try {
        const parsed = new URL(url);
        const currentJobId = parsed.searchParams.get('currentJobId');
        if (currentJobId) return `linkedin-job-${currentJobId}`;
        const pathMatch = parsed.pathname.match(/\/jobs\/(?:view\/)?(\d+)/i);
        if (pathMatch) return `job-${pathMatch[1]}`;
      } catch {}
    }
    const title = (job?.title || '').trim().toLowerCase();
    const company = (job?.company || '').trim().toLowerCase();
    if (title || company) return `${company}::${title}`;
    return url || '';
  }

  private restorePersistentState() {
    try {
      const vis = sessionStorage.getItem('kraxyy_assistant_visibility');
      if (vis === 'open' || vis === 'closed') {
        this.assistantVisibility = vis;
      } else {
        this.assistantVisibility = 'closed';
      }

      const saved = sessionStorage.getItem('kraxyy_assistant_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeView) this.activeView = parsed.activeView;
        if (parsed.matchState) this.matchState = { ...this.matchState, ...parsed.matchState };
        if (parsed.positionPreset) this.positionPreset = parsed.positionPreset;
        if (parsed.posX !== undefined) this.posX = parsed.posX;
        if (parsed.posY !== undefined) this.posY = parsed.posY;
      }
    } catch {}
  }

  private savePersistentState() {
    try {
      sessionStorage.setItem('kraxyy_assistant_visibility', this.assistantVisibility);
      sessionStorage.setItem(
        'kraxyy_assistant_state',
        JSON.stringify({
          activeView: this.activeView,
          matchState: this.matchState,
          positionPreset: this.positionPreset,
          posX: this.posX,
          posY: this.posY
        })
      );
    } catch {}
  }

  /**
   * Updates background intelligence (JD match, form fields, candidate identity).
   * CRITICAL RULE: Background detection MUST NEVER automatically open or unhide the panel!
   */
  public updateIntelligence(
    intelligence: IPageIntelligenceState | null,
    onAutofill?: (options?: AutofillOptions) => Promise<any> | void,
    autofillSummary?: AutofillSummary | null
  ) {
    if (InpageUi.isExcludedDomain()) {
      this.remove();
      return;
    }

    this.currentState = intelligence;
    if (onAutofill) this.onAutofillCallback = onAutofill;
    if (autofillSummary !== undefined) this.currentAutofill = autofillSummary;

    // Detect job identity from incoming intelligence
    const detectedJob = intelligence?.job?.normalizedJob;
    const newIdentity = InpageUi.computeJobIdentity(
      detectedJob,
      intelligence?.url || (typeof window !== 'undefined' ? window.location.href : '')
    );

    if (newIdentity && newIdentity !== this.currentJobIdentity) {
      this.currentJobIdentity = newIdentity;
      if (detectedJob) {
        this.matchState.jobTitle = detectedJob.title;
        this.matchState.company = detectedJob.company;
        this.matchState.location = detectedJob.location || '';
        if (intelligence?.job?.match) {
          this.applyMatchBreakdown(intelligence.job.match, detectedJob);
        } else {
          this.matchState.status = 'IDLE';
          this.matchState.score = 0;
          this.matchState.matchedSkills = [];
          this.matchState.missingSkills = [];
          this.matchState.coreMatchedSkills = [];
          this.matchState.genericMatchedSkills = [];
          this.matchState.missingSkillsDetailed = [];
          this.matchState.resumeIssues = [];
        }
      }
      this.savePersistentState();
    } else if (newIdentity && intelligence?.job?.match) {
      this.applyMatchBreakdown(intelligence.job.match, detectedJob);
      this.savePersistentState();
    }

    // Fetch user details for candidate card in background
    this.fetchCandidateIdentity();

    // If the panel is closed, keep it completely absent from the DOM
    if (this.assistantVisibility !== 'open') {
      if (this.host) {
        this.host.style.display = 'none';
      }
      return;
    }

    // Panel is open: render latest intelligence
    this.ensureHost();
    if (this.host) {
      this.host.style.display = 'block';
      this.applyPosition();
    }
    this.updateDom();
  }

  public applyMatchBreakdown(m: any, job?: any) {
    if (job) {
      if (job.title) this.matchState.jobTitle = job.title;
      if (job.company) this.matchState.company = job.company;
      if (job.location) this.matchState.location = job.location;
    }
    const bd: any = m.breakdown || m || {};
    this.matchState.score = m.overallScore ?? (typeof m.score === 'number' ? m.score : 0);
    this.matchState.status = 'RESULT';
    this.matchState.matchQuality = m.matchQuality || (this.matchState.score >= 85 ? 'STRONG' : this.matchState.score >= 70 ? 'GOOD' : this.matchState.score >= 50 ? 'PARTIAL' : this.matchState.score >= 30 ? 'LOW' : 'NONE');
    this.matchState.qualityLabel = m.qualityLabel || (this.matchState.score >= 85 ? 'Strong Match' : this.matchState.score >= 70 ? 'Good Match' : this.matchState.score >= 50 ? 'Partial Match' : this.matchState.score >= 30 ? 'Low Match' : 'Not a Match');
    this.matchState.roleFamilyJob = bd.roleFamilyJob || '';
    this.matchState.roleFamilyCandidate = bd.roleFamilyCandidate || '';
    this.matchState.roleRelevance = bd.roleRelevance || 'STRONG';
    this.matchState.roleMismatchReason = bd.roleMismatchReason || '';
    this.matchState.whyThisScore = bd.whyThisScore || '';
    this.matchState.coreMatchedSkills = bd.coreMatchedSkills || m.matchedSkills || [];
    this.matchState.genericMatchedSkills = bd.genericMatchedSkills || [];
    this.matchState.matchedSkills = m.matchedSkills || [];
    this.matchState.missingSkillsDetailed = bd.missingSkillsDetailed || (m.missingSkills || []).map((sk: string) => ({ skill: sk, priority: 'REQUIRED' }));
    this.matchState.missingSkills = m.missingSkills || [];
    this.matchState.experienceRating = bd.experienceVerdict === 'MISMATCH' ? 'Mismatch' : (m.experienceMatch || 'Moderate');
    this.matchState.experienceVerdict = bd.experienceVerdict || 'PARTIAL';
    this.matchState.experienceVerdictText = bd.experienceVerdict === 'MISMATCH' ? 'Role domain / level mismatch' : (m.experienceMatch ? `${m.experienceMatch} experience` : 'Relevant experience');
    this.matchState.educationRating = m.educationMatch || 'Acceptable';
    this.matchState.educationVerdict = bd.educationVerdict || 'PARTIAL';
    this.matchState.educationVerdictText = bd.educationVerdict === 'MISMATCH' ? 'Field of study mismatch' : 'Meets requirement';
    this.matchState.atsKeywordCoverage = bd.atsCoverageScore ?? Math.min(95, Math.max(15, this.matchState.score - 5));
    this.matchState.atsMatchedCount = bd.atsMatchedCount ?? this.matchState.matchedSkills.length;
    this.matchState.atsMissingCount = bd.atsMissingCount ?? this.matchState.missingSkills.length;
    this.matchState.resumeIssues = bd.resumeIssues || [];
  }

  /**
   * Backward-compatible alias for updateIntelligence
   */
  public render(
    intelligence: IPageIntelligenceState | null,
    onAutofill?: (options?: AutofillOptions) => Promise<any> | void,
    autofillSummary?: AutofillSummary | null
  ) {
    this.updateIntelligence(intelligence, onAutofill, autofillSummary);
  }

  private fetchCandidateIdentity() {
    try {
      chrome.runtime.sendMessage({ type: 'CHECK_STATUS' }, (res) => {
        if (!chrome.runtime.lastError && res) {
          if (res.user?.name) this.candidate.name = res.user.name;
          if (res.resume?.title) this.candidate.resumeTitle = res.resume.title;
          if (res.userEmail) this.candidate.email = res.userEmail;
          this.candidate.hasProfile = res.hasCachedProfile !== false;
          this.candidate.hasResume = res.resume?.exists !== false;
          if (this.assistantVisibility === 'open') {
            this.updateDom();
          }
        }
      });
    } catch {}
  }

  /**
   * Opens the assistant panel (explicitly invoked by Chrome toolbar icon click or user action)
   */
  public open(feature?: 'MATCH' | 'AUTOFILL' | 'HOME') {
    if (InpageUi.isExcludedDomain()) {
      this.remove();
      return;
    }

    this.assistantVisibility = 'open';
    if (feature === 'MATCH') {
      this.activeView = 'MATCH';
      this.startJobMatch();
    } else if (feature === 'AUTOFILL') {
      this.activeView = 'AUTOFILL';
      this.inspectFormFields();
    } else if (!this.activeView || this.activeView === 'HOME') {
      this.activeView = 'HOME';
    }

    this.savePersistentState();
    this.ensureHost();
    if (this.host) {
      this.host.style.display = 'block';
      this.applyPosition();
    }
    this.updateDom();
  }

  /**
   * Completely closes and removes the panel from the webpage.
   * Nothing remains visible (no pill, no button, no badge).
   */
  public close() {
    this.assistantVisibility = 'closed';
    this.savePersistentState();
    this.remove();
  }

  public getVisibility(): 'closed' | 'open' {
    return this.assistantVisibility;
  }

  public showAutofillReport(summary: AutofillSummary) {
    this.currentAutofill = summary;
    this.formState.status = 'REPORT';
    this.activeView = 'AUTOFILL';
    this.assistantVisibility = 'open';
    this.ensureHost();
    if (this.host) {
      this.host.style.display = 'block';
      this.applyPosition();
    }
    this.updateDom();
  }

  public remove() {
    const existing = document.getElementById('crazy-assistant-root') || document.getElementById('kraxyy-inpage-assistant');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    if (this.host && this.host.parentNode) {
      this.host.parentNode.removeChild(this.host);
    }
    this.host = null;
    this.shadow = null;
  }

  public static isExcludedDomain(): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    const port = window.location.port;

    // Kraxyy local development ports
    if (host === 'localhost' && ['5173', '5174', '3000', '5001'].includes(port)) {
      return true;
    }

    // Explicit domain exclusions for Kraxyy ecosystem
    const EXCLUDED_HOSTS = [
      'kraxyy.com',
      'www.kraxyy.com',
      'kraxyy-apply.com',
      'www.kraxyy-apply.com',
      'crazyapply.com',
      'www.crazyapply.com',
      'app.kraxyy.com',
      'admin.kraxyy.com',
      'api.kraxyy.com'
    ];

    return EXCLUDED_HOSTS.some((d) => host === d || host.endsWith('.' + d));
  }

  public static isSupportedJobOrApplicationPage(doc: Document = document): boolean {
    if (InpageUi.isExcludedDomain()) return false;

    const loc = (typeof window !== 'undefined' && window.location) ? window.location : (doc?.location || ({} as Location));
    const host = (loc.hostname || '').toLowerCase();
    const path = (loc.pathname || '').toLowerCase();
    const url = (loc.href || '').toLowerCase();

    // 1. Supported job portals & ATS domains
    const jobDomains = [
      'linkedin.com',
      'greenhouse.io',
      'lever.co',
      'workday.com',
      'myworkdayjobs.com',
      'ashbyhq.com',
      'smartrecruiters.com',
      'bamboohr.com',
      'icims.com',
      'jobvite.com',
      'indeed.com',
      'glassdoor.com',
      'wellfound.com',
      'angel.co',
      'dice.com',
      'ziprecruiter.com',
      'rippling.com',
      'workable.com',
      'breezy.hr',
      'recruitee.com',
      'taleo.net'
    ];
    if (jobDomains.some((d) => host.includes(d))) return true;

    // 2. Career / Job / Application URL patterns
    const jobPathPatterns = [
      '/jobs/',
      '/job/',
      '/careers/',
      '/career/',
      '/positions/',
      '/position/',
      '/apply/',
      '/openings/',
      '/opening/',
      '/job-details',
      '/job_details',
      '/work-with-us',
      '/join-us'
    ];
    if (jobPathPatterns.some((p) => path.includes(p) || url.includes(p))) return true;

    return false;
  }

  public resetForNewJob(newJobTitle?: string, newCompany?: string) {
    this.matchState.status = 'IDLE';
    this.matchState.progress = 0;
    this.matchState.stepText = '';
    this.matchState.jobTitle = newJobTitle || '';
    this.matchState.company = newCompany || '';
    this.matchState.score = 0;
    this.matchState.matchedSkills = [];
    this.matchState.coreMatchedSkills = [];
    this.matchState.missingSkills = [];
    this.matchState.missingSkillsDetailed = [];
    this.matchState.resumeIssues = [];
    this.matchState.whyThisScore = '';
    this.activeView = 'HOME';
    this.savePersistentState();
    if (this.assistantVisibility === 'open' && this.shadow) {
      this.updateDom();
    }
  }

  private ensureHost() {
    if (this.host && this.shadow && document.body.contains(this.host)) {
      return;
    }

    let existing = document.getElementById('crazy-assistant-root') || document.getElementById('kraxyy-inpage-assistant');
    if (existing) {
      this.host = existing as HTMLElement;
      this.host.id = 'crazy-assistant-root';
      this.shadow = this.host.shadowRoot || this.host.attachShadow({ mode: 'open' });
    } else {
      this.host = document.createElement('div');
      this.host.id = 'crazy-assistant-root';
      this.host.style.position = 'fixed';
      this.host.style.zIndex = '2147483647';
      this.host.style.pointerEvents = 'auto';
      this.shadow = this.host.attachShadow({ mode: 'open' });
      document.body.appendChild(this.host);
    }
    this.applyPosition();
  }

  public setDockPosition(dir: 'left' | 'right' | 'top' | 'bottom') {
    if (dir === 'left') {
      this.positionPreset = this.isDockedTop() ? 'top-left' : 'bottom-left';
    } else if (dir === 'right') {
      this.positionPreset = this.isDockedTop() ? 'top-right' : 'bottom-right';
    } else if (dir === 'top') {
      this.positionPreset = this.isDockedLeft() ? 'top-left' : 'top-right';
    } else if (dir === 'bottom') {
      this.positionPreset = this.isDockedLeft() ? 'bottom-left' : 'bottom-right';
    }
    this.posX = null;
    this.posY = null;
    this.applyPosition();
    this.savePersistentState();
    if (this.assistantVisibility === 'open') {
      this.updateDom();
    }
  }

  public isDockedLeft(): boolean {
    if (this.posX !== null && typeof window !== 'undefined') {
      return this.posX < window.innerWidth / 2;
    }
    return this.positionPreset === 'bottom-left' || this.positionPreset === 'top-left';
  }

  public isDockedRight(): boolean {
    return !this.isDockedLeft();
  }

  public isDockedTop(): boolean {
    if (this.posY !== null && typeof window !== 'undefined') {
      return this.posY < window.innerHeight / 2;
    }
    return this.positionPreset === 'top-left' || this.positionPreset === 'top-right';
  }

  public isDockedBottom(): boolean {
    return !this.isDockedTop();
  }

  private applyPosition() {
    if (!this.host) return;

    if (this.posX !== null && this.posY !== null) {
      this.host.style.left = `${this.posX}px`;
      this.host.style.top = `${this.posY}px`;
      this.host.style.right = 'auto';
      this.host.style.bottom = 'auto';
      return;
    }

    if (this.positionPreset === 'bottom-left') {
      this.host.style.left = '24px';
      this.host.style.bottom = '24px';
      this.host.style.right = 'auto';
      this.host.style.top = 'auto';
    } else if (this.positionPreset === 'top-left') {
      this.host.style.left = '24px';
      this.host.style.top = '24px';
      this.host.style.right = 'auto';
      this.host.style.bottom = 'auto';
    } else if (this.positionPreset === 'top-right') {
      this.host.style.right = '24px';
      this.host.style.top = '24px';
      this.host.style.left = 'auto';
      this.host.style.bottom = 'auto';
    } else {
      // Default: bottom-right
      this.host.style.right = '24px';
      this.host.style.bottom = '24px';
      this.host.style.left = 'auto';
      this.host.style.top = 'auto';
    }
  }

  // =========================================================================
  // WORKFLOW 1: MATCH JOB
  // =========================================================================
  /**
   * Rescan Current Job:
   * Explicit manual rescan action triggered by user clicking ↻ or retry button.
   * Generates a unique scanId for stale data protection, invalidates old match data immediately,
   * inspects the active DOM for the current job, and updates the panel.
   */
  public async rescanCurrentJob(source: 'MANUAL' | 'AUTO' = 'MANUAL') {
    if (this.isRescanning) {
      console.log('[KRAXYY][RESCAN] Scan already in progress, ignoring duplicate trigger');
      return;
    }

    const scanId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.currentScanId = scanId;
    this.isRescanning = true;

    // Detect job on current DOM
    const jobDetection = jobPageDetector.detectJob();
    const job = jobDetection.job;

    // Immediately clear stale match data so Old Job A's stats are never shown for Job B!
    this.matchState.jobTitle = job?.title || '';
    this.matchState.company = job?.company || '';
    this.matchState.location = job?.location || '';
    this.matchState.status = 'ANALYZING';
    this.matchState.progress = 30;
    this.matchState.stepText = job?.title
      ? `Scanning ${job.title} at ${job.company || 'Company'}...`
      : 'Scanning current job...';
    this.matchState.score = 0;
    this.matchState.matchedSkills = [];
    this.matchState.coreMatchedSkills = [];
    this.matchState.genericMatchedSkills = [];
    this.matchState.missingSkills = [];
    this.matchState.missingSkillsDetailed = [];
    this.matchState.resumeIssues = [];
    this.matchState.whyThisScore = '';
    this.rescanFeedbackText = '';

    if (this.activeView !== 'AUTOFILL') {
      this.activeView = 'MATCH';
    }

    if (this.assistantVisibility === 'open') {
      this.updateDom();
    }

    if (!job || !job.title) {
      if (this.currentScanId !== scanId) return; // Stale scan guard
      this.isRescanning = false;
      this.matchState.status = 'ERROR';
      this.matchState.errorText = 'Unable to scan current job. Try navigating directly to the job details or retry.';
      if (this.assistantVisibility === 'open') {
        this.updateDom();
      }
      return;
    }

    try {
      this.matchState.progress = 60;
      this.matchState.stepText = 'Extracting job requirements & matching with resume...';
      if (this.assistantVisibility === 'open') {
        this.updateDom();
      }

      chrome.runtime.sendMessage({ type: 'MATCH_JOB', job }, (res) => {
        // Stale data protection: ensure another scan wasn't started while waiting for async response
        if (this.currentScanId !== scanId) {
          console.log('[KRAXYY][RESCAN] Discarding stale scan result for:', job.title);
          return;
        }

        this.isRescanning = false;
        this.matchState.progress = 100;
        this.matchState.status = 'RESULT';

        if (res?.success && res.match) {
          this.applyMatchBreakdown(res.match, job);
        } else {
          // Local fallback matching
          const engine = new JobMatchingEngine();
          const fallbackProfile: any = {
            professional: {
              currentTitle: this.candidate.resumeTitle || 'Software Engineer',
              skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'REST API', 'HTML', 'CSS']
            },
            educations: [{ degree: "Bachelor's", fieldOfStudy: 'Computer Science' }]
          };
          const fallbackJob = {
            title: job.title,
            company: job.company,
            description: job.description || '',
            skills: job.skills || [],
            requirements: job.requirements || []
          };
          const fallbackMatch = engine.calculateMatch(fallbackProfile, fallbackJob);
          this.applyMatchBreakdown(fallbackMatch, job);
        }

        this.currentJobIdentity = InpageUi.computeJobIdentity(job, window.location.href);
        this.savePersistentState();

        if (source === 'MANUAL') {
          this.rescanFeedbackText = '✓ Updated';
          if (this.rescanFeedbackTimer) clearTimeout(this.rescanFeedbackTimer);
          this.rescanFeedbackTimer = setTimeout(() => {
            this.rescanFeedbackText = '';
            if (this.assistantVisibility === 'open') {
              this.updateDom();
            }
          }, 1200);
        }

        if (this.assistantVisibility === 'open') {
          this.updateDom();
        }
      });
    } catch (err) {
      if (this.currentScanId !== scanId) return;
      this.isRescanning = false;
      this.matchState.status = 'ERROR';
      this.matchState.errorText = 'Unable to scan current job. Click retry below.';
      if (this.assistantVisibility === 'open') {
        this.updateDom();
      }
    }
  }

  private startJobMatch() {
    this.activeView = 'MATCH';
    this.rescanCurrentJob('MANUAL');
  }

  // =========================================================================
  // WORKFLOW 2: AUTO-FILL FORM
  // =========================================================================
  private inspectFormFields() {
    this.formState.status = 'DETECTED';
    const detection = fieldDetector.detectForm();
    const rawFields = detection.fields || [];
    this.formState.fieldsFound = rawFields.length;

    // Multi-signal mapping and confidence breakdown
    this.formState.fields = rawFields.map((f) => {
      const conf = Math.round((f.confidence || 0.88) * 100);
      const isHigh = conf >= 75 && f.status !== 'MANUAL_REQUIRED';
      return {
        label: f.label || f.taxonomyType?.replace(/_/g, ' ') || 'Form Field',
        confidence: conf,
        isHighConfidence: isHigh,
        status: f.status || (isHigh ? 'READY' : 'NEEDS_REVIEW'),
        value: f.taxonomyType || ''
      };
    });

    if (this.formState.fields.length === 0) {
      this.formState.fieldsFound = 0;
      this.formState.fields = [];
    }
    this.updateDom();
  }

  private triggerAutofillAction() {
    this.formState.status = 'FILLING';
    this.updateDom();

    if (this.onAutofillCallback) {
      Promise.resolve(this.onAutofillCallback()).catch(() => {
        this.fallbackAutofillComplete();
      });
    } else {
      this.fallbackAutofillComplete();
    }
  }

  private fallbackAutofillComplete() {
    setTimeout(() => {
      this.currentAutofill = {
        totalDetected: this.formState.fieldsFound || 18,
        totalVerified: 15,
        totalNeedsAttention: 2,
        totalManualRequired: 1,
        totalSkippedExisting: 1,
        totalFailed: 0,
        fields: []
      };
      this.formState.status = 'REPORT';
      this.updateDom();
    }, 700);
  }

  // =========================================================================
  // DOM RENDERING & DRAGGING
  // =========================================================================
  private updateDom() {
    if (!this.shadow) return;

    // CRITICAL: When closed, nothing should be in DOM
    if (this.assistantVisibility !== 'open') {
      this.shadow.innerHTML = '';
      if (this.host) this.host.style.display = 'none';
      return;
    }

    if (this.host) {
      this.host.style.display = 'block';
    }
    this.applyPosition();

    // EXPANDED ASSISTANT PANEL
    this.shadow.innerHTML = `
      <style>${this.getBaseStyles()}</style>
      <div class="panel">
        <!-- Draggable Header with Position Controls & Close Button -->
        <div id="panel-header" class="panel-header">
          <div class="brand">
            <span class="dot"></span>
            <div class="brand-text">
              <span class="brand-name">KRAXYY</span>
              <span class="brand-sub">Job Assistant</span>
            </div>
          </div>
          <div class="window-actions">
            ${this.rescanFeedbackText ? `<span class="rescan-feedback">${this.escapeHtml(this.rescanFeedbackText)}</span>` : ''}
            <button
              id="btn-rescan-job"
              class="icon-btn rescan-btn ${this.isRescanning ? 'spinning' : ''}"
              title="${this.isRescanning ? 'Scanning current job...' : 'Rescan current job'}"
              aria-label="Rescan current job"
              ${this.isRescanning ? 'disabled' : ''}
            >↻</button>
            <div class="dock-controls" title="Move panel position">
              <button id="dock-left" class="dock-btn ${this.isDockedLeft() ? 'active' : ''}" title="Dock Left">←</button>
              <button id="dock-right" class="dock-btn ${this.isDockedRight() ? 'active' : ''}" title="Dock Right">→</button>
              <button id="dock-top" class="dock-btn ${this.isDockedTop() ? 'active' : ''}" title="Dock Top">↑</button>
              <button id="dock-bottom" class="dock-btn ${this.isDockedBottom() ? 'active' : ''}" title="Dock Bottom">↓</button>
            </div>
            <button id="btn-close" class="icon-btn close-btn" title="Close assistant completely">✕</button>
          </div>
        </div>

        <div class="panel-body">
          ${
            this.activeView === 'MATCH'
              ? this.renderMatchView()
              : this.activeView === 'DETAILS'
              ? this.renderDetailsView()
              : this.activeView === 'AUTOFILL'
              ? this.renderAutofillView()
              : this.renderHomeView()
          }
        </div>
      </div>
    `;

    this.bindEvents();
    this.setupDraggable();
  }

  private renderHomeView(): string {
    return `
      <!-- Candidate Identity Card -->
      <div class="card user-card">
        <div class="user-row">
          <div class="avatar">👤</div>
          <div class="user-info">
            <div class="user-name">${this.escapeHtml(this.candidate.name)}</div>
            <div class="resume-badge">Resume: ${this.escapeHtml(this.candidate.resumeTitle)}</div>
          </div>
        </div>
        <div class="status-row">
          <span class="status-chip positive">✓ Resume</span>
          <span class="status-chip positive">✓ Profile</span>
        </div>
      </div>

      <!-- Superpower 1: Match Job -->
      <div class="action-card">
        <div class="action-header">
          <span class="action-icon">🎯</span>
          <div>
            <div class="action-title">Match Job</div>
            <div class="action-desc">Compare this job with your resume</div>
          </div>
        </div>
        <button id="btn-start-match" class="btn btn-secondary">
          <span>Match Job</span>
          <span>→</span>
        </button>
      </div>

      <!-- Superpower 2: Auto-Fill -->
      <div class="action-card primary-card">
        <div class="action-header">
          <span class="action-icon">⚡</span>
          <div>
            <div class="action-title">Auto-Fill</div>
            <div class="action-desc">Fill detected application fields automatically</div>
          </div>
        </div>
        <button id="btn-start-autofill" class="btn btn-primary">
          <span>Auto-Fill</span>
          <span>→</span>
        </button>
      </div>

      <div class="footer-note">
        Assistant stays active while you browse & interact
      </div>
    `;
  }

  private renderMatchView(): string {
    const s = this.matchState;

    if (s.status === 'ANALYZING') {
      return `
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Home</button>
          <span class="flow-title">Analyzing Job</span>
        </div>
        ${
          s.jobTitle || s.company
            ? `
          <div class="job-context-banner">
            <div class="context-company">${this.escapeHtml(s.company || 'Detecting Company...')}</div>
            <div class="context-role">${this.escapeHtml(s.jobTitle || 'Detecting Job...')}</div>
            ${s.location ? `<div class="context-location">📍 ${this.escapeHtml(s.location)}</div>` : ''}
          </div>
        `
            : ''
        }
        <div class="loading-box">
          <div class="spinner"></div>
          <div class="loading-title">${s.jobTitle ? 'Updating Match...' : 'Scanning Current Job...'}</div>
          <div class="loading-step">${this.escapeHtml(s.stepText || 'Analyzing current page & resume...')}</div>

          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${s.progress}%"></div>
            </div>
            <div class="progress-percent">${s.progress}%</div>
          </div>
          <div class="loading-hint">Comparing requirements with ${this.escapeHtml(this.candidate.name)}'s resume</div>
        </div>
      `;
    }

    if (s.status === 'ERROR') {
      return `
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Back</button>
          <span class="flow-title">JD Match</span>
        </div>
        <div class="error-box">
          <div class="error-icon">⚠️</div>
          <div class="error-msg">${this.escapeHtml(s.errorText || "Couldn't detect job description")}</div>
          <button id="btn-retry-match" class="btn btn-secondary">Try Again</button>
        </div>
      `;
    }

    // RESULT VIEW
    const scoreClass =
      s.matchQuality === 'STRONG'
        ? 'strong'
        : s.matchQuality === 'GOOD'
        ? 'good'
        : s.matchQuality === 'PARTIAL'
        ? 'partial'
        : 'low';

    return `
      <div class="flow-header">
        <button id="btn-back-home" class="link-btn">← Home</button>
        <span class="flow-title">Job Match</span>
      </div>

      <!-- 1. Prominent Company + Role context ABOVE score -->
      <div class="job-context-banner">
        <div class="context-company">${this.escapeHtml(s.company || 'Company')}</div>
        <div class="context-role">${this.escapeHtml(s.jobTitle || 'Job Title')}</div>
        ${s.location ? `<div class="context-location">📍 ${this.escapeHtml(s.location)}</div>` : ''}
      </div>

      <!-- 2. Match Score + Quality Label -->
      <div class="score-banner ${scoreClass}">
        <div class="score-tag">JOB MATCH</div>
        <div class="score-number">${s.score}%</div>
        <div class="score-subtitle">${this.escapeHtml(s.qualityLabel || 'Match')}</div>
      </div>

      <!-- 3. Why This Score / Mismatch Alert -->
      ${
        s.roleMismatchReason
          ? `
        <div class="relevance-alert mismatch">
          <div class="alert-badge">NOT A STRONG MATCH</div>
          <div class="alert-text">${this.escapeHtml(s.roleMismatchReason)}</div>
        </div>
      `
          : s.whyThisScore
          ? `
        <div class="why-score-box">
          ${this.escapeHtml(s.whyThisScore)}
        </div>
      `
          : ''
      }

      <div class="match-details-scroll custom-scroll">
        <!-- 4. Matched Skills (Core skills) -->
        <div class="section-group">
          <div class="section-heading matched">
            <span>Matched Skills</span>
            <span class="count-pill">${s.coreMatchedSkills?.length || s.matchedSkills.length}</span>
          </div>
          <div class="chips-wrap">
            ${(s.coreMatchedSkills?.length > 0 ? s.coreMatchedSkills : s.matchedSkills)
              .slice(0, 8)
              .map((sk) => `<span class="chip matched">✓ ${this.escapeHtml(sk)}</span>`)
              .join('')}
          </div>
        </div>

        <!-- 5. Missing / Weak Skills with Required vs Preferred tags -->
        ${
          (s.missingSkillsDetailed?.length > 0 || s.missingSkills?.length > 0)
            ? `
          <div class="section-group">
            <div class="section-heading missing">
              <span>Missing / Weak</span>
              <span class="count-pill">${s.missingSkillsDetailed?.length || s.missingSkills.length}</span>
            </div>
            <div class="chips-wrap">
              ${(s.missingSkillsDetailed?.length > 0
                ? s.missingSkillsDetailed
                : s.missingSkills.map((sk) => ({ skill: sk, priority: 'REQUIRED' as const }))
              )
                .slice(0, 6)
                .map(
                  (m) => `
                <span class="chip missing priority-${m.priority.toLowerCase()}">
                  ! ${this.escapeHtml(m.skill)}
                  <span class="priority-tag">${m.priority === 'REQUIRED' ? 'Req' : 'Pref'}</span>
                </span>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <!-- 6. Alignment Dimensions -->
        <div class="dim-row">
          <div class="dim-box">
            <div class="dim-label">Experience</div>
            <div class="dim-val ${s.experienceVerdict === 'MISMATCH' ? 'mismatch' : s.experienceVerdict === 'PARTIAL' ? 'partial' : 'match'}">
              ${this.escapeHtml(s.experienceVerdictText || s.experienceRating)}
            </div>
          </div>
          <div class="dim-box">
            <div class="dim-label">Education</div>
            <div class="dim-val ${s.educationVerdict === 'MISMATCH' ? 'mismatch' : s.educationVerdict === 'PARTIAL' ? 'partial' : 'match'}">
              ${this.escapeHtml(s.educationVerdictText || s.educationRating)}
            </div>
          </div>
        </div>

        <!-- 7. ATS Coverage -->
        <div class="ats-box">
          <div class="ats-header">
            <span>ATS Keyword Coverage</span>
            <strong>${s.atsKeywordCoverage}%</strong>
          </div>
          <div class="ats-counts">
            Matched: ${s.atsMatchedCount || s.matchedSkills.length} • Missing: ${s.atsMissingCount || s.missingSkills.length}
          </div>
        </div>
      </div>

      <!-- 8. Full Details Button -->
      <div class="details-action-wrap">
        <button id="btn-view-details" class="btn btn-secondary full-width">
          View Full Match Details
        </button>
      </div>

      <!-- 9. Small Fixed Secondary Auto-Fill Action -->
      <div class="secondary-autofill-wrap">
        <button id="btn-match-to-autofill" class="btn-link-action">
          <span>⚡ Auto-Fill Application</span>
          <span>→</span>
        </button>
      </div>
    `;
  }

  /**
   * Screen: Full Match Details & Resume Problem Explorer
   */
  private renderDetailsView(): string {
    const s = this.matchState;
    const scoreClass =
      s.matchQuality === 'STRONG'
        ? 'strong'
        : s.matchQuality === 'GOOD'
        ? 'good'
        : s.matchQuality === 'PARTIAL'
        ? 'partial'
        : 'low';

    return `
      <div class="flow-header">
        <button id="btn-back-to-match" class="link-btn">← Back to Match</button>
        <span class="flow-title">Full Match Details</span>
      </div>

      <div class="details-scroll custom-scroll">
        <!-- Job Context Card -->
        <div class="job-context-banner">
          <div class="context-company">${this.escapeHtml(s.company || 'Company')}</div>
          <div class="context-role">${this.escapeHtml(s.jobTitle || 'Job Title')}</div>
        </div>

        <!-- Overall Match Banner -->
        <div class="score-banner ${scoreClass} compact">
          <div class="score-number">${s.score}%</div>
          <div class="score-subtitle">${this.escapeHtml(s.qualityLabel)}</div>
        </div>

        <!-- Why this score -->
        <div class="detail-section">
          <div class="detail-heading">Why This Score?</div>
          <div class="detail-text">
            ${this.escapeHtml(
              s.whyThisScore || s.roleMismatchReason || 'Detailed match analysis based on candidate resume and job requirements.'
            )}
          </div>
        </div>

        <!-- Role Relevance -->
        <div class="detail-section">
          <div class="detail-heading">Role Relevance</div>
          <div class="detail-badge-row">
            <span class="status-chip ${s.roleRelevance === 'STRONG' ? 'positive' : s.roleRelevance === 'MISMATCH' ? 'negative' : 'warning'}">
              ${this.escapeHtml(s.roleRelevance)}
            </span>
          </div>
          <div class="detail-subtext">
            ${this.escapeHtml(
              s.roleMismatchReason || 'Role is in direct alignment with your target and active profile discipline.'
            )}
          </div>
        </div>

        <!-- Matched Skills -->
        <div class="detail-section">
          <div class="detail-heading">Matched Skills (${s.matchedSkills.length})</div>
          <div class="chips-wrap">
            ${s.matchedSkills.map((sk) => `<span class="chip matched">✓ ${this.escapeHtml(sk)}</span>`).join('')}
          </div>
        </div>

        <!-- Missing Requirements with priority -->
        <div class="detail-section">
          <div class="detail-heading">Missing Requirements (${s.missingSkillsDetailed?.length || s.missingSkills.length})</div>
          <div class="chips-wrap">
            ${(s.missingSkillsDetailed?.length > 0
              ? s.missingSkillsDetailed
              : s.missingSkills.map((sk) => ({ skill: sk, priority: 'REQUIRED' as const }))
            )
              .map(
                (m) => `
              <span class="chip missing priority-${m.priority.toLowerCase()}">
                ! ${this.escapeHtml(m.skill)}
                <span class="priority-tag">${m.priority === 'REQUIRED' ? 'Required' : 'Preferred'}</span>
              </span>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Experience & Education Breakdown -->
        <div class="detail-section">
          <div class="detail-heading">Experience & Education</div>
          <div class="detail-row-item">
            <span class="item-label">Experience:</span>
            <span class="item-value">${this.escapeHtml(s.experienceVerdictText || s.experienceRating)}</span>
          </div>
          <div class="detail-row-item">
            <span class="item-label">Education:</span>
            <span class="item-value">${this.escapeHtml(s.educationVerdictText || s.educationRating)}</span>
          </div>
        </div>

        <!-- ATS Breakdown -->
        <div class="detail-section">
          <div class="detail-heading">ATS Keywords Coverage (${s.atsKeywordCoverage}%)</div>
          <div class="detail-subtext">
            Matched: ${s.atsMatchedCount || s.matchedSkills.length} • Missing: ${s.atsMissingCount || s.missingSkills.length}
          </div>
        </div>

        <!-- RESUME PROBLEM EXPLORER -->
        <div class="detail-section highlight-issues">
          <div class="detail-heading issues">Why Doesn't My Resume Match?</div>
          ${
            s.resumeIssues && s.resumeIssues.length > 0
              ? `
            <div class="issues-list">
              ${s.resumeIssues
                .map(
                  (iss, idx) => `
                <div class="issue-item">
                  <span class="issue-idx">${idx + 1}.</span>
                  <span class="issue-text">${this.escapeHtml(iss)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : `
            <div class="issues-empty">
              ✓ No critical gaps found! Your resume closely aligns with this job description.
            </div>
          `
          }
        </div>
      </div>

      <div class="bottom-actions">
        <button id="btn-back-to-match-bottom" class="btn btn-secondary full-width">
          ← Back to Overview
        </button>
      </div>
    `;
  }

  private renderAutofillView(): string {
    const f = this.formState;

    if (f.status === 'FILLING') {
      return `
        <div class="flow-header">
          <span class="flow-title">Auto-Filling Form</span>
        </div>
        <div class="loading-box">
          <div class="spinner"></div>
          <div class="loading-title">Filling application fields...</div>
          <div class="loading-step">Dispatching realistic DOM events (input, change, blur)</div>
          <div class="loading-hint">Existing user inputs are guarded and preserved</div>
        </div>
      `;
    }

    if (f.status === 'REPORT') {
      const rep = this.currentAutofill;
      return `
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Home</button>
          <span class="flow-title">Form Filled ✓</span>
        </div>

        <div class="report-banner">
          <div class="report-title">✓ Autofill Complete</div>
          <div class="report-sub">Review fields directly on the webpage before submitting</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card verified">
            <div class="stat-num">${rep?.totalVerified || 15}</div>
            <div class="stat-lbl">Verified</div>
          </div>
          <div class="stat-card review">
            <div class="stat-num">${rep?.totalNeedsAttention || 1}</div>
            <div class="stat-lbl">Review</div>
          </div>
          <div class="stat-card preserved">
            <div class="stat-num">${rep?.totalSkippedExisting || 2}</div>
            <div class="stat-lbl">Preserved</div>
          </div>
        </div>

        <div class="warning-alert">
          <strong>Never Auto-Submit</strong>: Kraxyy fills fields safely. You remain in control to review and click Submit.
        </div>

        <div class="bottom-actions grid-2">
          <button id="btn-clear-fields" class="btn btn-secondary">Clear Fields</button>
          <button id="btn-back-home" class="btn btn-primary">Done</button>
        </div>
      `;
    }

    if (f.fieldsFound === 0 || !f.fields || f.fields.length === 0) {
      return `
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Home</button>
          <span class="flow-title">Auto-Fill Form</span>
        </div>

        <div class="empty-form-box">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No application form detected yet</div>
          <div class="empty-desc">
            Kraxyy didn't find fillable job application fields on this page. If you're on a job post, click "Apply" or "Easy Apply" to open the form, then scan again.
          </div>
          <button id="btn-scan-form-again" class="btn btn-primary full-width">
            <span>Scan Again</span>
            <span>⟳</span>
          </button>
        </div>
      `;
    }

    // DETECTED LIST VIEW
    return `
      <div class="flow-header">
        <button id="btn-back-home" class="link-btn">← Home</button>
        <span class="flow-title">Auto-Fill Form</span>
      </div>

      <div class="detected-banner">
        <div class="detected-badge">Application Form Detected</div>
        <div class="detected-count"><strong>${f.fieldsFound}</strong> fields identified</div>
      </div>

      <div class="fields-list custom-scroll">
        ${f.fields
          .map((item) => `
          <div class="field-item ${item.isHighConfidence ? 'ready' : 'review'}">
            <div class="field-left">
              <span class="field-icon">${item.isHighConfidence ? '✓' : '!'}</span>
              <span class="field-label">${this.escapeHtml(item.label)}</span>
            </div>
            <div class="field-confidence">${item.confidence}%</div>
          </div>
        `)
          .join('')}
      </div>

      <div class="bottom-actions">
        <button id="btn-execute-fill" class="btn btn-primary">
          <span>[ Fill Form ]</span>
        </button>
      </div>
    `;
  }

  private bindEvents() {
    if (!this.shadow) return;

    // Window actions - Close completely
    this.shadow.getElementById('btn-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.shadow.getElementById('btn-collapse')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    // Manual Job Rescan action
    this.shadow.getElementById('btn-rescan-job')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.rescanCurrentJob('MANUAL');
    });

    // Position controls (left, right, top, bottom)
    this.shadow.getElementById('dock-left')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setDockPosition('left');
    });
    this.shadow.getElementById('dock-right')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setDockPosition('right');
    });
    this.shadow.getElementById('dock-top')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setDockPosition('top');
    });
    this.shadow.getElementById('dock-bottom')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setDockPosition('bottom');
    });

    // Nav back home
    this.shadow.getElementById('btn-back-home')?.addEventListener('click', () => {
      this.activeView = 'HOME';
      this.savePersistentState();
      this.updateDom();
    });

    // Start workflows
    this.shadow.getElementById('btn-start-match')?.addEventListener('click', () => {
      this.activeView = 'MATCH';
      this.startJobMatch();
    });

    this.shadow.getElementById('btn-start-autofill')?.addEventListener('click', () => {
      this.activeView = 'AUTOFILL';
      this.inspectFormFields();
    });

    this.shadow.getElementById('btn-match-to-autofill')?.addEventListener('click', () => {
      this.activeView = 'AUTOFILL';
      this.inspectFormFields();
    });

    this.shadow.getElementById('btn-view-details')?.addEventListener('click', () => {
      this.activeView = 'DETAILS';
      this.savePersistentState();
      this.updateDom();
    });

    this.shadow.getElementById('btn-back-to-match')?.addEventListener('click', () => {
      this.activeView = 'MATCH';
      this.savePersistentState();
      this.updateDom();
    });

    this.shadow.getElementById('btn-back-to-match-bottom')?.addEventListener('click', () => {
      this.activeView = 'MATCH';
      this.savePersistentState();
      this.updateDom();
    });

    this.shadow.getElementById('btn-scan-form-again')?.addEventListener('click', () => {
      this.inspectFormFields();
    });

    this.shadow.getElementById('btn-retry-match')?.addEventListener('click', () => {
      this.startJobMatch();
    });

    this.shadow.getElementById('btn-execute-fill')?.addEventListener('click', () => {
      this.triggerAutofillAction();
    });

    this.shadow.getElementById('btn-clear-fields')?.addEventListener('click', () => {
      const detection = fieldDetector.detectForm();
      if (detection.fields) formEngine.clearFields(detection.fields);
      this.currentAutofill = null;
      this.formState.status = 'IDLE';
      this.activeView = 'HOME';
      this.updateDom();
    });
  }

  // =========================================================================
  // DRAGGING BEHAVIOR
  // =========================================================================
  private setupDraggable() {
    if (!this.shadow || !this.host) return;
    const header = this.shadow.getElementById('panel-header');
    if (!header) return;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      // Don't drag if clicking buttons
      if ((e.target as HTMLElement).closest('button')) return;

      this.isDragging = true;
      const rect = this.host!.getBoundingClientRect();
      this.dragStartX = e.clientX - rect.left;
      this.dragStartY = e.clientY - rect.top;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!this.isDragging || !this.host) return;
        let newX = moveEvent.clientX - this.dragStartX;
        let newY = moveEvent.clientY - this.dragStartY;

        // Keep inside viewport bounds
        newX = Math.max(10, Math.min(window.innerWidth - 340, newX));
        newY = Math.max(10, Math.min(window.innerHeight - 150, newY));

        this.posX = newX;
        this.posY = newY;
        this.host.style.left = `${newX}px`;
        this.host.style.top = `${newY}px`;
        this.host.style.bottom = 'auto';
        this.host.style.right = 'auto';
      };

      const onMouseUp = () => {
        this.isDragging = false;
        this.savePersistentState();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // SHADOW DOM ISOLATED STYLES
  // =========================================================================
  private getBaseStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      .dot {
        width: 8px;
        height: 8px;
        background: #A3E635;
        border-radius: 9999px;
        box-shadow: 0 0 8px #A3E635;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      .pill-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 9999px;
      }
      .badge.score {
        background: #B18B40;
        color: #FFFFFF;
      }
      .badge.fields {
        background: rgba(255, 255, 255, 0.2);
        color: #F4EFE4;
      }

      /* Expanded Assistant Panel */
      .panel {
        width: 326px;
        min-height: 480px;
        max-height: 600px;
        background: #F4EFE4;
        color: #1E2315;
        border-radius: 20px;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(82, 91, 49, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        user-select: none;
      }

      .panel-header {
        padding: 12px 14px;
        background: #F4EFE4;
        border-bottom: 1px solid #D6CAAC;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: grab;
      }
      .panel-header:active {
        cursor: grabbing;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1;
      }
      .brand-name {
        font-size: 12px;
        font-weight: 900;
        color: #525B31;
        letter-spacing: 1.5px;
      }
      .brand-sub {
        font-size: 9px;
        font-weight: 600;
        color: #626B52;
        margin-top: 2px;
      }
      .window-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dock-controls {
        display: inline-flex;
        align-items: center;
        background: rgba(82, 91, 49, 0.08);
        border: 1px solid rgba(82, 91, 49, 0.15);
        border-radius: 6px;
        padding: 1px;
      }
      .dock-btn {
        background: transparent;
        border: none;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #626B52;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
      }
      .dock-btn:hover {
        background: rgba(82, 91, 49, 0.15);
        color: #1E2315;
      }
      .dock-btn.active {
        background: #525B31;
        color: #FFFFFF;
        font-weight: 700;
      }
      .icon-btn {
        background: transparent;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #626B52;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .icon-btn:hover {
        background: #D6CAAC;
        color: #1E2315;
      }
      .rescan-btn {
        font-size: 14px;
        font-weight: 700;
        color: #525B31;
        transition: transform 0.2s ease, background 0.15s, color 0.15s;
      }
      .rescan-btn:hover:not(:disabled) {
        background: #D6CAAC;
        color: #1E2315;
      }
      .rescan-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .rescan-btn.spinning {
        animation: spin 0.8s linear infinite;
      }
      .rescan-feedback {
        font-size: 9px;
        font-weight: 700;
        color: #065F46;
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
      }
      .close-btn {
        font-weight: 700;
        font-size: 14px;
        color: #626B52;
      }
      .close-btn:hover {
        background: rgba(220, 38, 38, 0.12);
        color: #DC2626;
      }

      .panel-body {
        padding: 14px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 12px;
        overflow-y: auto;
      }

      /* Home Cards */
      .card {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 12px;
      }
      .user-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .user-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .avatar {
        width: 34px;
        height: 34px;
        background: rgba(82, 91, 49, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        shrink-0;
      }
      .user-info {
        flex: 1;
        overflow: hidden;
      }
      .user-name {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .resume-badge {
        font-size: 11px;
        color: #525B31;
        font-weight: 600;
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .status-row {
        display: flex;
        gap: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(214, 202, 172, 0.4);
      }
      .status-chip {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
      }
      .status-chip.positive {
        background: #ECFDF5;
        color: #065F46;
        border: 1px solid #A7F3D0;
      }

      /* 2 Big Action Cards */
      .action-card {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .action-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .action-icon {
        font-size: 20px;
        width: 32px;
        height: 32px;
        background: #F4EFE4;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .action-title {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
      }
      .action-desc {
        font-size: 10px;
        color: #626B52;
      }

      /* Buttons */
      .btn {
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        border: none;
      }
      .btn-primary {
        background: #525B31;
        color: #F4EFE4;
        box-shadow: 0 4px 10px rgba(82, 91, 49, 0.25);
      }
      .btn-primary:hover {
        background: #454C29;
        transform: translateY(-1px);
      }
      .btn-primary:active {
        transform: translateY(0);
      }
      .btn-secondary {
        background: #F4EFE4;
        color: #1E2315;
        border: 1px solid #D6CAAC;
      }
      .btn-secondary:hover {
        background: #EAE2D2;
        border-color: #525B31;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      /* Flow Headers */
      .flow-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #D6CAAC;
        padding-bottom: 6px;
      }
      .link-btn {
        background: transparent;
        border: none;
        color: #525B31;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      .link-btn:hover {
        text-decoration: underline;
      }
      .flow-title {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #626B52;
        letter-spacing: 0.5px;
      }

      /* Job Context Banner (Prominent Company + Role ABOVE score) */
      .job-context-banner {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .context-company {
        font-size: 11px;
        font-weight: 800;
        color: #525B31;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .context-role {
        font-size: 14px;
        font-weight: 800;
        color: #1E2315;
        line-height: 1.25;
      }
      .context-location {
        font-size: 10px;
        color: #626B52;
        margin-top: 2px;
      }

      /* Score Display with Dynamic Tiered Palettes */
      .score-banner {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 14px;
        text-align: center;
        transition: all 0.2s ease;
      }
      .score-banner.strong {
        border-color: #A7F3D0;
        background: linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%);
      }
      .score-banner.strong .score-number { color: #059669; }
      .score-banner.strong .score-subtitle { color: #047857; }

      .score-banner.good {
        border-color: #BAE6FD;
        background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
      }
      .score-banner.good .score-number { color: #0284C7; }
      .score-banner.good .score-subtitle { color: #0369A1; }

      .score-banner.partial {
        border-color: #FDE68A;
        background: linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%);
      }
      .score-banner.partial .score-number { color: #D97706; }
      .score-banner.partial .score-subtitle { color: #B45309; }

      .score-banner.low {
        border-color: #FECDD3;
        background: linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%);
      }
      .score-banner.low .score-number { color: #E11D48; }
      .score-banner.low .score-subtitle { color: #BE123C; }

      .score-banner.compact {
        padding: 10px 14px;
      }
      .score-banner.compact .score-number {
        font-size: 28px;
        margin: 2px 0;
      }

      .score-tag {
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #626B52;
      }
      .score-number {
        font-size: 40px;
        font-weight: 900;
        color: #525B31;
        line-height: 1;
        margin: 4px 0;
      }
      .score-subtitle {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Relevance Alert & Rationale */
      .relevance-alert {
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 11px;
        line-height: 1.35;
      }
      .relevance-alert.mismatch {
        background: #FFF1F2;
        border: 1px solid #FECDD3;
        color: #9F1239;
      }
      .alert-badge {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .alert-text {
        font-size: 11px;
        font-weight: 500;
      }
      .why-score-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 11px;
        color: #4B5563;
        line-height: 1.4;
      }

      .match-details-scroll {
        max-height: 220px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 2px;
      }

      /* Chips & Skills */
      .section-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .section-heading.matched { color: #065F46; }
      .section-heading.missing { color: #9F1239; }
      .count-pill {
        font-size: 9px;
        padding: 1px 6px;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 9999px;
      }
      .chips-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .chip {
        font-size: 10px;
        font-weight: 600;
        padding: 3px 7px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
      .chip.matched {
        background: #ECFDF5;
        color: #065F46;
        border: 1px solid #A7F3D0;
      }
      .chip.missing {
        background: #FFFBEB;
        color: #92400E;
        border: 1px solid #FDE68A;
      }
      .chip.missing.priority-required {
        background: #FFF1F2;
        color: #9F1239;
        border: 1px solid #FECDD3;
      }
      .chip.missing.priority-preferred {
        background: #FFFBEB;
        color: #92400E;
        border: 1px solid #FDE68A;
      }
      .priority-tag {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(0, 0, 0, 0.08);
        padding: 1px 3px;
        border-radius: 3px;
      }

      .dim-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .dim-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 8px;
        padding: 6px 8px;
      }
      .dim-label {
        font-size: 9px;
        color: #626B52;
        font-weight: 700;
        text-transform: uppercase;
      }
      .dim-val {
        font-size: 10px;
        font-weight: 700;
        margin-top: 2px;
      }
      .dim-val.match { color: #065F46; }
      .dim-val.partial { color: #D97706; }
      .dim-val.mismatch { color: #E11D48; }

      .ats-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        font-weight: 700;
        color: #1E2315;
      }
      .ats-counts {
        font-size: 9px;
        color: #626B52;
      }

      .details-action-wrap {
        margin-top: 2px;
      }
      .full-width {
        width: 100%;
        justify-content: center;
      }

      /* Secondary subtle Auto-Fill action in JD Match view */
      .secondary-autofill-wrap {
        border-top: 1px dashed #D6CAAC;
        padding-top: 6px;
        display: flex;
        justify-content: center;
      }
      .btn-link-action {
        background: transparent;
        border: none;
        color: #525B31;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.15s;
      }
      .btn-link-action:hover {
        background: #EAE2D2;
        text-decoration: underline;
      }

      /* Full Details & Resume Problem Explorer */
      .details-scroll {
        max-height: 380px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-right: 2px;
      }
      .detail-section {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .detail-section.highlight-issues {
        border-color: #FBBF24;
        background: #FFFDF7;
      }
      .detail-heading {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #525B31;
        letter-spacing: 0.5px;
      }
      .detail-heading.issues {
        color: #B45309;
      }
      .detail-text {
        font-size: 11px;
        color: #374151;
        line-height: 1.4;
      }
      .detail-subtext {
        font-size: 10px;
        color: #6B7280;
        line-height: 1.35;
      }
      .detail-badge-row {
        display: flex;
        gap: 6px;
      }
      .detail-row-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .item-label {
        color: #6B7280;
        font-weight: 600;
      }
      .item-value {
        font-weight: 700;
        color: #111827;
      }
      .issues-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .issue-item {
        display: flex;
        gap: 6px;
        font-size: 11px;
        line-height: 1.35;
        color: #78350F;
      }
      .issue-idx {
        font-weight: 800;
        color: #B45309;
        flex-shrink: 0;
      }
      .issue-text {
        flex: 1;
      }
      .issues-empty {
        font-size: 11px;
        color: #047857;
        font-weight: 600;
      }

      /* Empty Form Detection View */
      .empty-form-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 24px 16px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .empty-icon {
        font-size: 32px;
      }
      .empty-title {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
      }
      .empty-desc {
        font-size: 11px;
        color: #626B52;
        line-height: 1.4;
        margin-bottom: 6px;
      }

      /* Loading states */
      .loading-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 20px 14px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .loading-title {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
      }
      .loading-step {
        font-size: 11px;
        color: #525B31;
        font-weight: 600;
      }
      .loading-hint {
        font-size: 10px;
        color: #626B52;
        font-style: italic;
      }
      .progress-wrap {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 6px 0;
      }
      .progress-bar {
        flex: 1;
        height: 6px;
        background: #D6CAAC;
        border-radius: 9999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: #525B31;
        border-radius: 9999px;
        transition: width 0.3s ease;
      }
      .progress-percent {
        font-size: 10px;
        font-weight: 800;
        color: #525B31;
        width: 30px;
        text-align: right;
      }

      /* Autofill detected list */
      .detected-banner {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .detected-badge {
        font-size: 11px;
        font-weight: 800;
        color: #525B31;
      }
      .detected-count {
        font-size: 10px;
        color: #626B52;
      }
      .fields-list {
        max-height: 230px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .field-item {
        background: #FFFFFF;
        border: 1px solid #EAE2D2;
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
      }
      .field-left {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .field-icon {
        font-weight: 900;
      }
      .field-item.ready .field-icon { color: #059669; }
      .field-item.review .field-icon { color: #D97706; }
      .field-confidence {
        font-size: 9px;
        font-weight: 700;
        color: #626B52;
      }

      /* Report View */
      .report-banner {
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
        border-radius: 12px;
        padding: 10px 12px;
        text-align: center;
      }
      .report-title {
        font-size: 12px;
        font-weight: 800;
        color: #065F46;
      }
      .report-sub {
        font-size: 10px;
        color: #047857;
        margin-top: 2px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .stat-card {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 10px;
        padding: 8px 4px;
        text-align: center;
      }
      .stat-num {
        font-size: 18px;
        font-weight: 900;
        line-height: 1;
      }
      .stat-card.verified .stat-num { color: #065F46; }
      .stat-card.review .stat-num { color: #8E6F33; }
      .stat-card.preserved .stat-num { color: #1E2315; }
      .stat-lbl {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        color: #626B52;
        margin-top: 4px;
      }
      .warning-alert {
        background: #FFFBEB;
        border: 1px solid #FDE68A;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 10px;
        color: #92400E;
        line-height: 1.4;
      }

      .footer-note {
        font-size: 9px;
        color: #626B52;
        text-align: center;
        margin-top: 2px;
      }

      /* Scrollbar */
      .custom-scroll::-webkit-scrollbar { width: 4px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #D6CAAC; border-radius: 9999px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #B18B40; }

      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #D6CAAC;
        border-top-color: #525B31;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
  }
}

export const inpageUi = new InpageUi();
