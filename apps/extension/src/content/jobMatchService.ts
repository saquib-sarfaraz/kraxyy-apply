import { INormalizedJob, IUserProfile, IMatchBreakdown, FieldTaxonomyType } from '@kraxyy/types';
import { JobMatchingEngine } from '@kraxyy/matching';

export class JobMatchService {
  private engine: JobMatchingEngine;

  constructor() {
    this.engine = new JobMatchingEngine();
  }

  /**
   * Compares an extracted job against the user profile.
   * Can accept either a full IUserProfile or a cached profile taxonomy dictionary.
   */
  matchJobWithProfile(
    job: INormalizedJob,
    profileData: IUserProfile | Record<FieldTaxonomyType, string | boolean>
  ): IMatchBreakdown {
    const userProfile = this.normalizeUserProfile(profileData);
    return this.engine.calculateMatch(userProfile, job);
  }

  private normalizeUserProfile(
    data: IUserProfile | Record<FieldTaxonomyType, string | boolean>
  ): IUserProfile {
    // If it's already a full profile with personal/professional
    if ('personal' in data && 'professional' in data) {
      return data as IUserProfile;
    }

    // Otherwise reconstruct IUserProfile from cached taxonomy dictionary
    const dict = data as Record<string, string | boolean>;
    const skillsList = typeof dict.SKILLS === 'string'
      ? dict.SKILLS.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      id: 'cached-user',
      userId: 'cached-user',
      personal: {
        firstName: String(dict.FIRST_NAME || ''),
        lastName: String(dict.LAST_NAME || ''),
        email: String(dict.EMAIL || ''),
        phone: String(dict.PHONE || ''),
        city: String(dict.CITY || ''),
        stateOrProvince: String(dict.STATE || ''),
        postalCode: String(dict.POSTAL_CODE || ''),
        country: String(dict.COUNTRY || 'United States'),
        linkedin: String(dict.LINKEDIN || ''),
        github: String(dict.GITHUB || ''),
        portfolio: String(dict.PORTFOLIO || '')
      },
      professional: {
        currentTitle: String(dict.CURRENT_JOB_TITLE || dict.CURRENT_TITLE || dict.JOB_TITLE || ''),
        yearsOfExperience: parseInt(String(dict.YEARS_EXPERIENCE || '3'), 10) || 3,
        skills: skillsList,
        summary: String(dict.SUMMARY || '')
      },
      educations: [
        {
          id: 'edu-1',
          institution: String(dict.UNIVERSITY || dict.EDUCATION_SCHOOL || 'University'),
          degree: String(dict.DEGREE || dict.EDUCATION_DEGREE || "Bachelor's"),
          fieldOfStudy: String(dict.FIELD_OF_STUDY || 'Computer Science'),
          startDate: '2019',
          endDate: String(dict.GRADUATION_DATE || '2023')
        }
      ],
      experiences: [
        {
          id: 'exp-1',
          company: String(dict.CURRENT_COMPANY || dict.RECENT_COMPANY || dict.COMPANY || 'Company'),
          jobTitle: String(dict.CURRENT_JOB_TITLE || dict.CURRENT_TITLE || dict.JOB_TITLE || 'Software Engineer'),
          startDate: '2022',
          isCurrent: true,
          technologies: skillsList
        }
      ],
      projects: [],
      certifications: [],
      languages: [],
      workAuthorization: {
        authorizedToWork: Boolean(dict.WORK_AUTHORIZATION ?? true),
        sponsorshipRequired: Boolean(dict.SPONSORSHIP_REQUIRED ?? dict.VISA_SPONSORSHIP ?? false)
      },
      preferences: {
        targetRoles: [String(dict.CURRENT_JOB_TITLE || dict.CURRENT_TITLE || dict.JOB_TITLE || '')].filter(Boolean),
        locations: [String(dict.CITY || '')].filter(Boolean),
        remote: true,
        internship: false,
        fullTime: true,
        experienceLevel: 'MID',
        industries: []
      },
      completionPercentage: 90,
      updatedAt: new Date().toISOString()
    };
  }
}

export const jobMatchService = new JobMatchService();
