import { describe, it, expect } from 'vitest';
import { ProfileService, DEFAULT_COMPLETION_WEIGHTS } from '../src/services/profileService';

describe('Configurable Weighted Profile Completion System', () => {
  const profileService = new ProfileService();

  it('verifies configurable weights sum to exactly 100%', () => {
    const weights = DEFAULT_COMPLETION_WEIGHTS;
    const totalWeight =
      weights.personal +
      weights.education +
      weights.skills +
      weights.experience +
      weights.projects +
      weights.resume +
      weights.preferences;

    expect(totalWeight).toBe(100);
    expect(weights.personal).toBe(15);
    expect(weights.education).toBe(15);
    expect(weights.skills).toBe(20);
    expect(weights.experience).toBe(20);
    expect(weights.projects).toBe(15);
    expect(weights.resume).toBe(10);
    expect(weights.preferences).toBe(5);
  });

  it('calculates completion category scores and suggests missing sections', () => {
    const mockProfileDoc: any = {
      personal: {
        firstName: 'Saquib',
        lastName: 'Sarfaraz',
        email: 'test@example.com',
        phone: '+1234567890',
        city: 'SF',
        country: 'USA'
      },
      educations: [
        { institution: 'MIT', degree: "Bachelor's", fieldOfStudy: 'CS', startDate: '2018' }
      ],
      professional: {
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker']
      },
      experiences: [
        { company: 'Tech Corp', jobTitle: 'Engineer', startDate: '2020' }
      ],
      projects: [],
      preferences: {
        targetRoles: ['Full-Stack Developer']
      }
    };

    const breakdown = profileService.calculateCompletionBreakdown(mockProfileDoc, true);

    expect(breakdown.categories.education.score).toBe(15);
    expect(breakdown.categories.skills.score).toBe(20);
    expect(breakdown.categories.experience.score).toBe(20);
    expect(breakdown.categories.resume.score).toBe(10);
    expect(breakdown.categories.preferences.score).toBe(5);
    expect(breakdown.categories.projects.score).toBe(0); // missing project
    expect(breakdown.missingSuggestions).toContain('Add at least one Project (+15%)');
    expect(breakdown.total).toBeGreaterThanOrEqual(80);
  });
});
