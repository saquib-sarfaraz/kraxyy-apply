import { describe, it, expect } from 'vitest';
import { JobMatchingEngine } from '@kraxyy/matching';
import { IUserProfile, ID1Job } from '@kraxyy/types';

describe('Versioned Job Matching Engine v1.0.0', () => {
  const engine = new JobMatchingEngine();

  const mockProfile: IUserProfile = {
    userId: 'user-123',
    personal: {
      firstName: 'Saquib',
      lastName: 'Sarfaraz',
      email: 'saquib@example.com',
      phone: '+1234567890',
      country: 'USA',
      city: 'San Francisco'
    },
    professional: {
      currentTitle: 'Senior Full-Stack Engineer',
      skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'REST API', 'Docker'],
      yearsOfExperience: 6
    },
    educations: [
      {
        id: 'edu-1',
        institution: 'University of California',
        degree: "Bachelor's of Science",
        fieldOfStudy: 'Computer Science',
        startDate: '2014',
        endDate: '2018'
      }
    ],
    experiences: [
      {
        id: 'exp-1',
        company: 'Cloud Corp',
        jobTitle: 'Senior Full-Stack Engineer',
        startDate: '2018-06',
        isCurrent: true,
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL']
      }
    ],
    projects: [],
    certifications: [],
    languages: [],
    workAuthorization: { authorizedToWork: true, sponsorshipRequired: false },
    preferences: {
      targetRoles: ['Full-Stack Engineer', 'Senior Software Engineer'],
      locations: ['San Francisco'],
      remote: true,
      internship: false,
      fullTime: true,
      experienceLevel: 'SENIOR',
      industries: ['Tech']
    },
    completionPercentage: 90,
    updatedAt: new Date().toISOString()
  };

  const mockJob: ID1Job = {
    id: 'job-1',
    title: 'Senior Full-Stack Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    remote: true,
    remoteType: 'REMOTE',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    description: 'Build mission-critical payment infrastructure using React, TypeScript, Node.js, and Docker.',
    skills: ['React', 'TypeScript', 'Node.js', 'Docker', 'GraphQL'],
    applyUrl: 'https://stripe.com/jobs/1',
    source: 'Greenhouse',
    postedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    hash: 'hash1',
    status: 'ACTIVE'
  };

  it('calculates comprehensive multi-factor match score with versioned engine', () => {
    const result = engine.calculateMatch(mockProfile, mockJob);

    expect(result.engineVersion).toBe('1.0.0');
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.skillsScore).toBeGreaterThan(0);
    expect(result.roleScore).toBe(100); // Exact title match
    expect(result.experienceScore).toBeGreaterThanOrEqual(90); // 6 yrs meets senior criteria
    expect(result.locationScore).toBe(100); // Remote & SF location
  });

  it('identifies matched and missing skills accurately', () => {
    const result = engine.calculateMatch(mockProfile, mockJob);

    expect(result.matchedSkills).toContain('React');
    expect(result.matchedSkills).toContain('TypeScript');
    expect(result.matchedSkills).toContain('Node.js');
    expect(result.matchedSkills).toContain('Docker');
    expect(result.missingSkills).toContain('GraphQL');
  });

  it('generates transparent strengths, concerns, and human-readable explanation', () => {
    const result = engine.calculateMatch(mockProfile, mockJob);

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.explanation).toContain('Stripe');
    expect(result.explanation).toContain('Senior Full-Stack Engineer');
    expect(result.explanation).toContain('%');
  });
});
