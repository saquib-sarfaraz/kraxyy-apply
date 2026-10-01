// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { evaluatePageIntelligence } from './index';
import { FormDetectionSummary } from './detector';
import { IJobPageDetection, IMatchBreakdown } from '@kraxyy/types';

describe('Unified Page Intelligence Engine Suite', () => {
  const mockMatch: IMatchBreakdown = {
    overallScore: 88,
    skillsScore: 90,
    experienceScore: 85,
    educationScore: 90,
    roleScore: 85,
    locationScore: 90,
    matchedSkills: ['React', 'TypeScript', 'Node.js'],
    missingSkills: ['AWS'],
    strengths: ['Direct alignment with React and TypeScript'],
    concerns: ['Lacks AWS experience'],
    explanation: 'Candidate matches 88% of job criteria.',
    engineVersion: '1.0.0'
  };

  const mockJobDetection: IJobPageDetection = {
    isJobPage: true,
    confidence: 0.95,
    source: 'GREENHOUSE',
    characterCount: 1500,
    job: {
      title: 'Senior Frontend Engineer',
      company: 'GitHub',
      location: 'San Francisco, CA (Remote)',
      remote: true,
      description: 'Build world-class developer interfaces with React and TypeScript.',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      source: 'Greenhouse',
      sourceUrl: 'https://boards.greenhouse.io/github/jobs/12345',
      applyUrl: 'https://boards.greenhouse.io/github/jobs/12345/apply'
    },
    match: mockMatch
  };

  const mockFormDetection: FormDetectionSummary = {
    isApplicationForm: true,
    confidence: 0.92,
    fields: [
      {
        id: 'first_name',
        selector: '#first_name',
        tagName: 'input',
        taxonomyType: 'FIRST_NAME',
        confidence: 0.95
      },
      {
        id: 'last_name',
        selector: '#last_name',
        tagName: 'input',
        taxonomyType: 'LAST_NAME',
        confidence: 0.95
      },
      {
        id: 'email',
        selector: '#email',
        tagName: 'input',
        taxonomyType: 'EMAIL',
        confidence: 0.98
      },
      {
        id: 'resume',
        selector: '#resume',
        tagName: 'input',
        taxonomyType: 'RESUME',
        status: 'MANUAL_REQUIRED',
        confidence: 0.85
      }
    ]
  };

  describe('Page Type Classification', () => {
    it('classifies as JOB_AND_APPLICATION when both job posting and application form exist on page', () => {
      const state = evaluatePageIntelligence(
        mockFormDetection,
        mockJobDetection,
        mockMatch,
        'https://boards.greenhouse.io/github/jobs/12345',
        true
      );

      expect(state.pageType).toBe('JOB_AND_APPLICATION');
      expect(state.job?.detected).toBe(true);
      expect(state.job?.normalizedJob?.title).toBe('Senior Frontend Engineer');
      expect(state.job?.match?.overallScore).toBe(88);

      expect(state.form?.detected).toBe(true);
      expect(state.form?.fieldCount).toBe(4);
      expect(state.form?.fillableFieldCount).toBe(3); // 3 fillable, 1 MANUAL_REQUIRED

      expect(state.activeContext).toBeDefined();
      expect(state.activeContext?.jobTitle).toBe('Senior Frontend Engineer');
      expect(state.activeContext?.company).toBe('GitHub');
      expect(state.activeContext?.matchScore).toBe(88);
    });

    it('classifies as JOB when only job description is present without form inputs', () => {
      const emptyForm: FormDetectionSummary = {
        isApplicationForm: false,
        confidence: 0,
        fields: []
      };

      const state = evaluatePageIntelligence(
        emptyForm,
        mockJobDetection,
        mockMatch,
        'https://www.linkedin.com/jobs/view/987654',
        true
      );

      expect(state.pageType).toBe('JOB');
      expect(state.job?.detected).toBe(true);
      expect(state.job?.normalizedJob?.company).toBe('GitHub');
      expect(state.form).toBeUndefined();
      expect(state.activeContext?.matchScore).toBe(88);
    });

    it('classifies as APPLICATION when only form is present on an external application page', () => {
      const noJob: IJobPageDetection = {
        isJobPage: false,
        confidence: 0,
        source: 'GENERIC'
      };

      const state = evaluatePageIntelligence(
        mockFormDetection,
        noJob,
        null,
        'https://jobs.lever.co/company/form',
        true
      );

      expect(state.pageType).toBe('APPLICATION');
      expect(state.job).toBeUndefined();
      expect(state.form?.detected).toBe(true);
      expect(state.form?.fieldCount).toBe(4);
      expect(state.form?.fillableFieldCount).toBe(3);
    });

    it('classifies as OTHER when neither job nor form is detected', () => {
      const emptyForm: FormDetectionSummary = {
        isApplicationForm: false,
        confidence: 0,
        fields: []
      };
      const noJob: IJobPageDetection = {
        isJobPage: false,
        confidence: 0,
        source: 'GENERIC'
      };

      const state = evaluatePageIntelligence(
        emptyForm,
        noJob,
        null,
        'https://example.com/blog/article',
        true
      );

      expect(state.pageType).toBe('OTHER');
      expect(state.job).toBeUndefined();
      expect(state.form).toBeUndefined();
    });
  });

  describe('Active Context Synchronization', () => {
    it('automatically extracts active context from detected job for autofill intelligence', () => {
      const state = evaluatePageIntelligence(
        mockFormDetection,
        mockJobDetection,
        mockMatch,
        'https://boards.greenhouse.io/github/jobs/12345',
        true
      );

      expect(state.activeContext).toBeDefined();
      expect(state.activeContext?.jobTitle).toBe('Senior Frontend Engineer');
      expect(state.activeContext?.company).toBe('GitHub');
      expect(state.activeContext?.matchScore).toBe(88);
      expect(state.activeContext?.sourceUrl).toBe('https://boards.greenhouse.io/github/jobs/12345');
    });
  });
});
