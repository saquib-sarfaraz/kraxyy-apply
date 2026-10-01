// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { JobPageDetector } from './jobDetector';
import { JobExtractor } from './jobExtractor';
import { JobMatchService } from './jobMatchService';
import { IUserProfile } from '@kraxyy/types';

describe('Job Page Detection and Extraction Suite', () => {
  let detector: JobPageDetector;
  let extractor: JobExtractor;
  let matchService: JobMatchService;

  const mockUserProfile: IUserProfile = {
    id: 'user-123',
    userId: 'user-123',
    personal: {
      firstName: 'Saquib',
      lastName: 'Sarfaraz',
      email: 'saquib@example.com',
      phone: '+1 (555) 234-5678',
      city: 'San Francisco',
      stateOrProvince: 'CA',
      postalCode: '94105',
      country: 'United States',
      linkedin: 'https://linkedin.com/in/saquib',
      github: 'https://github.com/saquib'
    },
    professional: {
      currentTitle: 'Senior Full-Stack Software Engineer',
      yearsOfExperience: 6,
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      summary: 'Senior full-stack engineer with 6+ years experience in TypeScript, React, Node.js, and cloud systems.'
    },
    educations: [
      {
        id: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: "Bachelor's",
        fieldOfStudy: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-15'
      }
    ],
    experiences: [
      {
        id: 'exp-1',
        company: 'CloudScale Technologies',
        jobTitle: 'Senior Software Engineer',
        startDate: '2021-01-01',
        isCurrent: true,
        description: 'Lead engineering for customer portal with React, TypeScript, and microservices.',
        technologies: ['TypeScript', 'React', 'Node.js']
      }
    ],
    projects: [],
    certifications: [],
    languages: [],
    workAuthorization: {
      authorizedToWork: true,
      sponsorshipRequired: false
    },
    preferences: {
      targetRoles: ['Senior Full-Stack Engineer', 'Frontend Platform Engineer'],
      locations: ['San Francisco, CA', 'Remote'],
      remote: true,
      internship: false,
      fullTime: true,
      experienceLevel: 'SENIOR',
      industries: []
    },
    completionPercentage: 92,
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    detector = new JobPageDetector();
    extractor = new JobExtractor();
    matchService = new JobMatchService();
  });

  describe('JobPageDetector', () => {
    it('detects a job page via JSON-LD schema with high confidence', () => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Staff Software Engineer',
        hiringOrganization: {
          '@type': 'Organization',
          name: 'Stripe'
        },
        description: 'Build reliable developer payments infrastructure with React and Node.js.'
      });
      document.head.appendChild(script);

      const detection = detector.detectJob(document);
      expect(detection.isJobPage).toBe(true);
      expect(detection.confidence).toBeGreaterThanOrEqual(0.8);
      expect(detection.source).toBe('JSON_LD');
      expect(detection.job?.title).toBe('Staff Software Engineer');
      expect(detection.job?.company).toBe('Stripe');
    });

    it('returns false for a non-job page', () => {
      document.body.innerHTML = `
        <header><nav><a href="/">Home</a><a href="/about">About Us</a></nav></header>
        <main>
          <h1>Welcome to our Company</h1>
          <p>We provide enterprise cloud management solutions for teams globally.</p>
        </main>
      `;

      const detection = detector.detectJob(document);
      expect(detection.isJobPage).toBe(false);
      expect(detection.confidence).toBeLessThan(0.45);
    });

    it('detects job page on typical career portal structure with Apply button and headings', () => {
      document.body.innerHTML = `
        <div class="job-container">
          <h1 class="job-title">Senior React Engineer</h1>
          <h2 class="company-name">Acme Corp</h2>
          <div class="job-description">
            <h3>Job Description</h3>
            <p>We are seeking an experienced React developer to build modern user experiences.</p>
            <h3>Responsibilities</h3>
            <p>Develop components and architect state workflows.</p>
            <h3>Requirements</h3>
            <p>Must have 4+ years of React and TypeScript expertise.</p>
          </div>
          <button id="apply-btn" class="apply-button">Apply Now</button>
        </div>
      `;

      const detection = detector.detectJob(document);
      expect(detection.isJobPage).toBe(true);
      expect(detection.source).toBe('GENERIC');
      expect(detection.job?.title).toBe('Senior React Engineer');
    });
  });

  describe('JobExtractor', () => {
    it('extracts structured job details correctly from JSON-LD schema', () => {
      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Senior Frontend Engineer',
        hiringOrganization: {
          '@type': 'Organization',
          name: 'Vercel'
        },
        jobLocationType: 'TELECOMMUTE',
        jobLocation: {
          address: {
            addressLocality: 'San Francisco',
            addressRegion: 'CA'
          }
        },
        description: 'Vercel is hiring a Senior Frontend Engineer. You will build world-class React and Next.js developer tools.',
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        baseSalary: {
          value: {
            minValue: 160000,
            maxValue: 210000,
            unitText: 'YEAR'
          },
          currency: 'USD'
        }
      };

      const job = extractor.extractFromJsonLd(jsonLdData, 'https://vercel.com/careers/123');

      expect(job).not.toBeNull();
      expect(job.title).toBe('Senior Frontend Engineer');
      expect(job.company).toBe('Vercel');
      expect(job.skills).toContain('React');
      expect(job.skills).toContain('TypeScript');
      expect(job.source).toBe('JSON_LD');
    });

    it('extracts job details from Greenhouse ATS DOM layout', () => {
      document.body.innerHTML = `
        <div id="app_body">
          <div id="header">
            <h1 class="app-title">Senior Infrastructure Engineer</h1>
            <span class="company-name">at GitHub</span>
          </div>
          <div class="location">San Francisco, CA (Remote)</div>
          <div id="content">
            <p>We are looking for an engineer with experience in Docker, Kubernetes, and Go.</p>
            <div class="section">
              <h3>Requirements</h3>
              <ul>
                <li>5+ years backend systems experience</li>
                <li>Proficiency in Go, Docker, and Kubernetes</li>
              </ul>
            </div>
          </div>
          <a id="apply_button" href="/github/jobs/12345/apply">Apply for this Job</a>
        </div>
      `;

      const adapterResult = extractor.extractFromPlatformAdapter(document);

      expect(adapterResult).not.toBeNull();
      expect(adapterResult?.source).toBe('GREENHOUSE');
      expect(adapterResult?.job.title).toBe('Senior Infrastructure Engineer');
      expect(adapterResult?.job.company).toBe('GitHub');
      expect(adapterResult?.job.location).toContain('San Francisco');
    });

    it('extracts job details from generic DOM content', () => {
      document.body.innerHTML = `
        <div class="careers-job">
          <h1>Full Stack Engineer</h1>
          <h2 class="company">Meta</h2>
          <div class="description">
            <p>Meta is looking for a Full Stack Engineer to build next-generation collaboration tools.</p>
            <p>Experience with React, GraphQL, and Python is required.</p>
          </div>
          <button class="apply-button">Apply Now</button>
        </div>
      `;

      const job = extractor.extractFromGenericDom(document);

      expect(job).not.toBeNull();
      expect(job.title).toBe('Full Stack Engineer');
      expect(job.skills).toContain('React');
    });
  });

  describe('JobMatchService', () => {
    it('calculates accurate multi-dimensional match score between user profile and extracted job', () => {
      const job = {
        title: 'Senior Full-Stack Engineer',
        company: 'Cloudinary',
        location: 'Remote, US',
        remote: true,
        description: 'Looking for a Senior Full-Stack Engineer with strong TypeScript, React, and Node.js skills to scale our digital asset platform.',
        requirements: ['5+ years full-stack experience', 'Expert knowledge of TypeScript and React', 'Experience building Node.js APIs and Docker containers'],
        skills: ['TypeScript', 'React', 'Node.js', 'Docker', 'AWS'],
        source: 'JSON_LD' as const,
        sourceConfidence: 0.95
      };

      const match = matchService.matchJobWithProfile(job, mockUserProfile);

      expect(match).not.toBeNull();
      expect(match.overallScore).toBeGreaterThan(60);
      expect(match.matchedSkills).toContain('TypeScript');
      expect(match.matchedSkills).toContain('React');
      expect(match.matchedSkills).toContain('Node.js');
      expect(match.missingSkills).toContain('AWS');
      expect(match.skillsScore).toBeGreaterThan(50);
      expect(match.experienceScore).toBeGreaterThan(0);
      expect(match.explanation).toBeDefined();
      expect(match.strengths.length).toBeGreaterThan(0);
    });

    it('identifies missing skills when candidate profile lacks specific requirements', () => {
      const job = {
        title: 'Rust & Solana Core Engineer',
        company: 'Solana Labs',
        location: 'Remote',
        remote: true,
        description: 'Develop low-level consensus engines in Rust, WebAssembly, and C++.',
        requirements: ['Rust', 'Solana', 'WebAssembly', 'C++'],
        skills: ['Rust', 'Solana', 'WebAssembly', 'C++'],
        source: 'GENERIC' as const,
        sourceConfidence: 0.8
      };

      const match = matchService.matchJobWithProfile(job, mockUserProfile);

      expect(match).not.toBeNull();
      expect(match.missingSkills).toContain('Rust');
      expect(match.missingSkills).toContain('Solana');
      expect(match.overallScore).toBeLessThan(70);
    });
  });
});
