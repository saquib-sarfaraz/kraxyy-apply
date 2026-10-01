// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InpageUi } from './inpageUi';

describe('InpageUi Assistant Gating & Intelligence Guardrails', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('correctly excludes Kraxyy development ports and Kraxyy web domains', () => {
    // Kraxyy dev port 5173
    delete (window as any).location;
    (window as any).location = new URL('http://localhost:5173/dashboard');
    expect(InpageUi.isExcludedDomain()).toBe(true);

    // Kraxyy dev port 5001
    (window as any).location = new URL('http://localhost:5001/api/v1');
    expect(InpageUi.isExcludedDomain()).toBe(true);

    // Kraxyy production domain
    (window as any).location = new URL('https://kraxyy.com/app/resumes');
    expect(InpageUi.isExcludedDomain()).toBe(true);

    (window as any).location = new URL('https://app.kraxyy.com/dashboard');
    expect(InpageUi.isExcludedDomain()).toBe(true);

    // Job sites must NOT be excluded
    (window as any).location = new URL('https://www.linkedin.com/jobs/view/123456');
    expect(InpageUi.isExcludedDomain()).toBe(false);

    (window as any).location = new URL('https://boards.greenhouse.io/stripe/jobs/98765');
    expect(InpageUi.isExcludedDomain()).toBe(false);
  });

  it('identifies supported job board or careers pages accurately', () => {
    (window as any).location = new URL('https://www.linkedin.com/jobs/view/123456');
    expect(InpageUi.isSupportedJobOrApplicationPage(document)).toBe(true);

    (window as any).location = new URL('https://jobs.lever.co/company/frontend-engineer');
    expect(InpageUi.isSupportedJobOrApplicationPage(document)).toBe(true);

    (window as any).location = new URL('https://stripe.com/careers/jobs/software-engineer');
    expect(InpageUi.isSupportedJobOrApplicationPage(document)).toBe(true);

    // Random non-job site without job content or form should return false
    (window as any).location = new URL('https://www.google.com/search?q=test');
    expect(InpageUi.isSupportedJobOrApplicationPage(document)).toBe(false);

    // Kraxyy apply own domain should always return false
    (window as any).location = new URL('http://localhost:5173/jobs/saved');
    expect(InpageUi.isSupportedJobOrApplicationPage(document)).toBe(false);
  });

  it('resets match state when navigating to a new job on SPAs', () => {
    const ui = new InpageUi();
    (ui as any).matchState.score = 92;
    (ui as any).matchState.status = 'RESULT';
    (ui as any).matchState.jobTitle = 'Senior Frontend Engineer';

    ui.resetForNewJob();

    expect((ui as any).matchState.score).toBe(0);
    expect((ui as any).matchState.status).toBe('IDLE');
    expect((ui as any).matchState.jobTitle).toBe('');
    expect((ui as any).matchState.matchedSkills).toEqual([]);
    expect((ui as any).matchState.missingSkills).toEqual([]);
  });

  describe('True Close and Reopen Lifecycle', () => {
    beforeEach(() => {
      (window as any).location = new URL('https://www.linkedin.com/jobs/view/123456');
      sessionStorage.clear();
      document.body.innerHTML = '';
    });

    it('starts with visibility closed by default and nothing on webpage', () => {
      const ui = new InpageUi();
      expect(ui.getVisibility()).toBe('closed');
      expect(document.getElementById('crazy-assistant-root')).toBeNull();
    });

    it('opens panel on explicit open() with single root and renders content', () => {
      const ui = new InpageUi();
      ui.open();

      expect(ui.getVisibility()).toBe('open');
      const root = document.getElementById('crazy-assistant-root');
      expect(root).not.toBeNull();
      // Ensure only single root exists
      expect(document.querySelectorAll('#crazy-assistant-root').length).toBe(1);
    });

    it('completely removes panel on close() with zero DOM residue', () => {
      const ui = new InpageUi();
      ui.open();
      expect(document.getElementById('crazy-assistant-root')).not.toBeNull();

      ui.close();

      expect(ui.getVisibility()).toBe('closed');
      expect(document.getElementById('crazy-assistant-root')).toBeNull();
      // No floating button, no collapsed badge, no residue
      expect(document.body.children.length).toBe(0);
    });

    it('background detection (updateIntelligence) never reopens or unhides a closed panel', () => {
      const ui = new InpageUi();
      ui.close();

      // Background intelligence update (simulating job detection, DOM mutation, or scroll)
      ui.updateIntelligence({
        pageType: 'JOB',
        job: {
          detected: true,
          confidence: 0.95,
          normalizedJob: {
            title: 'Full Stack Engineer',
            company: 'Tech Corp',
            description: 'React, Node, TypeScript',
            sourceUrl: 'https://linkedin.com'
          }
        },
        url: 'https://linkedin.com',
        isTopFrame: true,
        timestamp: Date.now()
      });

      // Panel must stay completely closed and absent
      expect(ui.getVisibility()).toBe('closed');
      expect(document.getElementById('crazy-assistant-root')).toBeNull();
    });

    it('reopens with latest intelligence when explicitly reopened', () => {
      const ui = new InpageUi();
      ui.open();
      ui.close();

      // Detection updates while closed
      ui.updateIntelligence({
        pageType: 'JOB',
        job: {
          detected: true,
          confidence: 0.95,
          normalizedJob: {
            title: 'Lead Architect',
            company: 'Acme Inc',
            description: 'Distributed Systems',
            sourceUrl: 'https://linkedin.com'
          }
        },
        url: 'https://linkedin.com',
        isTopFrame: true,
        timestamp: Date.now()
      });

      // Reopen
      ui.open();
      expect(ui.getVisibility()).toBe('open');
      const root = document.getElementById('crazy-assistant-root');
      expect(root).not.toBeNull();
      expect((ui as any).currentState?.job?.normalizedJob?.title).toBe('Lead Architect');
    });

    it('preserves panel dock position across close and reopen', () => {
      const ui = new InpageUi();
      ui.open();
      ui.setDockPosition('left');
      expect(ui.isDockedLeft()).toBe(true);

      ui.close();
      expect(document.getElementById('crazy-assistant-root')).toBeNull();

      ui.open();
      expect(ui.isDockedLeft()).toBe(true);
      expect((ui as any).positionPreset).toContain('left');
    });
  });

  describe('Manual Job Rescan & Stale Protection', () => {
    beforeEach(() => {
      (window as any).location = new URL('https://www.linkedin.com/jobs/view/123456');
      sessionStorage.clear();
      document.body.innerHTML = '';
    });

    it('renders the ↻ rescan button in the header with correct attributes', () => {
      const ui = new InpageUi();
      ui.open();

      const root = document.getElementById('crazy-assistant-root');
      expect(root).not.toBeNull();
      const rescanBtn = root?.shadowRoot?.getElementById('btn-rescan-job');
      expect(rescanBtn).not.toBeNull();
      expect(rescanBtn?.getAttribute('title')).toBe('Rescan current job');
      expect(rescanBtn?.getAttribute('aria-label')).toBe('Rescan current job');
      expect(rescanBtn?.textContent?.trim()).toBe('↻');
    });

    it('immediately invalidates stale job match data when rescan is initiated', async () => {
      document.head.innerHTML = '';
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'React Developer',
        hiringOrganization: { '@type': 'Organization', name: 'Tech Corp' },
        description: 'We are hiring a React Developer with TypeScript and Node.js.'
      });
      document.head.appendChild(script);

      // Mock pending chrome.runtime.sendMessage
      (globalThis as any).chrome = {
        runtime: {
          sendMessage: vi.fn()
        }
      };

      const ui = new InpageUi();
      ui.open();

      // Seed with initial Job A match result
      (ui as any).matchState = {
        ...(ui as any).matchState,
        jobTitle: 'Job A Engineer',
        company: 'Company A',
        score: 88,
        status: 'RESULT',
        matchedSkills: ['React', 'Node'],
        missingSkills: ['AWS']
      };
      (ui as any).currentJobIdentity = 'company a::job a engineer';

      // Trigger rescan
      ui.rescanCurrentJob('MANUAL');

      expect(ui.getIsRescanning()).toBe(true);
      expect(ui.getCurrentScanId()).toBeTruthy();
      // Old match score and skills must be cleared immediately, not displayed stale
      expect((ui as any).matchState.score).toBe(0);
      expect((ui as any).matchState.status).toBe('ANALYZING');
      expect((ui as any).matchState.matchedSkills).toEqual([]);
      expect((ui as any).matchState.missingSkills).toEqual([]);
    });

    it('prevents duplicate concurrent scans when rescan is triggered multiple times rapidly', async () => {
      document.head.innerHTML = '';
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'React Developer',
        hiringOrganization: { '@type': 'Organization', name: 'Tech Corp' },
        description: 'We are hiring a React Developer with TypeScript and Node.js.'
      });
      document.head.appendChild(script);

      (globalThis as any).chrome = {
        runtime: {
          sendMessage: vi.fn()
        }
      };

      const ui = new InpageUi();
      ui.open();

      ui.rescanCurrentJob('MANUAL');
      const firstScanId = ui.getCurrentScanId();
      expect(ui.getIsRescanning()).toBe(true);

      // Subsequent call while still rescanning
      ui.rescanCurrentJob('MANUAL');
      // Scan ID should not change and no second scan spawned
      expect(ui.getCurrentScanId()).toBe(firstScanId);
    });

    it('replaces old Job A data with newly detected Job B data in updateIntelligence', () => {
      const ui = new InpageUi();
      ui.open();

      // Simulate initial Job A intelligence
      ui.updateIntelligence({
        pageType: 'JOB',
        job: {
          detected: true,
          confidence: 0.9,
          normalizedJob: {
            title: 'Full Stack Engineer',
            company: 'Digital Alpha',
            description: 'React, Node',
            sourceUrl: 'https://linkedin.com/jobs/view/111'
          },
          match: {
            overallScore: 40,
            matchedSkills: ['JavaScript'],
            missingSkills: ['Kubernetes']
          } as any
        },
        url: 'https://linkedin.com/jobs/search-results/?currentJobId=111',
        isTopFrame: true,
        timestamp: Date.now()
      });

      expect((ui as any).matchState.jobTitle).toBe('Full Stack Engineer');
      expect((ui as any).matchState.company).toBe('Digital Alpha');
      expect((ui as any).matchState.score).toBe(40);

      // Now user clicks Job B on LinkedIn SPA
      ui.updateIntelligence({
        pageType: 'JOB',
        job: {
          detected: true,
          confidence: 0.95,
          normalizedJob: {
            title: 'Frontend Developer',
            company: 'Invictus',
            description: 'React, TypeScript, CSS',
            sourceUrl: 'https://linkedin.com/jobs/view/222'
          },
          match: {
            overallScore: 91,
            matchedSkills: ['React', 'TypeScript', 'CSS'],
            missingSkills: []
          } as any
        },
        url: 'https://linkedin.com/jobs/search-results/?currentJobId=222',
        isTopFrame: true,
        timestamp: Date.now()
      });

      // Old Job A data must be completely replaced by Job B data
      expect((ui as any).matchState.jobTitle).toBe('Frontend Developer');
      expect((ui as any).matchState.company).toBe('Invictus');
      expect((ui as any).matchState.score).toBe(91);
      expect((ui as any).matchState.matchedSkills).toEqual(['React', 'TypeScript', 'CSS']);
    });
  });
});
