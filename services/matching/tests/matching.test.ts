import { describe, it, expect } from 'vitest';
import { JobMatchingEngine } from '../src';
import { IUserProfile, ID1Job } from '@kraxyy/types';

describe('Standalone Matching Engine Package', () => {
  const engine = new JobMatchingEngine();

  const fullStackProfile: IUserProfile = {
    userId: 'u1',
    personal: { firstName: 'Saquib', lastName: 'Sarfaraz', email: 'saquib@kraxyy.ai', phone: '123', country: 'India', city: 'Bengaluru' },
    professional: {
      currentTitle: 'Full Stack Developer',
      skills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'REST API', 'Next.js', 'Tailwind', 'TypeScript'],
      yearsOfExperience: 3,
      summary: 'Experienced Full Stack developer specializing in modern web applications.'
    },
    educations: [{ id: 'e1', institution: 'University', degree: 'B.Tech CS', fieldOfStudy: 'Computer Science', startDate: '2019' }],
    experiences: [{ id: 'exp1', company: 'Tech Corp', jobTitle: 'Full Stack Developer', startDate: '2021', isCurrent: true, technologies: ['React', 'Node.js'] }],
    projects: [],
    certifications: [],
    languages: [],
    workAuthorization: { authorizedToWork: true, sponsorshipRequired: false },
    completionPercentage: 90,
    updatedAt: new Date().toISOString()
  };

  const fullStackJob: ID1Job = {
    id: 'j-fs',
    title: 'Associate — Full Stack Developer',
    company: 'Bain & Company',
    location: 'Delhi, India',
    remote: false,
    remoteType: 'HYBRID',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    description: 'Looking for a Full Stack Developer with React, JavaScript, Node.js, and AWS.',
    skills: ['React', 'JavaScript', 'Node.js', 'AWS', 'Docker'],
    applyUrl: 'https://bain.com/jobs/1',
    source: 'Company',
    postedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    hash: 'hash-fs',
    status: 'ACTIVE'
  };

  const financialAnalystJob: ID1Job = {
    id: 'j-fa',
    title: 'Financial Analyst Internship',
    company: 'UMIT PRIVATE LIMITED',
    location: 'Mumbai, India',
    remote: false,
    remoteType: 'ONSITE',
    employmentType: 'INTERNSHIP',
    experienceLevel: 'ENTRY',
    description: 'Finance intern responsible for financial modeling, DCF valuation, balance sheet analysis, Excel reporting, and communication with clients.',
    skills: ['Financial Modeling', 'Excel', 'Valuation', 'Accounting', 'Communication'],
    applyUrl: 'https://umit.com/jobs/fa',
    source: 'LinkedIn',
    postedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    hash: 'hash-fa',
    status: 'ACTIVE'
  };

  it('calculates accurate match and returns version v1.0.0', () => {
    const res = engine.calculateMatch(fullStackProfile, fullStackJob);
    expect(res.engineVersion).toBe('1.0.0');
    expect(res.overallScore).toBeGreaterThanOrEqual(70);
    expect(res.matchedSkills).toContain('React');
    expect(res.missingSkills).toContain('AWS');
  });

  // TEST 1: Full Stack Resume vs Financial Analyst Job -> LOW / NOT A MATCH
  it('TEST 1: correctly triggers Role-Family gate for Full Stack Resume vs Financial Analyst Job (caps score <= 25%)', () => {
    const res = engine.calculateMatch(fullStackProfile, financialAnalystJob);
    expect(res.roleRelevance).toBe('MISMATCH');
    expect(res.overallScore).toBeLessThanOrEqual(25);
    expect(res.overallScore).toBeGreaterThanOrEqual(10);
    expect(['Low Match', 'Not a Match']).toContain(res.qualityLabel);
    expect(res.roleMismatchReason).toContain('Finance');
    expect(res.roleMismatchReason).toContain('Software Development');
    expect(res.experienceVerdict).toBe('MISMATCH');
    expect(res.resumeIssues?.length).toBeGreaterThan(0);
  });

  // TEST 2: Full Stack Resume vs Full Stack Developer Job -> STRONG/GOOD MATCH
  it('TEST 2: gives high/strong match when requirements align (Full Stack vs Full Stack)', () => {
    const res = engine.calculateMatch(fullStackProfile, fullStackJob);
    expect(res.roleRelevance).toBe('STRONG');
    expect(res.overallScore).toBeGreaterThanOrEqual(75);
    expect(['Strong Match', 'Good Match']).toContain(res.qualityLabel);
    expect(res.coreMatchedSkills).toContain('React');
    expect(res.missingSkillsDetailed?.some(m => m.skill === 'AWS')).toBe(true);
    expect(res.experienceVerdict).toBe('MATCH');
  });

  // TEST 3: Frontend Developer vs Backend Developer Job -> Partial/Moderate
  it('TEST 3: handles Frontend Developer vs Backend Developer correctly as Partial/Moderate', () => {
    const frontendProfile: IUserProfile = {
      ...fullStackProfile,
      professional: {
        ...fullStackProfile.professional,
        currentTitle: 'Frontend Developer',
        skills: ['React', 'CSS', 'HTML', 'JavaScript', 'Tailwind']
      }
    };
    const backendJob: ID1Job = {
      ...fullStackJob,
      title: 'Senior Backend Engineer',
      description: 'Go, Kubernetes, PostgreSQL, Distributed Systems, Microservices',
      skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Docker', 'Distributed Systems']
    };

    const res = engine.calculateMatch(frontendProfile, backendJob);
    // Both in SOFTWARE_ENGINEERING, but different specialized titles & zero backend skills
    expect(res.roleFamilyCandidate).toBe('SOFTWARE_ENGINEERING');
    expect(res.roleFamilyJob).toBe('SOFTWARE_ENGINEERING');
    expect(res.overallScore).toBeLessThan(65);
  });

  // TEST 4: Data Analyst vs Financial Analyst Job -> Adjacent/Potentially relevant
  it('TEST 4: handles Data Analyst vs Financial Analyst as potentially relevant adjacent domains', () => {
    const dataProfile: IUserProfile = {
      ...fullStackProfile,
      professional: {
        ...fullStackProfile.professional,
        currentTitle: 'Data Analyst',
        skills: ['Python', 'SQL', 'Excel', 'Data Analysis', 'Tableau', 'Statistics']
      }
    };

    const res = engine.calculateMatch(dataProfile, financialAnalystJob);
    expect(res.roleFamilyCandidate).toBe('DATA');
    expect(res.roleFamilyJob).toBe('FINANCE');
    expect(res.roleRelevance).toBe('MODERATE');
    expect(res.overallScore).toBeGreaterThan(30);
  });
});
